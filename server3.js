const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello from server on port 3003');
});

app.listen(3003, () => {
    console.log('Server running on port 3003');
});
