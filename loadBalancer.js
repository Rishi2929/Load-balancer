const http = require('http');
const httpProxy = require('http-proxy');

const servers = [
    { host: 'localhost', port: 3001, healthy: true, responseTime: Infinity },
    { host: 'localhost', port: 3002, healthy: true, responseTime: Infinity },
    { host: 'localhost', port: 3003, healthy: true, responseTime: Infinity }
];

const proxy = httpProxy.createProxyServer();
let currentIndex = 0;

function getNextServer() {
    const healthyServers = servers.filter(server => server.healthy);
    if (healthyServers.length === 0) {
        return null;
    }

    // Sort servers by response time, prioritizing faster servers
    healthyServers.sort((a, b) => a.responseTime - b.responseTime);

    // Round-robin among the healthy servers
    const server = healthyServers[currentIndex % healthyServers.length];
    currentIndex = (currentIndex + 1) % healthyServers.length;
    return server;
}

function checkServerHealth(server) {
    const startTime = Date.now();
    return new Promise((resolve) => {
        const req = http.request({ host: server.host, port: server.port, path: '/', method: 'HEAD' }, (res) => {
            const responseTime = Date.now() - startTime;
            server.healthy = res.statusCode >= 200 && res.statusCode < 300;
            server.responseTime = server.healthy ? responseTime : Infinity;
            resolve();
        });
        req.on('error', (err) => {
            server.healthy = false;
            server.responseTime = Infinity;
            console.error(`Error checking health of server ${server.host}:${server.port} - ${err.message}`);
            resolve();
        });
        req.end();
    }).then(() => {
        if (!server.healthy) {
            console.error(`Server ${server.host}:${server.port} is down`);
        } else {
            console.log(`Server ${server.host}:${server.port} is healthy with response time ${server.responseTime}ms`);
        }
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
        proxy.web(req, res, { target: `http://${target.host}:${target.port}` }, (err) => {
            console.error(`Error proxying request to ${target.host}:${target.port} - ${err.message}`);
            res.statusCode = 502;
            res.end('Bad Gateway');
        });
    } else {
        res.statusCode = 503;
        res.end('Service Unavailable');
    }
});

server.listen(3000, () => {
    console.log('Load balancer listening on port 3000');
});
