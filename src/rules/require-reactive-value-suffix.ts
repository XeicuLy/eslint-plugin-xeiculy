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

type MessageIds = typeof MESSAGE_ID;
type RuleOptions = { functionNamesToIgnoreValueCheck?: string[] };
type RuleContext = Readonly<TSESLint.RuleContext<MessageIds, RuleOptions[]>>;

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

const getAllVariableDeclarators = (ruleContext: RuleContext): TSESTree.VariableDeclarator[] => {
  return ruleContext.sourceCode.ast.body.flatMap((sourceNode) => {
    if (isVariableDeclaration(sourceNode)) {
      return sourceNode.declarations;
    }
    return [];
  });
};

const getStoreToRefsVariableNames = (ruleContext: RuleContext): string[] => {
  const isStoreToRefsDeclaration = (declaration: TSESTree.VariableDeclarator): boolean =>
    isObjectPattern(declaration.id) &&
    !!declaration.init &&
    isCallExpression(declaration.init) &&
    hasIdentifierCallee(declaration.init) &&
    declaration.init.callee.name === 'storeToRefs';

  const extractIdentifierNames = (declaration: TSESTree.VariableDeclarator): string[] => {
    if (!isObjectPattern(declaration.id)) return [];

    return declaration.id.properties.filter(isIdentifierPropertyPair).map((property) => property.value.name);
  };

  return getAllVariableDeclarators(ruleContext).filter(isStoreToRefsDeclaration).flatMap(extractIdentifierNames);
};

const getAllReactiveVariableNames = (ruleContext: RuleContext): string[] => {
  const isReactiveFunctionCall = (declaration: TSESTree.VariableDeclarator): boolean =>
    !!declaration.init &&
    isCallExpression(declaration.init) &&
    hasIdentifierCallee(declaration.init) &&
    REACTIVE_FUNCTIONS.includes(declaration.init.callee.name as (typeof REACTIVE_FUNCTIONS)[number]);

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

const getComposableFunctionVariableNames = (ruleContext: RuleContext): string[] => {
  const isComposableFunctionCall = (declaration: TSESTree.VariableDeclarator): boolean =>
    !!declaration.init &&
    isCallExpression(declaration.init) &&
    hasIdentifierCallee(declaration.init) &&
    COMPOSABLES_FUNCTION_PATTERN.test(declaration.init.callee.name);

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
  create(ruleContext: RuleContext) {
    const ruleOptions = ruleContext.options[0] || {};
    const functionNamesToIgnoreValueCheck = ruleOptions.functionNamesToIgnoreValueCheck || [];

    const getReactiveVariables = memoize(() => getAllReactiveVariableNames(ruleContext));
    const getComposableFunctions = memoize(() => getComposableFunctionVariableNames(ruleContext));
    const reactiveVariableList = getReactiveVariables();
    const composableFunctionList = getComposableFunctions();

    return {
      Identifier(identifierNode) {
        processIdentifierNode(
          identifierNode,
          ruleContext,
          reactiveVariableList,
          composableFunctionList,
          functionNamesToIgnoreValueCheck,
        );
      },
      MemberExpression(memberExpressionNode) {
        processMemberExpressionNode(memberExpressionNode, ruleContext, reactiveVariableList);
      },
    };
  },
});
