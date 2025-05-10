import type { TSESTree } from '@typescript-eslint/utils';
import { COMPOSABLES_FUNCTION_PATTERN } from '../constants/constant';
import type { CallExpressionWithIdentifierCallee, PropertyWithIdentifier } from '../types/estree';
import {
  isArrayExpression,
  isCallExpression,
  isIdentifier,
  isObjectExpression,
  isObjectPattern,
  isProperty,
} from './ast-helper';

/**
 * 変数宣言が `storeToRefs` 関数の呼び出し結果を分割代入しているかどうかを判定します。
 *
 * @param node - 検査する変数宣言子（VariableDeclarator）ノード
 * @returns `storeToRefs`関数の呼び出し結果を分割代入している場合は true、それ以外の場合は false
 *
 * @example
 * // 以下のコードを検出します:
 * // const { prop1, prop2 } = storeToRefs(store);
 *
 * // AST例:
 * // {
 * //   type: 'VariableDeclarator',
 * //   id: {
 * //     type: 'ObjectPattern',
 * //     properties: [...]
 * //   },
 * //   init: {
 * //     type: 'CallExpression',
 * //     callee: {
 * //       type: 'Identifier',
 * //       name: 'storeToRefs'
 * //     },
 * //     arguments: [...]
 * //   }
 * // }
 *
 * if (isStoreToRefsDeclaration(variableDeclarator)) {
 *   // `storeToRefs`を使用した分割代入の処理
 * }
 */
export const isStoreToRefsDeclaration = (node: TSESTree.VariableDeclarator): boolean =>
  isObjectPattern(node.id) &&
  !!node.init &&
  isCallExpression(node.init) &&
  isIdentifier(node.init.callee) &&
  node.init.callee.name === 'storeToRefs';

/**
 * プロパティが識別子のペアであるかどうかを判定します。
 * プロパティのキーと値の両方が識別子である場合のみ対象とします。
 * 主に分割代入パターン内の単純なプロパティマッピングを検出するために使用されます。
 *
 * @param property - 検査するプロパティまたはレスト要素ノード
 * @returns プロパティのキーと値の両方が識別子の場合は true、それ以外の場合は false
 *
 * @example
 * // 以下のような分割代入のパターンを考えます:
 * // const { prop1, prop2: renamed, ...rest } = obj;
 *
 * // このうち、`prop1`は識別子のペア (`prop1: prop1` と同等)
 * // `prop2: renamed`はキーと値が異なるので識別子のペアではない
 * // `...rest`はプロパティではなくレスト要素なので対象外
 *
 * // AST例（対象となるパターン）:
 * // {
 * //   type: 'Property',
 * //   key: { type: 'Identifier', name: 'prop1' },
 * //   value: { type: 'Identifier', name: 'prop1' }
 * // }
 *
 * objectPattern.properties.forEach(property => {
 *   if (isIdentifierPropertyPair(property)) {
 *     // キーと値が同じ識別子のプロパティの処理
 *     console.log(property.key.name); // プロパティ名
 *     console.log(property.value.name); // 同じ名前の識別子
 *   }
 * });
 */
export const isIdentifierPropertyPair = (
  property: TSESTree.Property | TSESTree.RestElement,
): property is PropertyWithIdentifier => {
  return isProperty(property) && isIdentifier(property.key) && isIdentifier(property.value);
};

export const isPropertyValue = (node: TSESTree.Node): boolean => isProperty(node) && isObjectExpression(node.parent);

export const hasIdentifierCallee = (node: TSESTree.CallExpression): node is CallExpressionWithIdentifierCallee => {
  return isIdentifier(node.callee);
};

export const findAncestorCallExpression = (node: TSESTree.Node): TSESTree.CallExpression | null => {
  let currentNode: TSESTree.Node | undefined = node.parent;

  while (currentNode) {
    if (isCallExpression(currentNode)) {
      return currentNode;
    }
    currentNode = currentNode.parent;
  }

  return null;
};

export const isWatchArgument = (node: TSESTree.Identifier): boolean => {
  const callExpression = findAncestorCallExpression(node);
  if (!callExpression) return false;

  if (!hasIdentifierCallee(callExpression) || callExpression.callee.name !== 'watch') {
    return false;
  }

  if (callExpression.arguments[0] === node) {
    return true;
  }

  return isArrayExpression(callExpression.arguments[0]) && callExpression.arguments[0].elements.includes(node);
};

export const checkFunctionArgument = (
  node: TSESTree.Identifier,
  targetNode: TSESTree.CallExpression | null,
  functionNames: ReadonlyArray<string>,
): boolean => {
  if (!targetNode) return false;

  return (
    targetNode.arguments.includes(node) &&
    hasIdentifierCallee(targetNode) &&
    functionNames.includes(targetNode.callee.name)
  );
};

export const isSpecialFunctionArgument = (
  node: TSESTree.Identifier,
  specialFunctionNames: ReadonlyArray<string>,
): boolean => {
  const targetNode = findAncestorCallExpression(node);
  return checkFunctionArgument(node, targetNode, specialFunctionNames);
};

export const isArgumentOfIgnoredFunction = (
  node: TSESTree.Identifier,
  ignoredFunctionNames: ReadonlyArray<string>,
): boolean => {
  const parent = isCallExpression(node.parent) ? node.parent : null;
  return checkFunctionArgument(node, parent, ignoredFunctionNames);
};

export const isComposablesFunctionArgument = (node: TSESTree.Identifier): boolean => {
  const callExpression = findAncestorCallExpression(node);
  if (!callExpression) return false;

  if (!hasIdentifierCallee(callExpression) || !COMPOSABLES_FUNCTION_PATTERN.test(callExpression.callee.name)) {
    return false;
  }

  return callExpression.arguments.includes(node);
};
