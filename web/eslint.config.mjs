import { tsxlintConfig } from '@madhava-yallanki/ts-tools';

export default tsxlintConfig({
  files: ['src/**/*.tsx', 'src/**/*.ts'],
  tsconfigRootDir: import.meta.dirname,
});
