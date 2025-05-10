import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';

/**
 * 指定されたノードタイプに対する型ガード関数を生成するファクトリ関数です。
 *
 * @template T - チェックするノードの型
 * @param nodeType - 判定するノードタイプ
 * @returns 指定されたノードタイプに対する型ガード関数
 *
 * @example
 * // Identifierノード用の型ガード関数を作成
 * const isIdentifier = nodeTypeGuardFactory<TSESTree.Identifier>(AST_NODE_TYPES.Identifier);
 *
 * // 使用例
 * if (isIdentifier(node)) {
 *   // この中では、nodeはTSESTree.Identifierとして扱われる
 * }
 */
const nodeTypeGuardFactory = <T extends TSESTree.Node>(nodeType: T['type']) => {
  return (node: TSESTree.Node): node is T => node.type === nodeType;
};

/**
 * 与えられたノードが識別子（Identifier）であるかどうかを判定します。
 *
 * @param node - 検査するASTノード
 * @returns ノードが識別子の場合はtrue、それ以外の場合はfalse
 *
 * @example
 * // 以下のASTノードを考えます:
 * // const foo = 'bar';
 * // この場合、'foo'はIdentifierノードになります
 *
 * // AST例:
 * // {
 * //   type: 'Identifier',
 * //   name: 'foo'
 * // }
 *
 * if (isIdentifier(node)) {
 *   console.log(node.name); // 'foo'のような識別子名にアクセス可能
 * }
 */
export const isIdentifier = nodeTypeGuardFactory<TSESTree.Identifier>(AST_NODE_TYPES.Identifier);

/**
 * 与えられたノードがプロパティ（Property）であるかどうかを判定します。
 *
 * @param node - 検査するASTノード
 * @returns ノードがプロパティの場合はtrue、それ以外の場合はfalse
 *
 * @example
 * // 以下のASTノードを考えます:
 * // const obj = { key: value };
 * // この場合、'key: value'の部分はPropertyノードになります
 *
 * // AST例:
 * // {
 * //   type: 'Property',
 * //   key: { type: 'Identifier', name: 'key' },
 * //   value: { type: 'Identifier', name: 'value' }
 * // }
 *
 * if (isProperty(node)) {
 *   // プロパティのkeyやvalueにアクセス可能
 *   console.log(node.key);
 *   console.log(node.value);
 * }
 */
export const isProperty = nodeTypeGuardFactory<TSESTree.Property>(AST_NODE_TYPES.Property);

/**
 * 与えられたノードが関数呼び出し式（CallExpression）であるかどうかを判定します。
 *
 * @param node - 検査するASTノード
 * @returns ノードが関数呼び出し式の場合はtrue、それ以外の場合はfalse
 *
 * @example
 * // 以下のASTノードを考えます:
 * // foo();
 * // または
 * // obj.method(arg1, arg2);
 *
 * // AST例:
 * // {
 * //   type: 'CallExpression',
 * //   callee: { type: 'Identifier', name: 'foo' },
 * //   arguments: []
 * // }
 *
 * if (isCallExpression(node)) {
 *   console.log(node.callee); // 呼び出される関数
 *   console.log(node.arguments); // 引数の配列
 * }
 */
export const isCallExpression = nodeTypeGuardFactory<TSESTree.CallExpression>(AST_NODE_TYPES.CallExpression);

/**
 * 与えられたノードがオブジェクトパターン（ObjectPattern）であるかどうかを判定します。
 * オブジェクトパターンは主に分割代入で使用されます。
 *
 * @param node - 検査するASTノード
 * @returns ノードがオブジェクトパターンの場合はtrue、それ以外の場合はfalse
 *
 * @example
 * // 以下のASTノードを考えます:
 * // const { a, b } = obj;
 * // この場合、'{ a, b }'の部分はObjectPatternノードになります
 *
 * // AST例:
 * // {
 * //   type: 'ObjectPattern',
 * //   properties: [
 * //     { type: 'Property', key: { type: 'Identifier', name: 'a' }, ... },
 * //     { type: 'Property', key: { type: 'Identifier', name: 'b' }, ... }
 * //   ]
 * // }
 *
 * if (isObjectPattern(node)) {
 *   // オブジェクトパターンのプロパティ配列にアクセス可能
 *   node.properties.forEach(prop => {
 *     if (isProperty(prop) && isIdentifier(prop.key)) {
 *       console.log(prop.key.name); // 分割代入の各プロパティ名にアクセス
 *     }
 *   });
 * }
 */
