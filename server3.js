const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello from server on port 3003');
});
app.get('/health', (req, res) => {
    res.send('Health checking on port 3003 successfull');
});
app.get('/api', (req, res) => {
    res.send('api on port 3003 successfull');
});


app.listen(3003, () => {
    console.log('Server running on port 3003');
});
