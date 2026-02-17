import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const ASSETS_DIR = path.join(PROJECT_ROOT, "public", "assets");
const OUT_FILE = path.join(PROJECT_ROOT, "public", "manifest.json");

// File extensions to include
const ALLOWED_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

function titleCaseWords(str) {
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function prettifySlug(slug) {
  // "tv-shows" -> "TV Shows" (keep TV/VR/VHS etc uppercased if present)
  const upperKeep = new Set(["tv", "vhs", "dvd", "cd", "pc", "ps", "ps1", "ps2", "n64"]);
  const spaced = slug.replace(/[-_]+/g, " ").trim();
  const words = spaced.split(/\s+/).map((w) => {
    const lower = w.toLowerCase();
    if (upperKeep.has(lower)) return lower.toUpperCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
  return words.join(" ");
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\.[^.]+$/, "") // drop extension if accidentally included
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function tokensFromFilename(filenameNoExt) {
  // Pull simple searchable tokens from filename: "spice-girls_1998" -> ["spice", "girls", "1998"]
  return slugify(filenameNoExt)
    .split("-")
    .filter(Boolean)
    .filter((t) => t.length > 1); // drop single-letter noise
}

function readDirSafe(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function main() {
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`❌ Assets folder not found: ${ASSETS_DIR}`);
    process.exit(1);
  }

  const categoryDirs = readDirSafe(ASSETS_DIR)
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const manifest = [];

  for (const category of categoryDirs) {
    const categoryPath = path.join(ASSETS_DIR, category);

    const files = readDirSafe(categoryPath)
      .filter((d) => d.isFile())
      .map((d) => d.name)
      .filter((name) => ALLOWED_EXTS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    const items = files.map((filename) => {
      const ext = path.extname(filename);
      const base = filename.slice(0, -ext.length);

      const id = `${slugify(category)}-${slugify(base)}`;
      const label = prettifySlug(base);

      // tags: include category + filename tokens
      const tags = Array.from(
        new Set([slugify(category), ...tokensFromFilename(base)])
      );

      return {
        id,
        label,
        src: `/assets/${category}/${filename}`,
        tags
      };
    });

    manifest.push({
      id: slugify(category),
      label: prettifySlug(category),
      items
    });
  }

  // Write pretty JSON
  fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`✅ Wrote ${OUT_FILE}`);
  console.log(`📁 Categories: ${manifest.length}`);
  console.log(`🖼️  Total items: ${manifest.reduce((sum, g) => sum + g.items.length, 0)}`);
}

main();
