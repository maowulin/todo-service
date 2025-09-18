import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function cleanHeader(text) {
  // remove lines with @generated or eslint-disable first
  const lines = text.split('\n');
  const filtered = lines.filter((line) => {
    const t = line.trim();
    if (t.includes('@generated')) return false;
    if (t.includes('eslint-disable')) return false;
    return true;
  });

  // remove empty JSDoc blocks (/** ... */) that only contain stars/whitespace
  const result = [];
  let inJSDoc = false;
  let jsdocBuffer = [];

  function flushIfNotEmpty() {
    const meaningful = jsdocBuffer.some((l) => {
      const s = l.trim();
      if (s === '/**' || s === '*/') return false;
      if (s.startsWith('*')) {
        const rest = s.slice(1).trim();
        return rest.length > 0;
      }
      return false;
    });
    if (meaningful) {
      result.push(...jsdocBuffer);
    }
    jsdocBuffer = [];
  }

  for (const l of filtered) {
    const t = l.trim();
    if (!inJSDoc && t.startsWith('/**')) {
      inJSDoc = true;
      jsdocBuffer.push(l);
      if (t.endsWith('*/')) {
        flushIfNotEmpty();
        inJSDoc = false;
      }
      continue;
    }
    if (inJSDoc) {
      jsdocBuffer.push(l);
      if (t.endsWith('*/')) {
        flushIfNotEmpty();
        inJSDoc = false;
      }
      continue;
    }
    result.push(l);
  }

  while (result.length && result[0].trim() === '') result.shift();
  return result.join('\n');
}

function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const targetDir = path.resolve(__dirname, '../../frontend/src/gen');
  if (!fs.existsSync(targetDir)) {
    console.error(`Gen dir not found: ${targetDir}`);
    process.exit(1);
  }
  const entries = fs.readdirSync(targetDir);
  let count = 0;
  for (const name of entries) {
    if (!name.endsWith('.ts')) continue;
    const p = path.join(targetDir, name);
    const original = fs.readFileSync(p, 'utf8');
    const cleaned = cleanHeader(original);
    if (cleaned !== original) {
      fs.writeFileSync(p, cleaned, 'utf8');
      count += 1;
      console.log(`Cleaned: ${name}`);
    }
  }
  console.log(`Cleanup done. Files updated: ${count}`);
}

main();