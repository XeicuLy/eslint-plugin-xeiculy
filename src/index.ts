import type { ESLint, Linter } from 'eslint';
import { version } from '../package.json';
import { requireReactiveValueSuffix } from './rules/require-reactive-value-suffix';
import { restrictDirectiveToTemplate } from './rules/restrict-directive-to-template';
import { storeStateSuffix } from './rules/store-state-suffix';

type RuleDefinitions = (typeof plugin)['rules'];

export type RuleOptions = {
  [K in keyof RuleDefinitions]: RuleDefinitions[K]['defaultOptions'];
};
export type Rules = {
  [K in keyof RuleOptions]: Linter.RuleEntry<RuleOptions[K]>;
};

const plugin = {
  name: 'xeiculy',
  version,
  rules: {
    'require-reactive-value-suffix': requireReactiveValueSuffix,
    'restrict-directive-to-template': restrictDirectiveToTemplate,
    'store-state-suffix': storeStateSuffix,
  },
} satisfies ESLint.Plugin;

export default plugin;
