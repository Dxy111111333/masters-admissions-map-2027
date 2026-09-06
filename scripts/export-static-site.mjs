import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(projectRoot, "dist", "client");
const outputDir = path.join(projectRoot, "out");
const catalog = JSON.parse(await readFile(path.join(projectRoot, "data", "programs.json"), "utf8"));
const universities = JSON.parse(await readFile(path.join(projectRoot, "data", "universities.json"), "utf8"));

if (path.dirname(outputDir) !== projectRoot || path.basename(outputDir) !== "out") {
  throw new Error("Refusing to clean an unexpected output directory");
}

await rm(outputDir, { recursive: true, force: true });
await cp(clientDir, outputDir, { recursive: true });

const workerUrl = pathToFileURL(path.join(projectRoot, "dist", "server", "index.js"));
workerUrl.searchParams.set("export", `${Date.now()}`);
const { default: worker } = await import(workerUrl.href);

const env = {
  ASSETS: {
    fetch: async request => {
      const url = new URL(request.url);
      const assetPath = path.join(clientDir, decodeURIComponent(url.pathname).replace(/^\/+/, ""));
      try {
        return new Response(await readFile(assetPath));
      } catch {
        return new Response("Not found", { status: 404 });
      }
    },
  },
};
const context = { waitUntil() {}, passThroughOnException() {} };

async function render(route) {
  const response = await worker.fetch(new Request(`http://localhost${route}`), env, context);
  if (!response.ok) throw new Error(`Static export failed for ${route}: ${response.status}`);
  return response.text();
}

let home = await render("/");
home = home.replaceAll("http://localhost/og.jpg", "/og.jpg");
await writeFile(path.join(outputDir, "index.html"), home, "utf8");

for (const program of catalog.programs) {
  const directory = path.join(outputDir, "program", program.programId);
  await mkdir(directory, { recursive: true });
  const html = await render(`/program/${encodeURIComponent(program.programId)}`);
  await writeFile(path.join(directory, "index.html"), html, "utf8");
}

for (const university of universities.universities) {
  const directory = path.join(outputDir, "university", university.id);
  await mkdir(directory, { recursive: true });
  const html = await render(`/university/${encodeURIComponent(university.id)}`);
  await writeFile(path.join(directory, "index.html"), html, "utf8");
}

console.log(`Exported homepage, ${catalog.programs.length} program detail pages and ${universities.universities.length} university pages`);
