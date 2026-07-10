const express = require('express');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

// 上传单张图片
router.post('/image', auth, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '请选择图片' });
    }
    // 只返回相对路径
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
});

// 上传多张图片
router.post('/images', auth, upload.array('images', 9), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: '请选择图片' });
    }
    // 只返回相对路径
    const urls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ success: true, urls });
});

module.exports = router;