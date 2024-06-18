const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello from server on port 3001');
});
app.get('/health', (req, res) => {
    res.send('Health checking on port 3001 successfull');
});
app.get('/api', (req, res) => {
    res.send('api on port 3001 successfull');
});

app.listen(3001, () => {
    console.log('Server running on port 3001');
});
