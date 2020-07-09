const express = require('express');
const { updateVideoInfo } = require('./videoUpdater');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
    updateVideoInfo('kXhapq5SN1I');
});
