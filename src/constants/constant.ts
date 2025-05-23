export const REACTIVE_FUNCTIONS = [
  'ref',
  'computed',
  'reactive',
  'toRef',
  'toRefs',
  'shallowRef',
  'storeToRefs',
] as const;
export const COMPOSABLES_FUNCTION_PATTERN: RegExp = /^use[A-Z]/;
export const TEMPLATE_ONLY_DIRECTIVES = ['if', 'else', 'else-if', 'for'] as const;
