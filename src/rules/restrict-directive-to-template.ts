import type { TSESLint } from '@typescript-eslint/utils';
import type { AST as VAST } from 'vue-eslint-parser';
import { TEMPLATE_ONLY_DIRECTIVES } from '../constants/constant';
import { createVueElementReportData, getTypeCheckingServices } from '../helpers/types';
import { createEslintRule } from '../utils';

const MESSAGE_ID = 'restrict-directive-to-template' as const;

type MessageId = typeof MESSAGE_ID;
type RuleContext = Readonly<TSESLint.RuleContext<MessageId, unknown[]>>;

/**
 * 特定のディレクティブがtemplateタグで使用されていなかった場合にESLintの警告を出す処理
 * @param element Vueのtemplate要素
 * @param context ESLintルールのコンテキスト
 * @returns templateタグ以外で特定のディレクティブが使用されていた場合はエラーを報告
 */
const processVElement = (element: VAST.VElement, context: RuleContext) => {
  if (element.rawName === 'template') {
    return;
  }

  for (const attribute of element.startTag.attributes) {
    if (!attribute.directive) {
      continue;
    }

    const directiveKey = attribute.key;
    const directiveName = directiveKey.name.name;

    if (!TEMPLATE_ONLY_DIRECTIVES.includes(directiveName as (typeof TEMPLATE_ONLY_DIRECTIVES)[number])) {
      continue;
    }

    context.report(createVueElementReportData(attribute, MESSAGE_ID, directiveName));
  }
};

/**
 * 特定のディレクティブをtemplateタグでのみ使用することを強制するESLintルール
 *
 * @example
 * // ルールの使用例
 * <template>
 *  <div v-if="condition">...</div> <!-- NG -->
 * </template>
 *
 * <template>
 *  <template v-if="condition"> <!-- OK -->
 *    <div>...</div>
 *  </template>
 * </template>
 */
export const restrictDirectiveToTemplate = createEslintRule<[], MessageId>({
  name: 'restrict-directive-to-template',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Rule that enforces specific directives to be used only in template tags',
    },
    messages: {
      [MESSAGE_ID]: 'v-{{name}} directive should only be used in template tags',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context: RuleContext) {
    const { parserServices } = getTypeCheckingServices(context);
    const { defineTemplateBodyVisitor } = parserServices;

    return defineTemplateBodyVisitor({
      VElement: (element) => processVElement(element, context),
    });
  },
});
