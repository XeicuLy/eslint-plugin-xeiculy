import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
    cjsBridge: true,
    esbuild: {
      minify: true,
      target: 'node20',
    },
  },
  externals: ['eslint', '@typescript-eslint/utils'],
});
