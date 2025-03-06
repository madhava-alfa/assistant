import { eslintConfig } from '@madhava-yallanki/ts-tools';

export default eslintConfig({
  files: ['src/**/*.ts'],
  tsconfigRootDir: import.meta.dirname,
});
