// Local static SPA preview. Deploy behind a production HTTPS host for real use.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const args = process.argv.slice(2);
const port = Number(args[args.indexOf('--port') + 1]) || 4173;
const root = path.resolve(
  args.includes('--dir') ? args[args.indexOf('--dir') + 1] : 'apps/mobile/dist',
);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.css': 'text/css',
};
http
  .createServer(async (req, res) => {
    try {
      const route = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = path.resolve(root, '.' + route);
      if (file !== root && !file.startsWith(root + path.sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      const info = await stat(file).catch(() => null);
      if (!info?.isFile()) {
        if (path.extname(route)) {
          res.writeHead(404);
          res.end();
          return;
        }
        file = path.join(root, 'index.html');
      }
      const data = await readFile(file);
      res.writeHead(200, {
        'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(data);
    } catch {
      res.writeHead(500);
      res.end('Build indisponível. Execute pnpm build:web.');
    }
  })
  .listen(port, '127.0.0.1', () => console.log(`Core preview: http://127.0.0.1:${port}`));
