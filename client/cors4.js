const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// More explicit CORS configuration
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    // Explicitly list all common headers plus the Notion-specific ones
    allowedHeaders: [
        'accept',
        'accept-language',
        'content-type',
        'content-language',
        'x-requested-with',
        'authorization',
        'cookie',
        'x-notion-active-user-header',  // Notion specific
        'origin',
        'cache-control',
        'pragma',
        'expires'
    ]
}));

// Handle preflight explicitly
app.options('*', cors());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use('/', (req, res, next) => {
    const targetUrl = req.url.slice(1);
    if (!targetUrl) {
        return res.status(400).send('Target URL is required');
    }

    const proxy = createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        pathRewrite: {
            [`^/${targetUrl}`]: '',
        },
        onProxyRes: (proxyRes, req, res) => {
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 
                'accept, accept-language, content-type, content-language, x-requested-with, authorization, cookie, x-notion-active-user-header, origin');
        }
    });

    return proxy(req, res, next);
});

const port = process.env.PORT || 8082;
app.listen(port, () => {
    console.log(`Generic CORS Proxy listening on port ${port}`);
});