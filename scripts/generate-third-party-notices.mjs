import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const lockText = read('package-lock.json');
const lock = JSON.parse(lockText);
const upstream = 'legal/upstream/';
const upstreamVersions = JSON.parse(read(upstream + 'versions.json'));
const fallback = name => name === 'firebase' || name.startsWith('@firebase/') ? 'firebase-v13-LICENSE.txt'
  : name === 'remark-math' ? 'remark-math-v6-LICENSE.txt'
  : name === 'rehype-katex' ? 'rehype-katex-v7-LICENSE.txt' : null;

function noticeFiles(directory, prefix = '') {
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.isSymbolicLink()) continue;
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) found.push(...noticeFiles(path.join(directory, entry.name), relative));
    else if (/^(licen[sc]e|copying|notice|copyright)([.-]|$)/i.test(entry.name) && !/\.(png|pdf|map)$/i.test(entry.name)) found.push(relative);
  }
  return found.sort();
}

const entries = Object.entries(lock.packages)
  .filter(([location, metadata]) => location && !metadata.dev && fs.existsSync(path.join(root, location, 'package.json')))
  .map(([location]) => {
    const directory = path.join(root, location);
    const pkg = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
    const files = noticeFiles(directory);
    const notices = files.map(file => ({ source: file.replaceAll('\\', '/'), text: fs.readFileSync(path.join(directory, file), 'utf8') }));
    const replacement = fallback(pkg.name);
    if ((replacement || pkg.name === 'victory-vendor') && upstreamVersions[pkg.name] !== pkg.version) {
      throw new Error(`Review the upstream license for updated ${pkg.name}@${pkg.version}, then update legal/upstream/versions.json.`);
    }
    if (replacement) notices.push({ source: `Upstream: ${replacement}`, text: read(upstream + replacement) });
    if (pkg.name === 'victory-vendor') notices.push({ source: 'Upstream Victory v37.3.6 project license', text: read(upstream + 'victory-v37-LICENSE.txt') });
    if (!notices.length) throw new Error(`Missing license text for ${pkg.name}; review before publishing.`);
    return { name: pkg.name, version: pkg.version, license: typeof pkg.license === 'string' ? pkg.license : JSON.stringify(pkg.license), notices };
  }).sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));

const sections = [
  'OptiRoute — Third-party notices',
  'These notices apply to third-party components, not to the original OptiRoute code.',
  'Third-party rights and license permissions are retained. Some installed runtime packages may not be included in the final browser bundle.',
  `Dependency lock SHA-256: ${createHash('sha256').update(lockText).digest('hex')}`,
  `Installed runtime packages: ${entries.length}`,
];
for (const entry of entries) {
  sections.push(`\n${'='.repeat(72)}\n${entry.name}@${entry.version}\nDeclared license: ${entry.license}`);
  for (const notice of entry.notices) sections.push(`\n--- ${notice.source} ---\n${notice.text}`);
}
for (const [family, filename] of [
  ['Radio Canada Big', 'radio-canada-big-OFL.txt'],
  ['Source Serif / Source Serif Pro', 'source-serif-OFL.txt'],
  ['Geist / Geist Mono', 'geist-OFL.txt'],
]) sections.push(`\n${'='.repeat(72)}\nFont family: ${family}\n${read(upstream + filename)}`);

fs.writeFileSync(path.join(root, 'public/third-party-notices.txt'), sections.join('\n\n') + '\n');
console.log(`Generated third-party notices for ${entries.length} installed runtime packages and three font families.`);
