import type { ParserServices, TSESLint, TSESTree } from '@typescript-eslint/utils';
import type { TypeChecker } from 'typescript';
import { COMPOSABLES_FUNCTION_PATTERN, REACTIVE_FUNCTIONS } from '../constants/constant';
import {
  isArrayExpression,
  isArrayPattern,
  isCallExpression,
  isIdentifier,
  isMemberExpression,
  isObjectPattern,
  isProperty,
  isTSNonNullExpression,
  isVariableDeclaration,
  isVariableDeclarator,
} from '../helpers/ast-helper';
import {
  hasIdentifierCallee,
  isArgumentOfIgnoredFunction,
  isComposablesFunctionArgument,
  isIdentifierPropertyPair,
  isPropertyValue,
  isSpecialFunctionArgument,
  isWatchArgument,
} from '../helpers/function-checks';
import { createReportData, getTypeCheckingServices, getTypeString } from '../helpers/types';
import type { CallExpressionWithIdentifierCallee, ObjectPatternCallExpressionDeclarator } from '../types/estree';
import { createEslintRule, memoize } from '../utils';

const MESSAGE_ID = 'require-reactive-value-suffix' as const;

/**
 * ルールのメッセージID型
 */
type MessageIds = typeof MESSAGE_ID;

/**
 * ルールオプション
 */
type RuleOptions = { functionNamesToIgnoreValueCheck?: string[] };

/**
 * ルールコンテキスト
 */
type RuleContext = Readonly<TSESLint.RuleContext<MessageIds, RuleOptions[]>>;

/**
 * 変数が.valueサフィックスを必要とするかどうかを判断する
 *
 * @param variableNode 確認する識別子ノード
 * @param typeChecker TypeScript型チェッカー
 * @param parserServices TypeScript ESLintのパーサーサービス
 */
const needsValueSuffix = (
  variableNode: TSESTree.Identifier,
  typeChecker: TypeChecker,
  parserServices: ParserServices,
): boolean => {
  const variableTypeString = getTypeString(variableNode, typeChecker, parserServices);

  const isRefTypeVariable = variableTypeString.includes('Ref');
  const isValueSuffixMissing = !variableTypeString.includes('.value');
  const hasNonNullAssertion = isTSNonNullExpression(variableNode.parent);

  return isRefTypeVariable && isValueSuffixMissing && !hasNonNullAssertion;
};

/**
 * ソースコードからすべての変数宣言子を取得する
 *
 * @param ruleContext ESLintルールコンテキスト
 */
const getAllVariableDeclarators = (ruleContext: RuleContext): TSESTree.VariableDeclarator[] => {
  return ruleContext.sourceCode.ast.body.flatMap((sourceNode) => {
    if (isVariableDeclaration(sourceNode)) {
      return sourceNode.declarations;
    }
    return [];
  });
};

/**
 * storeToRefs宣言から変数名を抽出する
 *
 * @param ruleContext ESLintルールコンテキスト
 */
const getStoreToRefsVariableNames = (ruleContext: RuleContext): string[] => {
  /**
   * 宣言がstoreToRefsの呼び出しかどうかを確認する
   *
   * @param declaration 確認する変数宣言子
   */
  const isStoreToRefsDeclaration = (declaration: TSESTree.VariableDeclarator): boolean =>
    isObjectPattern(declaration.id) &&
    !!declaration.init &&
    isCallExpression(declaration.init) &&
    hasIdentifierCallee(declaration.init) &&
    declaration.init.callee.name === 'storeToRefs';

  /**
   * オブジェクトパターンから識別子名を抽出する
   *
   * @param declaration 変数宣言子
   */
  const extractIdentifierNames = (declaration: TSESTree.VariableDeclarator): string[] => {
    if (!isObjectPattern(declaration.id)) return [];

    return declaration.id.properties.filter(isIdentifierPropertyPair).map((property) => property.value.name);
  };

  return getAllVariableDeclarators(ruleContext).filter(isStoreToRefsDeclaration).flatMap(extractIdentifierNames);
};

/**
 * ソースコードからすべてのリアクティブ変数名を取得する
 *
 * @param ruleContext ESLintルールコンテキスト
 */
