// Validate installed modules against the matrix shipped with the locked Expo SDK.
// Remote recommendations may change independently from the reviewed lockfile.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appRequire = createRequire(path.join(root, 'apps/mobile/package.json'));
const expoPackagePath = appRequire.resolve('expo/package.json');
const expoRequire = createRequire(expoPackagePath);
// Use the same semver implementation installed by this Expo CLI.
const cliRequire = createRequire(expoRequire.resolve('@expo/cli/package.json'));
const semver = cliRequire('semver');
const matrix = JSON.parse(
  readFileSync(path.join(path.dirname(expoPackagePath), 'bundledNativeModules.json'), 'utf8'),
);
const app = JSON.parse(readFileSync(path.join(root, 'apps/mobile/package.json'), 'utf8'));
const errors = [];
let checked = 0;
for (const name of Object.keys(app.dependencies)) {
  if (!matrix[name]) continue;
  const installed = JSON.parse(
    readFileSync(path.join(root, 'apps/mobile/node_modules', name, 'package.json'), 'utf8'),
  ).version;
  checked++;
  if (!semver.satisfies(installed, matrix[name]))
    errors.push(`${name}: installed ${installed}; locked SDK expects ${matrix[name]}`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`${checked} SDK dependencies match the installed Expo compatibility matrix.`);
