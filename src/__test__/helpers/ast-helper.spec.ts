import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { describe, expect, test } from 'vitest';
import { isCallExpression, isIdentifier, isObjectPattern, isProperty } from '../../helpers/ast-helper';

describe('src/helpers/ast-helper.ts', () => {
  const testCaseList = [
    { funcName: 'isIdentifier', func: isIdentifier, nodeType: AST_NODE_TYPES.Identifier },
    { funcName: 'isProperty', func: isProperty, nodeType: AST_NODE_TYPES.Property },
    { funcName: 'isCallExpression', func: isCallExpression, nodeType: AST_NODE_TYPES.CallExpression },
    { funcName: 'isObjectPattern', func: isObjectPattern, nodeType: AST_NODE_TYPES.ObjectPattern },
  ];

  test.each(testCaseList)('$funcName should return true for its specific node type', ({ func, nodeType }) => {
    const node = { type: nodeType };
    // @ts-ignore
    expect(func(node)).toBe(true);
  });

  test.each(testCaseList)('$funcName should return false for a different node type', ({ func }) => {
    const node = { type: AST_NODE_TYPES.Literal };
    // @ts-ignore
    expect(func(node)).toBe(false);
  });
});
