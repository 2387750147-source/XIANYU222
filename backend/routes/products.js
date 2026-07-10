const express = require('express');
const { pool } = require('../config/db');
const { mockProducts, mockCategories } = require('../config/mockData');
const auth = require('../middleware/auth');
const router = express.Router();

let dbAvailable = true;

async function checkDbConnection() {
    try {
        await pool.getConnection();
        dbAvailable = true;
    } catch {
        dbAvailable = false;
    }
}

checkDbConnection();

router.get('/', async (req, res) => {
    const { category_id, keyword, status, page = 1, limit = 20, sort = 'new' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    if (!dbAvailable) {
        let products = [...mockProducts];
        if (category_id) {
            products = products.filter(p => p.category_id == category_id);
        }
        if (keyword) {
            const kw = keyword.toLowerCase();
            products = products.filter(p => 
                p.title.toLowerCase().includes(kw) || 
                p.description.toLowerCase().includes(kw)
            );
        }
        if (status && status !== 'on_sale') {
            products = products.filter(p => p.status === status);
        }
        if (sort === 'new') {
            products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (sort === 'price_asc') {
            products.sort((a, b) => a.price - b.price);
        } else if (sort === 'price_desc') {
            products.sort((a, b) => b.price - a.price);
        } else if (sort === 'hot') {
            products.sort((a, b) => b.view_count - a.view_count);
        }
        const total = products.length;
        products = products.slice(offset, offset + limitNum);
        return res.json({
            success: true,
            data: products,
            total,
            page: parseInt(page),
            limit: limitNum,
            pages: Math.ceil(total / limitNum)
        });
    }

    let sql = `
        SELECT p.*, u.username, u.nickname, u.avatar,
               c.name as category_name, c.icon as category_icon
        FROM products p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'on_sale'
    `;
    const params = [];

    if (category_id) {
        sql += ' AND p.category_id = ?';
        params.push(category_id);
    }
    if (keyword) {
        sql += ' AND (p.title LIKE ? OR p.description LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status) {
        sql += ' AND p.status = ?';
        params.push(status);
    }

    if (sort === 'new') {
        sql += ' ORDER BY p.created_at DESC';
    } else if (sort === 'price_asc') {
        sql += ' ORDER BY p.price ASC';
    } else if (sort === 'price_desc') {
        sql += ' ORDER BY p.price DESC';
    } else if (sort === 'hot') {
        sql += ' ORDER BY p.view_count DESC';
    }

    let countSql = 'SELECT COUNT(*) as total FROM products p WHERE p.status = "on_sale"';
    const countParams = [];

    if (category_id) {
        countSql += ' AND p.category_id = ?';
        countParams.push(category_id);
    }
    if (keyword) {
        countSql += ' AND (p.title LIKE ? OR p.description LIKE ?)';
        countParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status) {
        countSql += ' AND p.status = ?';
        countParams.push(status);
    }

    try {
        const [countResult] = await pool.query(countSql, countParams);
        const total = countResult[0]?.total || 0;

        sql += ' LIMIT ? OFFSET ?';
        params.push(limitNum, offset);

        const [rows] = await pool.query(sql, params);

        const products = rows.map(p => {
            const images = p.images ? JSON.parse(p.images) : [];
            return {
                ...p,
                images
            };
        });

        res.json({
            success: true,
            data: products,
            total,
            page: parseInt(page),
            limit: limitNum,
            pages: Math.ceil(total / limitNum)
        });
    } catch (err) {
        console.error('获取商品列表失败:', err);
        res.status(500).json({ success: false, message: '获取商品列表失败' });
    }
});

router.get('/categories', async (req, res) => {
    if (!dbAvailable) {
        return res.json({ success: true, data: mockCategories });
    }
    try {
        const [rows] = await pool.query('SELECT * FROM categories ORDER BY sort_order');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('获取分类失败:', err);
        res.json({ success: true, data: mockCategories });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    if (!dbAvailable) {
        const product = mockProducts.find(p => p.id == id);
        if (!product) {
            return res.status(404).json({ success: false, message: '商品不存在' });
        }
        product.view_count++;
        return res.json({ success: true, data: product });
    }

    try {
        await pool.query('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [id]);
        const [rows] = await pool.query(`
            SELECT p.*, u.username, u.nickname, u.avatar,
                   c.name as category_name, c.icon as category_icon
            FROM products p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: '商品不存在' });
        }

        const product = rows[0];
        product.images = product.images ? JSON.parse(product.images) : [];

        res.json({ success: true, data: product });
    } catch (err) {
        console.error('获取商品详情失败:', err);
        res.status(500).json({ success: false, message: '获取商品详情失败' });
    }
});

router.post('/', auth, async (req, res) => {
    const { title, description, price, category_id, contact_phone, contact_wechat, images } = req.body;

    if (!title || !price) {
        return res.status(400).json({ success: false, message: '标题和价格不能为空' });
    }

    try {
        const [result] = await pool.query(`
            INSERT INTO products (title, description, price, category_id, contact_phone, contact_wechat, images, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [title, description, price, category_id, contact_phone, contact_wechat, JSON.stringify(images), req.user.id]);

        res.json({
            success: true,
            data: {
                id: result.insertId,
                title,
                description,
                price,
                category_id,
                contact_phone,
                contact_wechat,
                images
            }
        });
    } catch (err) {
        console.error('发布商品失败:', err);
        res.status(500).json({ success: false, message: '发布商品失败' });
    }
});

router.put('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { title, description, price, category_id, status, contact_phone, contact_wechat, images } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: '商品不存在' });
        }

        if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: '无权修改此商品' });
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (price) updateData.price = price;
        if (category_id) updateData.category_id = category_id;
        if (status) updateData.status = status;
        if (contact_phone) updateData.contact_phone = contact_phone;
        if (contact_wechat) updateData.contact_wechat = contact_wechat;
        if (images) updateData.images = JSON.stringify(images);

        await pool.query('UPDATE products SET ? WHERE id = ?', [updateData, id]);

        res.json({ success: true, message: '修改成功' });
    } catch (err) {
        console.error('修改商品失败:', err);
        res.status(500).json({ success: false, message: '修改商品失败' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: '商品不存在' });
        }

        if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: '无权删除此商品' });
        }

        await pool.query('DELETE FROM products WHERE id = ?', [id]);

        res.json({ success: true, message: '删除成功' });
    } catch (err) {
        console.error('删除商品失败:', err);
        res.status(500).json({ success: false, message: '删除商品失败' });
    }
});

module.exports = router;