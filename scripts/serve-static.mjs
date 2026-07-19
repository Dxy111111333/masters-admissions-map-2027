import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const root = resolve(process.cwd(), "out");
const port = Number(process.env.PORT ?? 52837);
const host = process.env.HOST ?? "127.0.0.1";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp",
};

async function resolveRequestPath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, `http://${host}:${port}`).pathname);
  const relative = normalize(pathname).replace(/^([/\\])+/, "");
  let candidate = resolve(root, relative || "index.html");
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) return null;

  try {
    const info = await stat(candidate);
    if (info.isDirectory()) candidate = join(candidate, "index.html");
  } catch {
    if (!extname(candidate)) candidate = join(candidate, "index.html");
  }

  try {
    return (await stat(candidate)).isFile() ? candidate : null;
  } catch {
    return null;
  }
}

createServer(async (request, response) => {
  try {
    const filePath = await resolveRequestPath(request.url ?? "/");
    if (!filePath) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Type": mimeTypes[extname(filePath)] ?? "application/octet-stream",
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Server error");
  }
}).listen(port, host, () => {
  process.stdout.write(`Study Compass is ready at http://${host}:${port}/\n`);
});