const getAllReactiveVariableNames = (ruleContext: RuleContext): string[] => {
  /**
   * 宣言がリアクティブ関数の呼び出しで初期化されているかどうかを確認する
   *
   * @param declaration 確認する変数宣言子
   */
  const isReactiveFunctionCall = (declaration: TSESTree.VariableDeclarator): boolean =>
    !!declaration.init &&
    isCallExpression(declaration.init) &&
    hasIdentifierCallee(declaration.init) &&
    REACTIVE_FUNCTIONS.includes(declaration.init.callee.name as (typeof REACTIVE_FUNCTIONS)[number]);

  /**
   * 宣言子から変数名を抽出する
   *
   * @param declaration 変数宣言子
   */
  const extractVariableNames = (declaration: TSESTree.VariableDeclarator): string[] => {
    if (isIdentifier(declaration.id)) {
      return [declaration.id.name];
    }

    if (isObjectPattern(declaration.id)) {
      const identifierProperties = declaration.id.properties.filter(
        (property): property is TSESTree.Property & { value: TSESTree.Identifier } =>
          isProperty(property) && isIdentifier(property.value),
      );

      return identifierProperties.map((property) => property.value.name);
    }

    return [];
  };

  const reactiveVariableNames = getAllVariableDeclarators(ruleContext)
    .filter((declaration): declaration is TSESTree.VariableDeclarator & { init: CallExpressionWithIdentifierCallee } =>
      isReactiveFunctionCall(declaration),
    )
    .flatMap(extractVariableNames);

  const storeToRefsVariableNames = getStoreToRefsVariableNames(ruleContext);

  return [...reactiveVariableNames, ...storeToRefsVariableNames];
};

/**
 * コンポーザブル関数の呼び出しから変数名を取得する
 *
 * @param ruleContext ESLintルールコンテキスト
 */
const getComposableFunctionVariableNames = (ruleContext: RuleContext): string[] => {
  /**
   * 宣言がコンポーザブル関数の呼び出しで初期化されているかどうかを確認する
   *
   * @param declaration 確認する変数宣言子
   */
  const isComposableFunctionCall = (declaration: TSESTree.VariableDeclarator): boolean =>
    !!declaration.init &&
    isCallExpression(declaration.init) &&
    hasIdentifierCallee(declaration.init) &&
    COMPOSABLES_FUNCTION_PATTERN.test(declaration.init.callee.name);

  /**
   * オブジェクトパターンからプロパティ変数名を抽出する
   *
   * @param declaration 変数宣言子
   */
  const extractPropertyVariableNames = (declaration: TSESTree.VariableDeclarator): string[] => {
    if (!isObjectPattern(declaration.id)) return [];

    return declaration.id.properties.filter(isIdentifierPropertyPair).map((property) => property.value.name);
  };

  return getAllVariableDeclarators(ruleContext)
    .filter((declaration): declaration is ObjectPatternCallExpressionDeclarator =>
      isComposableFunctionCall(declaration),
    )
    .flatMap(extractPropertyVariableNames);
};

/**
 * 特定の識別子ノードに対する警告を抑制すべきかどうかを判断する
 *
 * @param node 確認する識別子ノード
 * @param parent 親ノード
 * @param composableFunctions コンポーザブル関数名のリスト
 * @param ignoredFunctionNames 無視する関数名のリスト
 */
const shouldSuppressWarning = (
  node: TSESTree.Identifier,
  parent: TSESTree.Node,
  composableFunctions: ReadonlyArray<string>,
  ignoredFunctionNames: ReadonlyArray<string>,
): boolean => {
  const isAliasedDestructuring = isProperty(parent) && parent.value === node && isObjectPattern(parent.parent);

  const isInDeclarationContext =
    isVariableDeclarator(parent) ||
    isArrayPattern(parent) ||
    (parent.parent && isPropertyValue(parent)) ||
    isAliasedDestructuring;

  const isPropertyAccess =
    (isMemberExpression(parent) && isIdentifier(parent.property) && parent.property.name === 'value') ||
    (isMemberExpression(parent) && parent.property !== node) ||
    (isProperty(parent) && parent.key === node) ||
    isPropertyValue(parent);

  const isSpecialArgument =
    isWatchArgument(node) ||
    isSpecialFunctionArgument(node, composableFunctions) ||
    isArgumentOfIgnoredFunction(node, ignoredFunctionNames) ||
    isComposablesFunctionArgument(node);

  const isInLiteral = isArrayExpression(node.parent);

  return isInDeclarationContext || isPropertyAccess || isSpecialArgument || isInLiteral;
};

