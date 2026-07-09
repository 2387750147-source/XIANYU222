import { getMe, getUserProducts, getFavorites, updateMe, logout, getCurrentUser } from '../../utils/api.js';
import { escapeHtml } from '../../utils/escape.js';

const user = getCurrentUser();
if (!user) {
    alert('请先登录');
    location.href = '../index/index.html';
}

const container = document.getElementById('profile-container');
let currentTab = 'products';
let currentUserData = null;

async function loadProfile() {
    try {
        currentUserData = await getMe();
        const products = await getUserProducts(currentUserData.id);
        const favorites = await getFavorites();

        container.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">${(currentUserData.nickname || currentUserData.username || 'U')[0].toUpperCase()}</div>
                <div>
                    <div class="profile-name">${escapeHtml(currentUserData.nickname || currentUserData.username)} <small>@${escapeHtml(currentUserData.username)}</small></div>
                    ${currentUserData.school ? `<div style="color:var(--text-light);font-size:0.9rem;">🏫 ${escapeHtml(currentUserData.school)}</div>` : ''}
                    <div class="profile-stats">
                        <div class="stat"><div class="num">${products.length}</div><div class="label">发布</div></div>
                        <div class="stat"><div class="num">${favorites.length}</div><div class="label">收藏</div></div>
                        <div class="stat"><div class="num">${products.filter(p => p.status === 'on_sale').length}</div><div class="label">在售</div></div>
                    </div>
                    <div style="margin-top:12px;display:flex;gap:12px;flex-wrap:wrap;">
                        <button class="btn btn-outline" id="edit-profile-btn">✏️ 编辑资料</button>
                        <button class="btn btn-danger" id="logout-btn">🚪 退出登录</button>
                    </div>
                </div>
            </div>
            <div class="profile-tabs">
                <span class="tab active" data-tab="products">📦 我的发布 (${products.length})</span>
                <span class="tab" data-tab="favorites">❤️ 我的收藏 (${favorites.length})</span>
            </div>
            <div id="tab-content"></div>
        `;

        // Tab切换
        container.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentTab = tab.dataset.tab;
                renderTabContent(currentTab, products, favorites);
            });
        });

        renderTabContent('products', products, favorites);

        // 编辑资料按钮
        document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
            openEditModal();
        });

        // 退出登录
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (confirm('确定要退出登录吗？')) {
                logout();
                location.href = '../index/index.html';
            }
        });

    } catch (err) {
        container.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>加载失败</h3><p>${err.message}</p></div>`;
    }
}

function renderTabContent(tab, products, favorites) {
    const content = document.getElementById('tab-content');
    if (tab === 'products') {
        if (products.length === 0) {
            content.innerHTML = `<div class="empty-state"><div class="icon">📭</div><h3>还没有发布</h3><p><a href="../publish/publish.html" style="color:var(--primary-color);">去发布闲置</a></p></div>`;
            return;
        }
        content.innerHTML = `
            <div class="profile-products">
                ${products.map(p => `
                    <div class="profile-product-card" onclick="location.href='../detail/detail.html?id=${p.id}'">
                        <img src="${p.images && p.images.length > 0 ? p.images[0] : '/image/no-image.jpg'}" onerror="this.src='/image/no-image.jpg'">
                        <div class="info">
                            <div class="title">${escapeHtml(p.title)}</div>
                            <div class="price">¥${p.price}</div>
                            <div class="status">${p.status === 'on_sale' ? '🟢 在售' : p.status === 'sold' ? '🔴 已售' : '⚪ 已下架'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        if (favorites.length === 0) {
            content.innerHTML = `<div class="empty-state"><div class="icon">💔</div><h3>还没有收藏</h3><p>去逛逛喜欢的物品吧</p></div>`;
            return;
        }
        content.innerHTML = `
            <div class="profile-products">
                ${favorites.map(p => `
                    <div class="profile-product-card" onclick="location.href='../detail/detail.html?id=${p.id}'">
                        <img src="${p.images && p.images.length > 0 ? p.images[0] : '/image/no-image.jpg'}" onerror="this.src='/image/no-image.jpg'">
                        <div class="info">
                            <div class="title">${escapeHtml(p.title)}</div>
                            <div class="price">¥${p.price}</div>
                            <div class="status">❤️ 已收藏</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

function openEditModal() {
    const modal = document.getElementById('edit-modal');
    document.getElementById('edit-nickname').value = currentUserData.nickname || '';
    document.getElementById('edit-phone').value = currentUserData.phone || '';
    document.getElementById('edit-wechat').value = currentUserData.wechat || '';
    document.getElementById('edit-school').value = currentUserData.school || '';
    modal.style.display = 'flex';
}

document.getElementById('edit-profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nickname: document.getElementById('edit-nickname').value.trim(),
        phone: document.getElementById('edit-phone').value.trim(),
        wechat: document.getElementById('edit-wechat').value.trim(),
        school: document.getElementById('edit-school').value.trim()
    };
    try {
        await updateMe(data);
        alert('资料更新成功');
        document.getElementById('edit-modal').style.display = 'none';
        loadProfile();
    } catch (err) {
        alert('更新失败：' + err.message);
    }
});

document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-mask');
        if (modal) modal.style.display = 'none';
    });
});

loadProfile();