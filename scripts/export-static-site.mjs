import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(projectRoot, "dist", "client");
const outputDir = path.join(projectRoot, "out");

if (path.dirname(outputDir) !== projectRoot || path.basename(outputDir) !== "out") {
  throw new Error("Refusing to clean an unexpected output directory");
}

await rm(outputDir, { recursive: true, force: true });
await cp(clientDir, outputDir, { recursive: true });
await mkdir(path.join(outputDir, "region"), { recursive: true });

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

for (const name of ["香港", "澳门", "英国", "新西兰", "湾区校区"]) {
  let html = await render(`/region/${encodeURIComponent(name)}.html`);
  html = html.replace('href="./index.html"', 'href="../index.html"');
  if (!/<meta\s+name=["']robots["']/i.test(html)) {
    html = html.replace("</head>", '  <meta name="robots" content="noindex,nofollow">\n</head>');
  }
  await writeFile(path.join(outputDir, "region", `${name}.html`), html, "utf8");
}

await writeFile(
  path.join(outputDir, "region", "index.html"),
  '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=../index.html"><title>返回首页</title>',
  "utf8",
);
