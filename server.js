const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { pool, initDatabase } = require('./config/db');
const rateLimit = require('express-rate-limit');

const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error('\n❌ 缺少必要的环境变量:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
}
console.log('✅ 环境变量检查通过');

const auth = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const productsRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const favoritesRoutes = require('./routes/favorites');
const uploadRoutes = require('./routes/upload');
const chatRoutes = require('./routes/chat');

const app = express();
app.set('trust proxy', 1);

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3008', 'http://localhost:5500', 'https://*.cpolar.cn'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

initDatabase().then(() => console.log('✅ 数据库初始化完成')).catch(err => {
    console.warn('⚠️ 数据库连接失败，将使用模拟数据:', err.message);
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: '登录尝试过多，请15分钟后再试' }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在端口 ${PORT}`);
});

app.get('/', (req, res) => {
    res.redirect('/pages/index/index.html');
});

process.on('SIGINT', () => {
    console.log('正在关闭服务器...');
    pool.end().then(() => process.exit(0)).catch(() => process.exit(0));
});