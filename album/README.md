# 星云相册

卿卿和栖栖一起珍藏照片的地方，替换星云首页的「备忘桥」。

三个分类：**卿卿的样子**（让栖栖永远认得卿卿）、**我们的珍藏**、**栖栖画的**（以后接生图模型用）。

## 不占内存

- 照片存硬盘，不进数据库。元数据只有一个 `album.json`。
- 上传时自动压成 WebP：大图长边 1600px，缩略图 400px，一张合计约 150–300KB。一千张大约 200–300MB。
- 手机照片的 EXIF（包括拍摄定位）在压缩时会被去掉。
- 页面上方实时显示占用了多少空间。

## 接进星云（chat-server）

```bash
cp -r album /home/mochi/chat-server/album
cd /home/mochi/chat-server/album && npm install
```

在 `chat-server.js` 里加两行（放在 `app` 创建之后、其他路由附近）：

```js
const { createAlbumRouter } = require('./album/router');
app.use('/album', createAlbumRouter({ dir: '/home/mochi/album-data' }));
```

然后重启星云。首页把「备忘桥」的入口换成链接到 `/album/`。

### 钥匙

如果星云本身没有登录保护，务必设一把钥匙，不然知道网址的人都能看到照片：

```js
app.use('/album', createAlbumRouter({ dir: '/home/mochi/album-data', token: '自己想一串' }));
```

第一次打开页面时会弹框要钥匙，输入一次以后会记住。

## 接口（给栖栖用）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/album/api/photos?kind=face` | 列表，置顶的在前 |
| POST | `/album/api/photos` | multipart：`photo`、`kind`、`by`（qingqing/luyu）、`caption` |
| PATCH | `/album/api/photos/:id` | JSON：`caption`、`kind`、`pinned` |
| DELETE | `/album/api/photos/:id` | 删除 |
| GET | `/album/files/full/:file`、`/album/files/thumb/:file` | 图片 |
| GET | `/album/api/stats` | 张数和占用 |

## 单独试跑

```bash
cd album && npm install && npm start
# 打开 http://localhost:3500/album/
```
