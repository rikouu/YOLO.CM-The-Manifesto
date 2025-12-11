const http = require('http');
const https = require('https');

const PORT = 8787;
const GEMINI_HOST = 'generativelanguage.googleapis.com';

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 健康检查
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', location: 'US VPS' }));
    return;
  }

  // 代理请求到 Gemini API
  let body = [];
  req.on('data', chunk => body.push(chunk));
  req.on('end', () => {
    body = Buffer.concat(body).toString();

    const options = {
      hostname: GEMINI_HOST,
      port: 443,
      path: req.url,
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const proxyReq = https.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    });

    if (body) proxyReq.write(body);
    proxyReq.end();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Gemini Proxy running on port ${PORT}`);
});