export const isObjectPattern = nodeTypeGuardFactory<TSESTree.ObjectPattern>(AST_NODE_TYPES.ObjectPattern);

/**
 * 与えられたノードが非Null表明演算子（TSNonNullExpression）であるかどうかを判定します。
 * この演算子はTypeScriptで!を使用してnullやundefinedではないことを表明する場合に使用されます。
 *
 * @param node - 検査するASTノード
 * @returns ノードが非Null表明演算子の場合はtrue、それ以外の場合はfalse
 *
 * @example
 * // 以下のASTノードを考えます:
 * // const element = document.getElementById('id')!;
 * // この場合、'document.getElementById('id')!'の!部分はTSNonNullExpressionノードになります
 *
 * // AST例:
 * // {
 * //   type: 'TSNonNullExpression',
 * //   expression: { * 内部の式 * }
 * // }
 *
 * if (isTSNonNullExpression(node)) {
 *   console.log(node.expression); // 非Null表明が適用されている式にアクセス可能
 * }
 */
export const isTSNonNullExpression = nodeTypeGuardFactory<TSESTree.TSNonNullExpression>(
  AST_NODE_TYPES.TSNonNullExpression,
);

/**
 * 与えられたノードが変数宣言（VariableDeclaration）であるかどうかを判定します。
 *
 * @param node - 検査するASTノード
 * @returns ノードが変数宣言の場合はtrue、それ以外の場合はfalse
 *
 * @example
 * // 以下のASTノードを考えます:
 * // const x = 1, y = 2;
 * // または
 * // let value;
 *
 * // AST例:
 * // {
 * //   type: 'VariableDeclaration',
 * //   kind: 'const', // または 'let', 'var'
 * //   declarations: [* VariableDeclarator ノードの配列 *]
 * // }
 *
 * if (isVariableDeclaration(node)) {
 *   console.log(node.kind); // 'const', 'let', 'var' などの宣言の種類
 *   console.log(node.declarations); // 宣言子の配列
 * }
 */
export const isVariableDeclaration = nodeTypeGuardFactory<TSESTree.VariableDeclaration>(
  AST_NODE_TYPES.VariableDeclaration,
);

/**
 * 与えられたノードが変数宣言子（VariableDeclarator）であるかどうかを判定します。
 * 変数宣言子は変数宣言の各部分を表します。
 *
 * @param node - 検査するASTノード
 * @returns ノードが変数宣言子の場合はtrue、それ以外の場合はfalse
 *
 * @example
 * // 以下のASTノードを考えます:
 * // const x = 1;
 * // この場合、'x = 1'の部分はVariableDeclaratorノードになります
 *
 * // AST例:
 * // {
 * //   type: 'VariableDeclarator',
 * //   id: { type: 'Identifier', name: 'x' },
 * //   init: { type: 'Literal', value: 1 }
 * // }
 *
 * if (isVariableDeclarator(node)) {
 *   console.log(node.id); // 変数の識別子
 *   console.log(node.init); // 初期化式（存在する場合）
 * }
 */
export const isVariableDeclarator = nodeTypeGuardFactory<TSESTree.VariableDeclarator>(
  AST_NODE_TYPES.VariableDeclarator,
);

/**
 * 与えられたノードが配列パターン（ArrayPattern）であるかどうかを判定します。
 * 配列パターンは主に配列の分割代入で使用されます。
 *
 * @param node - 検査するASTノード
 * @returns ノードが配列パターンの場合はtrue、それ以外の場合はfalse
 *
 * @example
 * // 以下のASTノードを考えます:
 * // const [a, b] = array;
 * // この場合、'[a, b]'の部分はArrayPatternノードになります
 *
 * // AST例:
 * // {
 * //   type: 'ArrayPattern',
 * //   elements: [
 * //     { type: 'Identifier', name: 'a' },
 * //     { type: 'Identifier', name: 'b' }
 * //   ]
 * // }
 *
 * if (isArrayPattern(node)) {
 *   // 配列パターンの要素配列にアクセス可能
 *   node.elements.forEach((element, index) => {
 *     if (element && isIdentifier(element)) {
 *       console.log(`Element at index ${index}: ${element.name}`);
 *     }
 *   });
 * }
 */
