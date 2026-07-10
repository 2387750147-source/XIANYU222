const API_BASE = '/api';
const TOKEN_KEY = 'trade_token';
const USER_KEY = 'trade_user';

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

export function isLoggedIn() {
    return !!getToken();
}

// 获取当前域名（自动适配本地和公网）
function getBaseUrl() {
    // 如果是本地开发，使用 localhost:3008
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3008';
    }
    // 公网环境，使用当前页面的域名（cpolar 域名）
    return window.location.origin;
}

async function request(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(API_BASE + url, {
        ...options,
        headers,
        credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) {
        const err = new Error(data.error || '请求失败');
        err.status = res.status;
        throw err;
    }
    return data;
}

// ========== 认证 ==========
export async function login(username, password) {
    const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
}

export async function register(username, password, nickname, phone, wechat, school) {
    return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, nickname, phone, wechat, school })
    });
}

export function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// ========== 用户 ==========
export async function getMe() {
    return request('/users/me');
}

export async function updateMe(data) {
    return request('/users/me', {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

export async function getUserInfo(userId) {
    return request(`/users/${userId}`);
}

// ========== 商品 ==========
export async function getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/products?${query}`);
}

export async function getProductDetail(id) {
    return request(`/products/${id}`);
}

export async function createProduct(data) {
    return request('/products', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function updateProduct(id, data) {
    return request(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

export async function deleteProduct(id) {
    return request(`/products/${id}`, {
        method: 'DELETE'
    });
}

export async function getUserProducts(userId, status) {
    const query = status ? `?status=${status}` : '';
    return request(`/products/user/${userId}${query}`);
}

// ========== 分类 ==========
export async function getCategories() {
    return request('/categories');
}

// ========== 收藏 ==========
export async function getFavorites() {
    return request('/favorites');
}

export async function addFavorite(productId) {
    return request(`/favorites/${productId}`, { method: 'POST' });
}

export async function removeFavorite(productId) {
    return request(`/favorites/${productId}`, { method: 'DELETE' });
}

export async function checkFavorite(productId) {
    return request(`/favorites/check/${productId}`);
}

// ========== 上传 ==========
export async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const token = getToken();
    const res = await fetch(API_BASE + '/upload/image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
}

export async function uploadImages(files) {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    const token = getToken();
    const res = await fetch(API_BASE + '/upload/images', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
}

// ========== 图片工具（自动适配域名） ==========
export function getImageUrl(path) {
    if (!path) return '/image/no-image.jpg';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return path;
    return '/' + path;
}

// ========== AI 智能客服 ==========
export async function chat(message) {
    return request('/chat/chat', {
        method: 'POST',
        body: JSON.stringify({ message })
    });
}