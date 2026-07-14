# 🏫 校园二手交易平台

一个专为校园场景设计的二手物品交易平台，支持商品发布、浏览搜索、在线私信、AI 智能客服等功能。

## ✨ 功能特性

### 用户系统
- **注册 / 登录**：JWT 令牌认证，登录限流防暴力破解
- **个人中心**：修改头像、昵称、联系方式（微信/手机）
- **身份标识**：区分普通用户与管理员

### 商品交易
- **发布商品**：多图上传、分类选择、价格描述、联系方式
- **商品列表**：按分类筛选、关键词搜索、按时间/热度排序
- **商品详情**：大图浏览、卖家信息、联系方式展示
- **编辑 / 下架**：卖家可管理自己的商品

### 社交互动
- **收藏商品**：一键收藏，独立收藏页查看
- **评论系统**：支持楼中楼回复，作者可删除自己的评论
- **私信聊天**：实时对话列表，与卖家直接沟通

### 智能辅助
- **AI 商品识别**：上传图片自动识别商品信息，智能填写标题和分类
- **AI 智能客服**：对接大模型提供平台使用帮助和买卖建议

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | HTML5 + CSS3 + Vanilla JS (ES Module) | 原生开发，零框架依赖 |
| **后端** | Node.js + Express 4.x | RESTful API 服务 |
| **数据库** | PostgreSQL (Supabase) | 云端托管数据库 |
| **文件存储** | Supabase Storage | 商品图片云端存储 |
| **认证** | JWT (jsonwebtoken) + bcryptjs | 令牌认证 + 密码哈希 |
| **AI** | 百度智能云 + 大模型 API | 图片识别 + 智能对话 |
| **安全** | express-rate-limit + CORS | 登录限流 + 跨域控制 |

## 📁 项目结构

```
XIANYU222-main/
├── 启动服务器.bat           # Windows 一键启动脚本
├── package.json             # 根依赖（Puppeteer）
├── README.md
│
├── backend/                 # 后端服务
│   ├── server.js            # 入口文件（端口 3008）
│   ├── init.sql             # 数据库建表 + 种子数据 SQL
│   ├── .env                 # 环境变量（密钥、数据库连接等）
│   │
│   ├── config/
│   │   └── db.js            # Supabase 数据库连接 + 工具函数
│   │
│   ├── middleware/
│   │   ├── auth.js          # JWT 认证中间件
│   │   └── upload.js        # Multer 图片上传中间件
│   │
│   └── routes/
│       ├── auth.js          # POST 注册/登录
│       ├── users.js         # GET/PUT 用户信息 CRUD
│       ├── products.js      # GET/POST/PUT/DELETE 商品 CRUD
│       ├── categories.js    # GET 分类列表
│       ├── favorites.js     # POST/DELETE/GET 收藏管理
│       ├── comments.js      # GET/POST/DELETE 评论系统
│       ├── messages.js      # GET/POST 私信收发
│       ├── chat.js          # POST AI 智能客服
│       ├── ai.js            # POST 百度 AI 图片识别
│       └── upload.js        # POST 图片上传 Supabase Storage
│
└── frontend/                # 前端页面
    ├── public/
    │   └── style.css        # 全局样式（CSS 变量 + 响应式）
    │
    ├── utils/
    │   ├── api.js           # API 封装 + 认证工具
    │   └── escape.js        # XSS 防护（HTML 转义）
    │
    ├── image/
    │   └── no-image.jpg     # 默认商品占位图
    │
    └── pages/
        ├── index/           # 首页 - 商品列表、搜索、分类
        ├── detail/          # 商品详情 - 大图、评论、私信入口
        ├── publish/         # 发布/编辑商品
        ├── messages/        # 私信聊天
        ├── favorites/       # 我的收藏
        ├── profile/         # 个人中心 / 我的发布
        ├── my/              # 用户管理页面
        └── chat/            # AI 智能客服页面
```

## 🗄️ 数据库设计

### E-R 关系图

```
users ──1:N──→ products ──1:N──→ comments
  │                │                  │
  │                │                  └── parent_id (楼中楼)
  │                │
  │                └──1:N──→ favorites
  │
  ├──1:N──→ messages (sender)
  └──1:N──→ messages (receiver)

categories ──1:N──→ products
```

### 核心表结构

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| **users** | 用户表 | id, username, password(哈希), nickname, avatar, phone, wechat, school, role, is_banned |
| **categories** | 商品分类 | id, name, icon, sort_order |
| **products** | 商品表 | id, title, description, price, category_id, status, images, user_id, view_count, favorite_count |
| **favorites** | 收藏表 | id, user_id, product_id (UNIQUE约束) |
| **comments** | 评论表 | id, product_id, user_id, parent_id(楼中楼), content |
| **messages** | 私信表 | id, sender_id, receiver_id, product_id, content, is_read |