export const isArrayPattern = nodeTypeGuardFactory<TSESTree.ArrayPattern>(AST_NODE_TYPES.ArrayPattern);

/**
 * 与えられたノードがオブジェクト式（ObjectExpression）であるかどうかを判定します。
 *
 * @param node - 検査するASTノード
 * @returns ノードがオブジェクト式の場合はtrue、それ以外の場合はfalse
 *
 * @example
 * // 以下のASTノードを考えます:
 * // const obj = { a: 1, b: 2 };
 * // この場合、'{ a: 1, b: 2 }'の部分はObjectExpressionノードになります
 *
 * // AST例:
 * // {
 * //   type: 'ObjectExpression',
 * //   properties: [
 * //     { type: 'Property', key: { type: 'Identifier', name: 'a' }, ... },
 * //     { type: 'Property', key: { type: 'Identifier', name: 'b' }, ... }
 * //   ]
 * // }
 *
 * if (isObjectExpression(node)) {
 *   // オブジェクト式のプロパティ配列にアクセス可能
 *   node.properties.forEach(prop => {
 *     if (isProperty(prop) && isIdentifier(prop.key)) {
 *       console.log(`Property: ${prop.key.name}`);
 *     }
 *   });
 * }
 */
export const isObjectExpression = nodeTypeGuardFactory<TSESTree.ObjectExpression>(AST_NODE_TYPES.ObjectExpression);

/**
 * 与えられたノードがメンバー式（MemberExpression）であるかどうかを判定します。
 * メンバー式はオブジェクトのプロパティやメソッドへのアクセスを表します。
 *
 * @param node - 検査するASTノード
 * @returns ノードがメンバー式の場合はtrue、それ以外の場合はfalse
 *
 * @example
 * // 以下のASTノードを考えます:
 * // obj.property
 * // または
 * // array[index]
 *
 * // AST例:
 * // {
 * //   type: 'MemberExpression',
 * //   object: { type: 'Identifier', name: 'obj' },
 * //   property: { type: 'Identifier', name: 'property' },
 * //   computed: false
 * // }
 *
 * if (isMemberExpression(node)) {
 *   console.log(node.object); // アクセスされるオブジェクト
 *   console.log(node.property); // アクセスされるプロパティ
 *   console.log(node.computed); // 計算済みのアクセスか（[]を使用）どうか
 * }
 */
export const isMemberExpression = nodeTypeGuardFactory<TSESTree.MemberExpression>(AST_NODE_TYPES.MemberExpression);

/**
 * 与えられたノードが配列式（ArrayExpression）であるかどうかを判定します。
 *
 * @param node - 検査するASTノード
 * @returns ノードが配列式の場合はtrue、それ以外の場合はfalse
 *
 * @example
 * // 以下のASTノードを考えます:
 * // const arr = [1, 2, 3];
 * // この場合、'[1, 2, 3]'の部分はArrayExpressionノードになります
 *
 * // AST例:
 * // {
 * //   type: 'ArrayExpression',
 * //   elements: [
 * //     { type: 'Literal', value: 1 },
 * //     { type: 'Literal', value: 2 },
 * //     { type: 'Literal', value: 3 }
 * //   ]
 * // }
 *
 * if (isArrayExpression(node)) {
 *   // 配列式の要素配列にアクセス可能
 *   node.elements.forEach((element, index) => {
 *     if (element) {
 *       console.log(`Element at index ${index}:`, element);
 *     }
 *   });
 * }
 */
export const isArrayExpression = nodeTypeGuardFactory<TSESTree.ArrayExpression>(AST_NODE_TYPES.ArrayExpression);
