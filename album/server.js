// 单独跑相册（测试用）：node server.js，然后打开 http://localhost:3500/album/
const express = require('express');
const { createAlbumRouter } = require('./router');

const app = express();
app.use('/album', createAlbumRouter());
const port = process.env.PORT || 3500;
app.listen(port, () => console.log(`相册已启动：http://localhost:${port}/album/`));
