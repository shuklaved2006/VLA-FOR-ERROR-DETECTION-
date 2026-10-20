import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleApiRequest } from "./server/api.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");
const port = Number(process.env.PORT || 4173);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
};

async function serveStatic(req, res) {
  const requestPath = decodeURIComponent(new URL(req.url || "/", "http://recoverbot.local").pathname);
  const safePath = requestPath === "/" ? "/index.html" : requestPath;
  const filePath = path.resolve(dist, `.${safePath}`);

  if (!filePath.startsWith(`${dist}${path.sep}`)) {
    res.statusCode = 400;
    res.end("Bad request");
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    res.statusCode = 200;
    res.setHeader("content-type", contentTypes[path.extname(filePath)] || "application/octet-stream");
    res.setHeader("cache-control", "no-cache");
    res.end(data);
  } catch {
    const index = await fs.readFile(path.join(dist, "index.html"));
    res.statusCode = 200;
    res.setHeader("content-type", contentTypes[".html"]);
    res.end(index);
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url?.startsWith("/api/")) {
    await handleApiRequest(req, res);
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("allow", "GET, HEAD");
    res.end("Method not allowed");
    return;
  }

  await serveStatic(req, res);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`RecoverBot listening on http://localhost:${port}`);
});
