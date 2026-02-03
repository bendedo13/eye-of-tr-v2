import en from "../messages/en.json" with { type: "json" };
import tr from "../messages/tr.json" with { type: "json" };

function flattenKeys(obj, prefix = "") {
  const out = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const child of flattenKeys(v, key)) out.add(child);
    } else {
      out.add(key);
    }
  }
  return out;
}

function diff(a, b) {
  const missing = [];
  for (const k of a) {
    if (!b.has(k)) missing.push(k);
  }
  return missing.sort();
}

const enKeys = flattenKeys(en);
const trKeys = flattenKeys(tr);

const missingInTr = diff(enKeys, trKeys);
const missingInEn = diff(trKeys, enKeys);

if (missingInTr.length || missingInEn.length) {
  if (missingInTr.length) {
    console.error("Missing keys in tr.json:");
    for (const k of missingInTr) console.error(`- ${k}`);
  }
  if (missingInEn.length) {
    console.error("Missing keys in en.json:");
    for (const k of missingInEn) console.error(`- ${k}`);
  }
  process.exit(1);
}

console.log(`OK: en.json and tr.json have identical keysets (${enKeys.size} keys).`);

