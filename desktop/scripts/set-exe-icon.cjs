'use strict';
// electron-builder afterPack hook: stamps build/icon.ico and the version info into the packed Windows exe in pure JS
// (resedit), because signAndEditExecutable is off (it would need wine on Linux). Runs once per arch, before the
// installer and the portable target are made, so both ship the branded exe.
const fs = require('fs');
const path = require('path');

exports.default = async function setExeIcon(context) {
  if (context.electronPlatformName !== 'win32') return;
  const ResEdit = await import('resedit');
  const {appInfo} = context.packager;
  const exePath = path.join(context.appOutDir, `${appInfo.productFilename}.exe`);
  const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath));
  const res = ResEdit.NtExecutableResource.from(exe);

  const icons = ResEdit.Data.IconFile.from(fs.readFileSync(path.join(__dirname, '..', 'build', 'icon.ico'))).icons.map(i => i.data);
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  if (!groups.length) throw new Error(`${exePath} has no icon group to replace`);
  for (const g of groups) ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, g.id, g.lang, icons);

  const [major = 0, minor = 0, patch = 0] = appInfo.version.split(/[.+-]/).map(n => parseInt(n, 10) || 0);
  const vi = ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0] ?? ResEdit.Resource.VersionInfo.createEmpty();
  vi.setFileVersion(major, minor, patch, 0, 1033);
  vi.setProductVersion(major, minor, patch, 0, 1033);
  vi.setStringValues({lang: 1033, codepage: 1200}, {
    ProductName: appInfo.productName,
    FileDescription: appInfo.productName,
    CompanyName: 'Ahmed Hani',
    LegalCopyright: 'Copyright (C) Ahmed Hani',
    InternalName: appInfo.productFilename,
    OriginalFilename: `${appInfo.productFilename}.exe`,
    FileVersion: appInfo.version,
    ProductVersion: appInfo.version,
  });
  vi.outputToResourceEntries(res.entries);

  res.outputResource(exe);
  fs.writeFileSync(exePath, Buffer.from(exe.generate()));
};