/**
 * 識別子ノードを処理して.valueサフィックスが必要かどうかを確認する
 *
 * @param identifierNode 処理する識別子ノード
 * @param ruleContext ESLintルールコンテキスト
 * @param reactiveVariableNames リアクティブ変数名のリスト
 * @param composableFunctionVariableNames コンポーザブル関数変数名のリスト
 * @param ignoredFunctionNames 無視する関数名のリスト
 */
const processIdentifierNode = (
  identifierNode: TSESTree.Identifier,
  ruleContext: RuleContext,
  reactiveVariableNames: ReadonlyArray<string>,
  composableFunctionVariableNames: ReadonlyArray<string>,
  ignoredFunctionNames: ReadonlyArray<string>,
): void => {
  if (!identifierNode.parent || !reactiveVariableNames.includes(identifierNode.name)) return;

  if (
    shouldSuppressWarning(identifierNode, identifierNode.parent, composableFunctionVariableNames, ignoredFunctionNames)
  ) {
    return;
  }

  const { parserServices, typeChecker } = getTypeCheckingServices(ruleContext);

  if (needsValueSuffix(identifierNode, typeChecker, parserServices)) {
    ruleContext.report(createReportData(identifierNode, MESSAGE_ID));
  }
};

/**
 * メンバー式ノードを処理してそのオブジェクトに.valueサフィックスが必要かどうかを確認する
 *
 * @param memberExpressionNode 処理するメンバー式ノード
 * @param ruleContext ESLintルールコンテキスト
 * @param reactiveVariableNames リアクティブ変数名のリスト
 */
const processMemberExpressionNode = (
  memberExpressionNode: TSESTree.MemberExpression,
  ruleContext: RuleContext,
  reactiveVariableNames: ReadonlyArray<string>,
): void => {
  if (!isIdentifier(memberExpressionNode.object) || !reactiveVariableNames.includes(memberExpressionNode.object.name)) {
    return;
  }

  if (isIdentifier(memberExpressionNode.property) && memberExpressionNode.property.name === 'value') {
    return;
  }

  if (isPropertyValue(memberExpressionNode.parent)) {
    return;
  }

  const { parserServices, typeChecker } = getTypeCheckingServices(ruleContext);

  if (needsValueSuffix(memberExpressionNode.object, typeChecker, parserServices)) {
    ruleContext.report(createReportData(memberExpressionNode.object, MESSAGE_ID));
  }
};

/**
 * Vue.jsでリアクティブな値にアクセスする際に.valueサフィックスの使用を強制するESLintルール
 *
 * このルールはリアクティブな変数（例：ref, computed）を識別し、必要な.valueサフィックスなしで
 * アクセスした場合に報告します。
 *
 * @example
 * // 不正
 * const count = ref(0);
 * console.log(count); // .valueが不足
 *
 * // 正しい
 * const count = ref(0);
 * console.log(count.value);
 */
export const requireReactiveValueSuffix = createEslintRule({
  name: 'require-reactive-value-suffix',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce using .value suffix when accessing reactive values in Vue.js',
    },
    messages: {
      [MESSAGE_ID]: 'Reactive variable "{{name}}" should be accessed as "{{name}}.value"',
    },
    schema: [
      {
        type: 'object',
        properties: {
          functionNamesToIgnoreValueCheck: {
            type: 'array',
            items: { type: 'string' },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  /**
   * ルールの実装
   *
   * @param ruleContext ESLintルールコンテキスト
   */
  create(ruleContext: RuleContext) {
    const ruleOptions = ruleContext.options[0] || {};
    const functionNamesToIgnoreValueCheck = ruleOptions.functionNamesToIgnoreValueCheck || [];

    const getReactiveVariables = memoize(() => getAllReactiveVariableNames(ruleContext));
    const getComposableFunctions = memoize(() => getComposableFunctionVariableNames(ruleContext));
    const reactiveVariableList = getReactiveVariables();
    const composableFunctionList = getComposableFunctions();

    return {
      /**
       * 識別子ノードのハンドラ
       *
       * @param identifierNode 識別子ノード
       */
      Identifier(identifierNode) {
        processIdentifierNode(
          identifierNode,
          ruleContext,
          reactiveVariableList,
          composableFunctionList,
          functionNamesToIgnoreValueCheck,
        );
      },
      /**
       * メンバー式ノードのハンドラ
       *
       * @param memberExpressionNode メンバー式ノード
       */
      MemberExpression(memberExpressionNode) {
        processMemberExpressionNode(memberExpressionNode, ruleContext, reactiveVariableList);
      },
    };
  },
});
