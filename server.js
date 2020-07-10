const express = require('express');
const { updateVideoInfo } = require('./videoUpdater');
const app = express();
const port = 3000;

// simple express server
app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);

    // insert video ID to updateVideoInfo function
    // i.e.: https://www.youtube.com/watch?v=dQw4w9WgXcQ where 'dQw4w9WgXcQ' is the video ID
    // make sure it's your own video though, otherwise errors will knock on your door init!
    updateVideoInfo('kXhapq5SN1I');
});
