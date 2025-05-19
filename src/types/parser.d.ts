import type { ParserServicesWithTypeInformation, TSESTree } from '@typescript-eslint/utils';
import type { RuleListener } from '@typescript-eslint/utils/ts-eslint';
import type { AST as VAST } from 'vue-eslint-parser';

export interface TemplateBodyVisitor {
  VElement?: (node: VAST.VElement) => void;
}

export interface ScriptVisitor {
  [key: string]: (node: TSESTree.Node) => void;
}

export interface VueParserServices {
  defineTemplateBodyVisitor: (templateBodyVisitor: TemplateBodyVisitor, scriptVisitor?: ScriptVisitor) => RuleListener;
}

export type ExtendedParserServices = ParserServicesWithTypeInformation & VueParserServices;
