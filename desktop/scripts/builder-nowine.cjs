'use strict';
// electron-builder's NSIS target runs the generated installer under wine just to emit the uninstaller.
// On macOS Catalina builder instead extracts the uninstaller from the installer in pure JS (no wine);
// force that code path so Windows installers build on Linux without wine. Usage: node scripts/builder-nowine.cjs --win --x64
require('app-builder-lib/out/util/macosVersion').isMacOsCatalina = () => true;
require('electron-builder/out/cli/cli.js');
