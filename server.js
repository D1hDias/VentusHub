import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const PORT = 5000;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // API endpoints
  if (pathname.startsWith('/api/')) {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      res.end(JSON.stringify({ success: true, user: { id: 1, email: 'test@test.com' } }));
      return;
    }
    
    if (pathname === '/api/auth/user') {
      res.end(JSON.stringify({ user: { id: 1, email: 'test@test.com' } }));
      return;
    }
    
    if (pathname === '/api/properties') {
      res.end(JSON.stringify([]));
      return;
    }
    
    if (pathname === '/api/proposals') {
      res.end(JSON.stringify([]));
      return;
    }
    
    if (pathname === '/api/contracts') {
      res.end(JSON.stringify([]));
      return;
    }
    
    if (pathname === '/api/notifications') {
      res.end(JSON.stringify({ notifications: [], totalCount: 0 }));
      return;
    }
    
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
    return;
  }

  // Static files
  let filePath = join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  
  if (!existsSync(filePath)) {
    filePath = join(__dirname, 'public', 'index.html');
  }

  const ext = extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});