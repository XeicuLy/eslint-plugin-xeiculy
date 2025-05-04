import type { ESLint, Linter } from 'eslint';
import { version } from '../package.json';
import { storeStateSuffix } from './rules/store-state-suffix';

const plugin = {
  name: 'xeiculy',
  version,
  rules: {
    'store-state-suffix': storeStateSuffix,
  },
} satisfies ESLint.Plugin;

export default plugin;

type RuleDefinitions = (typeof plugin)['rules'];

export type RuleOptions = {
  [K in keyof RuleDefinitions]: RuleDefinitions[K]['defaultOptions'];
};
export type Rules = {
  [K in keyof RuleOptions]: Linter.RuleEntry<RuleOptions[K]>;
};
