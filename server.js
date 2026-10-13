// Pangea Wiki server: serves the viewer and admin portals and stores content.
// No dependencies — run with `npm start` (Node 18+).
import http from 'node:http';
import { readFile, writeFile, rename, mkdir, copyFile } from 'node:fs/promises';
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from './public/js/schema.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data', 'content.json');
const BACKUPS = path.join(ROOT, 'data', 'backups');
const PORT = Number(process.env.PORT) || 3000;
const SESSION_MS = 8 * 60 * 60 * 1000;
const MAX_BODY = 1024 * 1024;

let password = process.env.ADMIN_PASSWORD;
if (!password) {
  password = randomBytes(9).toString('base64url');
  console.log(`\n  ADMIN_PASSWORD not set — using a one-time password for this run: ${password}\n`);
}
const passwordHash = createHash('sha256').update(password).digest();
const sessions = new Map(); // token -> expiry timestamp

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw Object.assign(new Error('Request too large'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('Invalid JSON'), { status: 400 });
  }
}

function isAuthed(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const expiry = sessions.get(token);
  if (!expiry) return false;
  if (expiry < Date.now()) { sessions.delete(token); return false; }
  return true;
}

async function saveContent(content) {
  await mkdir(BACKUPS, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await copyFile(DATA, path.join(BACKUPS, `content-${stamp}.json`)).catch(() => {});
  const tmp = `${DATA}.tmp`;
  await writeFile(tmp, JSON.stringify(content, null, 2) + '\n', 'utf8');
  await rename(tmp, DATA);
}

async function handleApi(req, res, pathname) {
  if (pathname === '/api/content' && req.method === 'GET') {
    return send(res, 200, await readFile(DATA, 'utf8'));
  }

  if (pathname === '/api/login' && req.method === 'POST') {
    const { password: attempt } = (await readBody(req)) ?? {};
    const attemptHash = createHash('sha256').update(String(attempt ?? '')).digest();
    if (!timingSafeEqual(attemptHash, passwordHash)) {
      await new Promise((r) => setTimeout(r, 500));
      return send(res, 401, { error: 'Incorrect password' });
    }
    const token = randomBytes(32).toString('base64url');
    sessions.set(token, Date.now() + SESSION_MS);
    return send(res, 200, { token });
  }

  if (pathname === '/api/logout' && req.method === 'POST') {
    sessions.delete((req.headers.authorization || '').replace(/^Bearer /, ''));
    return send(res, 200, { ok: true });
  }

  if (pathname === '/api/session' && req.method === 'GET') {
    return send(res, isAuthed(req) ? 200 : 401, { ok: isAuthed(req) });
  }

  if (pathname === '/api/content' && req.method === 'PUT') {
    if (!isAuthed(req)) return send(res, 401, { error: 'Session expired — please sign in again' });
    let clean;
    try {
      clean = validate(await readBody(req));
    } catch (err) {
      return send(res, err.status || 400, { error: err.message });
    }
    await saveContent(clean);
    return send(res, 200, { ok: true, content: clean });
  }

  return send(res, 404, { error: 'Not found' });
}

async function serveStatic(res, pathname) {
  if (pathname === '/admin') pathname = '/admin/';
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.normalize(path.join(PUBLIC, decodeURIComponent(pathname)));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'Forbidden', 'text/plain');
  try {
    const body = await readFile(file);
    send(res, 200, body, MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
  } catch {
    send(res, 404, 'Not found', 'text/plain');
  }
}

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  try {
    if (pathname.startsWith('/api/')) await handleApi(req, res, pathname);
    else if (req.method === 'GET') await serveStatic(res, pathname);
    else send(res, 405, 'Method not allowed', 'text/plain');
  } catch (err) {
    console.error(err);
    send(res, err.status || 500, { error: err.status ? err.message : 'Server error' });
  }
}).listen(PORT, () => {
  console.log(`  Viewer: http://localhost:${PORT}/`);
  console.log(`  Admin:  http://localhost:${PORT}/admin`);
});
