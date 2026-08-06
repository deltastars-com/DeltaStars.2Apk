#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// تحديد نوع الزيادة من معاملات سطر الأوامر أو متغير البيئة
const args = process.argv.slice(2);
let versionType = args.find(arg => arg.startsWith('--'))?.replace('--', '') || process.env.VERSION_TYPE || 'patch';
if (!['patch', 'minor', 'major'].includes(versionType)) {
  versionType = 'patch';
}

console.log(`🔄 تحديث الإصدار (${versionType})...`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. قراءة package.json
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
let oldVersion = packageJson.version;
let parts = oldVersion.split('.').map(Number);

// زيادة الإصدار حسب النوع
if (versionType === 'patch') parts[2] += 1;
else if (versionType === 'minor') { parts[1] += 1; parts[2] = 0; }
else if (versionType === 'major') { parts[0] += 1; parts[1] = 0; parts[2] = 0; }

const newVersion = parts.join('.');
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log(`✅ package.json: ${oldVersion} → ${newVersion}`);

// 2. تحديث capacitor.config.json (إذا وجد)
const capacitorConfigPath = path.resolve(__dirname, '../capacitor.config.json');
if (fs.existsSync(capacitorConfigPath)) {
  const config = JSON.parse(fs.readFileSync(capacitorConfigPath, 'utf8'));
  if (config.appVersion) {
    config.appVersion = newVersion;
    fs.writeFileSync(capacitorConfigPath, JSON.stringify(config, null, 2));
    console.log(`✅ capacitor.config.json: appVersion → ${newVersion}`);
  }
}

// 3. تحديث manifest.json (في public)
const manifestPath = path.resolve(__dirname, '../public/manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.version) {
    manifest.version = newVersion;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ manifest.json: version → ${newVersion}`);
  }
}

// 4. تحديث index.html (إضافة meta tag للإصدار)
const indexPath = path.resolve(__dirname, '../public/index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  const versionMeta = `<meta name="version" content="${newVersion}">`;
  if (html.includes('<meta name="version"')) {
    html = html.replace(/<meta name="version" content="[^"]*">/, versionMeta);
  } else {
    html = html.replace('</head>', `${versionMeta}\n</head>`);
  }
  fs.writeFileSync(indexPath, html);
  console.log(`✅ index.html: version meta tag → ${newVersion}`);
}

// 5. كتابة version.json في public لاستخدامه من التطبيق
const versionJsonPath = path.resolve(__dirname, '../public/version.json');
fs.writeFileSync(versionJsonPath, JSON.stringify({ version: newVersion, buildTime: new Date().toISOString() }, null, 2));
console.log(`✅ version.json تم إنشاؤه برقم ${newVersion}`);

// version.json updated above

console.log('🎉 تم تحديث الإصدار بنجاح!');
