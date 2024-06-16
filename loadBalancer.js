const http = require('http');
const httpProxy = require('http-proxy');


const servers = [
    { host: 'localhost', port: 3001, healthy: true },
    { host: 'localhost', port: 3002, healthy: true },
    { host: 'localhost', port: 3003, healthy: true }
];

const proxy = httpProxy.createProxyServer();
let currentIndex = 0;

function getNextServer() {
    for (let i = 0; i < servers.length; i++) {
        const server = servers[(currentIndex + i) % servers.length];
        if (server.healthy) {
            currentIndex = (currentIndex + i + 1) % servers.length;
            return server;
        }
    }
    return null; // No healthy servers available
}


function checkServerHealth(server) {
    return new Promise((resolve) => {
        const req = http.request({ host: server.host, port: server.port, path: '/', method: 'HEAD' }, (res) => {
            server.healthy = res.statusCode === 200;
            resolve();
        });
        req.on('error', () => {
            server.healthy = false;
            resolve();
        });
        req.end();
    });
}

// Periodically checking the health of servers
setInterval(() => {
    servers.forEach(server => checkServerHealth(server));
}, 5000);

const server = http.createServer((req, res) => {
    const target = getNextServer();
    if (target) {
        console.log(`Proxying request to: ${target.host}:${target.port}`);
        proxy.web(req, res, { target: `http://${target.host}:${target.port}` });
    } else {
        res.statusCode = 503;
        res.end('Service Unavailable');
    }
});

server.listen(3000, () => {
    console.log('Load balancer listening on port 3000');
});
