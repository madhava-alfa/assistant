import { tslintConfig } from '@madhava-yallanki/ts-tools';

export default tslintConfig({
  files: ['src/**/*.ts'],
  tsconfigRootDir: import.meta.dirname,
});
