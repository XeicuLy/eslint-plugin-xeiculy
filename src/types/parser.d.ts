import type { ParserServicesWithTypeInformation } from '@typescript-eslint/utils';
import type { AST as VAST } from 'vue-eslint-parser';

export interface TemplateBodyVisitor {
  VElement: (node: VAST.VElement) => void;
}

export interface VueParserServices {
  defineTemplateBodyVisitor: (
    templateBodyVisitor: TemplateBodyVisitor,
    scriptVisitor?: Record<string, (node: unknown) => void>,
  ) => Record<string, (node: VAST.VNode) => void>;
}

export type ExtendedParserServices = ParserServicesWithTypeInformation & VueParserServices;
