const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello from server on port 3001');
});

app.listen(3001, () => {
    console.log('Server running on port 3001');
});
