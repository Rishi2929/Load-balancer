const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello from server on port 3002');
});

app.listen(3002, () => {
    console.log('Server running on port 3002');
});