> 详细建表 SQL 见 `backend/init.sql`，可直接在 Supabase SQL Editor 中执行。

## 🚀 快速开始

### 环境要求
- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- 一个 **Supabase** 账号（免费层即可）

### 1. 克隆项目

```bash
git clone https://github.com/zwxecut2025/XIANYU222.git
cd XIANYU222-main
```

### 2. 配置数据库

1. 在 [Supabase](https://supabase.com) 创建项目
2. 进入 SQL Editor，执行 `backend/init.sql` 的全部内容
3. 在 Supabase 项目设置中获取 `Project URL` 和 `anon/public key`

### 3. 配置环境变量

在 `backend/` 目录下创建 `.env` 文件：

```env
PORT=3008
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-random-secret-string
BAIDU_API_KEY=your-baidu-api-key      # AI 图片识别（可选）
BAIDU_SECRET_KEY=your-baidu-secret    # AI 图片识别（可选）
DASHSCOPE_API_KEY=your-dashscope-key  # AI 智能客服（可选）
```

### 4. 安装依赖并启动

```bash
# 安装后端依赖
cd backend
npm install

# 启动服务
npm start
# 或开发模式（热重载）
npm run dev
```

或者直接双击 `启动服务器.bat`（Windows）。

### 5. 访问

浏览器打开 `http://localhost:3008`，即可进入首页。

### 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| `admin` | `123456` | 管理员 |
| `seller1` | `123456` | 普通卖家 |

## 📡 API 接口概览

### 认证模块 `/api/auth`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 否 |
| POST | `/api/auth/login` | 用户登录 | 否（有限流） |

### 用户模块 `/api/users`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/users/me` | 获取当前用户信息 | 是 |
| PUT | `/api/users/me` | 更新个人信息 | 是 |
| GET | `/api/users/:id` | 查看指定用户信息 | 否 |

### 商品模块 `/api/products`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/products` | 商品列表（支持搜索/分类/排序/分页） | 否 |
| GET | `/api/products/mine` | 我的发布 | 是 |
| GET | `/api/products/:id` | 商品详情 | 否 |
| POST | `/api/products` | 发布商品 | 是 |
| PUT | `/api/products/:id` | 编辑商品 | 是（作者） |
| DELETE | `/api/products/:id` | 删除/下架商品 | 是（作者） |

### 其他模块

| 模块 | 前缀 | 主要接口 |
|------|------|----------|
| 分类 | `/api/categories` | GET 获取全部分类 |
| 收藏 | `/api/favorites` | GET 收藏列表 / POST 收藏 / DELETE 取消收藏 |
| 评论 | `/api/comments` | GET 商品评论 / POST 发表评论 / DELETE 删除评论 |
| 私信 | `/api/messages` | GET 对话列表+消息 / POST 发送消息 |
| 上传 | `/api/upload` | POST 上传图片 |
| AI | `/api/ai` | POST 图片识别填充商品信息 |
| 客服 | `/api/chat` | POST AI 智能对话 |

## 🎨 前端页面说明

| 页面 | 路径 | 功能 |
|------|------|------|
| **首页** | `/` | 商品列表展示、分类筛选、关键词搜索、最新/最热排序 |
| **商品详情** | `/pages/detail/` | 商品大图、详情、卖家信息、评论区（含楼中楼）、收藏、私信入口 |
| **发布商品** | `/pages/publish/` | 多图上传（支持 AI 识别自动填充）、分类选择、价格设置 |
| **私信** | `/pages/messages/` | 对话列表、实时聊天、支持从商品页直接发起对话 |
| **收藏** | `/pages/favorites/` | 查看收藏商品列表、一键跳转详情 |
| **个人中心** | `/pages/profile/` | 个人资料编辑、我的发布管理 |
| **AI 客服** | `/pages/chat/` | 大模型驱动的智能客服对话 |

## ⚠️ 注意事项

1. **Supabase 配置**：`.env` 文件包含密钥，已加入 `.gitignore`，不要泄露到公开仓库
2. **图片上传**：依赖 Supabase Storage，需在 Supabase 中创建一个名为 `product-images` 的公开 bucket
3. **AI 功能**：百度和 DashScope API Key 为可选项，不配置则 AI 功能不可用但其他功能正常
4. **端口冲突**：默认端口 3008，如被占用可在 `.env` 中修改
5. **Node 版本**：建议 18.x 或更高版本，低版本可能兼容性问题

## 📄 License

MIT License
