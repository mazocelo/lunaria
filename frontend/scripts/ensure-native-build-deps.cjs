const { spawnSync } = require('node:child_process');
const { platform, arch } = require('node:process');

function resolveOptionalVersion(pkgName, optionalPackageName) {
  try {
    const pkg = require(`${pkgName}/package.json`);
    return (
      pkg.optionalDependencies?.[optionalPackageName] ||
      pkg.dependencies?.[optionalPackageName] ||
      null
    );
  } catch {
    return null;
  }
}

function hasPackage(packageName) {
  try {
    require.resolve(packageName);
    return true;
  } catch {
    return false;
  }
}

function installPackages(packages) {
  const npmCommand = platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(
    npmCommand,
    ['install', '--no-save', '--include=optional', ...packages],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        npm_config_audit: 'false',
        npm_config_fund: 'false'
      }
    }
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

if (platform === 'linux' && arch === 'x64') {
  const missingPackages = [];

  if (!hasPackage('@rollup/rollup-linux-x64-gnu')) {
    const version = resolveOptionalVersion('rollup', '@rollup/rollup-linux-x64-gnu');
    if (version) {
      missingPackages.push(`@rollup/rollup-linux-x64-gnu@${version}`);
    }
  }

  if (!hasPackage('lightningcss-linux-x64-gnu')) {
    const version = resolveOptionalVersion('lightningcss', 'lightningcss-linux-x64-gnu');
    if (version) {
      missingPackages.push(`lightningcss-linux-x64-gnu@${version}`);
    }
  }

  if (missingPackages.length > 0) {
    console.log(
      `[ensure-native-build-deps] Installing missing native packages: ${missingPackages.join(', ')}`
    );
    installPackages(missingPackages);
  }
}
