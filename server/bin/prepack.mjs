import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const updateBundleDependencies = () => {
  const packageRoot = dirname(fileURLToPath(import.meta.url));
  const filePath = join(packageRoot, `../package.json`);
  const stringData = readFileSync(filePath).toString();
  const data = JSON.parse(stringData);
  data.bundleDependencies = Object.keys(data.dependencies);
  writeFileSync(filePath, JSON.stringify(data, null, 2));
};

updateBundleDependencies();
