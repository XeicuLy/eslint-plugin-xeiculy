import type { RuleListener, RuleWithMeta, RuleWithMetaAndName } from '@typescript-eslint/utils/eslint-utils';
import type { RuleContext, RuleMetaData } from '@typescript-eslint/utils/ts-eslint';
import type { Rule } from 'eslint';

/** ドキュメントが存在するルール名のリスト */
const hasDocumentList = ['store-state-suffix', 'require-reactive-value-suffix', 'restrict-directive-to-template'];
/** ドキュメントの GitHub URL */
const blobDocsUrl = 'https://github.com/XeicuLy/eslint-plugin-xeiculy/blob/main/src/docs/';
/** テストファイルの GitHub URL */
const blobTestUrl = 'https://github.com/XeicuLy/eslint-plugin-xeiculy/blob/main/src/__test__/';

export type RuleModule<TOptions extends readonly unknown[]> = Rule.RuleModule & { defaultOptions: TOptions };

export const memoize = <T>(fn: () => T): (() => T) => {
  let cached: T | undefined;
  return () => {
    if (cached === undefined) {
      cached = fn();
    }
    return cached;
  };
};

/**
 * 基本的なルールを作成する関数
 * @template TOptions ルールのオプション型
 * @template TMessageIds メッセージID型
 * @param param ルール設定オブジェクト
 * @returns 設定されたルールモジュール
 */
const createRule = <TOptions extends readonly unknown[], TMessageIds extends string>({
  create,
  defaultOptions,
  meta,
}: Readonly<RuleWithMeta<TOptions, TMessageIds>>): RuleModule<TOptions> => {
  return {
    create: ((context: Readonly<RuleContext<TMessageIds, TOptions>>): RuleListener => {
      const optionsWithDefault = context.options.map((options, index) => {
        return {
          ...(defaultOptions[index] || {}),
          ...(options || {}),
        };
      }) as unknown as TOptions;
      return create(context, optionsWithDefault);
      // biome-ignore lint/suspicious/noExplicitAny: ESLintのRuleContext型とRuleListener型の互換性のため
    }) as any,
    defaultOptions,
    meta: meta as RuleMetaData<TMessageIds>,
  };
};

/**
 * ルール作成関数ファクトリ
 * @param urlCreator URL生成関数
 * @returns 名前付きルール作成関数
 */
export const ruleCreator = (urlCreator: (name: string) => string) => {
  return <TOptions extends readonly unknown[], TMessageIds extends string>({
    name,
    meta,
    ...rule
  }: Readonly<RuleWithMetaAndName<TOptions, TMessageIds>>): RuleModule<TOptions> => {
    return createRule<TOptions, TMessageIds>({
      meta: {
        ...meta,
        docs: {
          ...meta.docs,
          url: urlCreator(name),
        },
      },
      ...rule,
    });
  };
};

/**
 * ESLintルール作成用のユーティリティ関数
 * ドキュメントが存在するルールはドキュメントURLを、それ以外はテストファイルURLを使用する
 */
export const createEslintRule = ruleCreator((ruleName) =>
  hasDocumentList.includes(ruleName) ? `${blobDocsUrl}${ruleName}.md` : `${blobTestUrl}${ruleName}.spec.ts`,
) as unknown as <TOptions extends readonly unknown[], TMessageIds extends string>({
  name,
  meta,
  ...rule
}: Readonly<RuleWithMetaAndName<TOptions, TMessageIds>>) => RuleModule<TOptions>;
