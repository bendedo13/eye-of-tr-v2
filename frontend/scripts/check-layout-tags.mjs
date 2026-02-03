import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(process.cwd());

function read(file) {
  return fs.readFileSync(path.join(projectRoot, file), "utf8");
}

function assertIncludes(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`${label} içinde ${needle} bulunamadı`);
  }
}

function assertNotIncludes(source, needle, label) {
  if (source.includes(needle)) {
    throw new Error(`${label} içinde ${needle} olmamalı`);
  }
}

const rootLayoutPath = "app/layout.tsx";
const localeLayoutPath = "app/[locale]/layout.tsx";
const adminLayoutPath = "app/admin/layout.tsx";

const rootLayout = read(rootLayoutPath);
assertIncludes(rootLayout, "<html", rootLayoutPath);
assertIncludes(rootLayout, "<body", rootLayoutPath);

const localeLayout = read(localeLayoutPath);
assertNotIncludes(localeLayout, "<html", localeLayoutPath);
assertNotIncludes(localeLayout, "<body", localeLayoutPath);

const adminLayout = read(adminLayoutPath);
assertNotIncludes(adminLayout, "<html", adminLayoutPath);
assertNotIncludes(adminLayout, "<body", adminLayoutPath);

console.log("OK: layout tag kontrolü geçti");

