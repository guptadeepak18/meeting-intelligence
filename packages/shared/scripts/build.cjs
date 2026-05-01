const { execSync } = require('node:child_process');
const { mkdirSync, rmSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const packageRoot = path.resolve(__dirname, '..');
const distDir = path.join(packageRoot, 'dist');

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

execSync('pnpm exec tsc --project tsconfig.json --module commonjs --moduleResolution node', {
  cwd: packageRoot,
  stdio: 'inherit',
});

writeFileSync(
  path.join(distDir, 'package.json'),
  JSON.stringify({ type: 'commonjs' }, null, 2) + '\n',
  'utf8',
);