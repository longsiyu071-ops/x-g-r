// 星云相册：卿卿和栖栖一起珍藏照片的地方。
// 照片压成 WebP 存在硬盘上，album.json 只记元数据，不进数据库。
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KINDS = ['face', 'ours', 'drawn']; // 卿卿的样子 / 我们的珍藏 / 栖栖画的
const BY = ['qingqing', 'luyu'];
const MAX_SIDE = 1600;
const THUMB_SIDE = 400;

function createAlbumRouter(opts = {}) {
  const dir = opts.dir || process.env.ALBUM_DIR || path.join(__dirname, 'data');
  const token = opts.token !== undefined ? opts.token : process.env.ALBUM_TOKEN;
  const photosDir = path.join(dir, 'photos');
  const thumbsDir = path.join(dir, 'thumbs');
  const metaFile = path.join(dir, 'album.json');
  fs.mkdirSync(photosDir, { recursive: true });
  fs.mkdirSync(thumbsDir, { recursive: true });

  function load() {
    try {
      return JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    } catch {
      return [];
    }
  }
  function save(list) {
    const tmp = metaFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
    fs.renameSync(tmp, metaFile);
  }

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
  });

  const router = express.Router();

  // 设了 ALBUM_TOKEN 就要带钥匙；图片 <img> 带不了请求头，所以也认 ?token=
  router.use((req, res, next) => {
    if (!token) return next();
    if (req.path === '/' || req.path === '/index.html') return next();
    const given = req.get('x-album-token') || req.query.token;
    if (given === token) return next();
    res.status(401).json({ error: '需要相册钥匙' });
  });

  router.get('/', (req, res) => {
    if (!req.originalUrl.split('?')[0].endsWith('/')) return res.redirect(301, req.originalUrl.replace(/(\?|$)/, '/$1'));
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  router.get('/api/photos', (req, res) => {
    let list = load();
    if (req.query.kind) list = list.filter((p) => p.kind === req.query.kind);
    list.sort((a, b) => (b.pinned - a.pinned) || b.createdAt.localeCompare(a.createdAt));
    res.json(list);
  });

  router.get('/api/stats', (req, res) => {
    const list = load();
    res.json({ count: list.length, bytes: list.reduce((n, p) => n + p.bytes, 0) });
  });

  router.post('/api/photos', upload.single('photo'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: '没有收到图片' });
    const kind = KINDS.includes(req.body.kind) ? req.body.kind : 'ours';
    const by = BY.includes(req.body.by) ? req.body.by : 'qingqing';
    const id = Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
    const file = id + '.webp';
    try {
      // rotate() 按手机拍照方向摆正；输出时 EXIF（含定位）会被丢掉
      const base = sharp(req.file.buffer, { failOn: 'none' }).rotate();
      const info = await base
        .clone()
        .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(path.join(photosDir, file));
      const thumb = await base
        .clone()
        .resize(THUMB_SIDE, THUMB_SIDE, { fit: 'cover' })
        .webp({ quality: 70 })
        .toFile(path.join(thumbsDir, file));
      const photo = {
        id,
        file,
        kind,
        by,
        caption: (req.body.caption || '').slice(0, 500),
        takenAt: req.body.takenAt || '',
        pinned: false,
        width: info.width,
        height: info.height,
        bytes: info.size + thumb.size,
        createdAt: new Date().toISOString(),
      };
      const list = load();
      list.push(photo);
      save(list);
      res.json(photo);
    } catch (e) {
      res.status(400).json({ error: '这张图读不出来：' + e.message });
    }
  });

  router.patch('/api/photos/:id', express.json(), (req, res) => {
    const list = load();
    const photo = list.find((p) => p.id === req.params.id);
    if (!photo) return res.status(404).json({ error: '没找到' });
    const { caption, kind, pinned, takenAt } = req.body || {};
    if (typeof caption === 'string') photo.caption = caption.slice(0, 500);
    if (KINDS.includes(kind)) photo.kind = kind;
    if (typeof pinned === 'boolean') photo.pinned = pinned;
    if (typeof takenAt === 'string') photo.takenAt = takenAt;
    save(list);
    res.json(photo);
  });

  router.delete('/api/photos/:id', (req, res) => {
    const list = load();
    const i = list.findIndex((p) => p.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: '没找到' });
    const [photo] = list.splice(i, 1);
    save(list);
    for (const d of [photosDir, thumbsDir]) fs.rm(path.join(d, photo.file), { force: true }, () => {});
    res.json({ ok: true });
  });

  router.get('/files/:size/:file', (req, res) => {
    const d = { full: photosDir, thumb: thumbsDir }[req.params.size];
    if (!d || !/^[a-z0-9]+\.webp$/.test(req.params.file)) return res.sendStatus(404);
    res.set('Cache-Control', 'private, max-age=31536000, immutable');
    res.sendFile(path.join(d, req.params.file), (err) => err && !res.headersSent && res.sendStatus(404));
  });

  return router;
}

module.exports = { createAlbumRouter };
