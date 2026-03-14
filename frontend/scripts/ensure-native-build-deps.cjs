const { readFileSync } = require('node:fs');
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

function isMuslLinux() {
  if (platform !== 'linux') {
    return false;
  }

  try {
    return readFileSync('/usr/bin/ldd', 'utf8').includes('musl');
  } catch {
    try {
      const result = spawnSync('ldd', ['--version'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      });
      return `${result.stdout || ''}\n${result.stderr || ''}`.includes('musl');
    } catch {
      return false;
    }
  }
}

if (platform === 'linux' && arch === 'x64') {
  const missingPackages = [];
  const linuxVariant = isMuslLinux() ? 'musl' : 'gnu';

  const rollupNativePackage = `@rollup/rollup-linux-x64-${linuxVariant}`;
  if (!hasPackage(rollupNativePackage)) {
    const version = resolveOptionalVersion('rollup', rollupNativePackage);
    if (version) {
      missingPackages.push(`${rollupNativePackage}@${version}`);
    }
  }

  const lightningCssNativePackage = `lightningcss-linux-x64-${linuxVariant}`;
  if (!hasPackage(lightningCssNativePackage)) {
    const version = resolveOptionalVersion('lightningcss', lightningCssNativePackage);
    if (version) {
      missingPackages.push(`${lightningCssNativePackage}@${version}`);
    }
  }

  const oxideNativePackage = `@tailwindcss/oxide-linux-x64-${linuxVariant}`;
  if (!hasPackage(oxideNativePackage)) {
    const version = resolveOptionalVersion('@tailwindcss/oxide', oxideNativePackage);
    if (version) {
      missingPackages.push(`${oxideNativePackage}@${version}`);
    }
  }

  if (missingPackages.length > 0) {
    console.log(
      `[ensure-native-build-deps] Installing missing native packages: ${missingPackages.join(', ')}`
    );
    installPackages(missingPackages);
  }
}
