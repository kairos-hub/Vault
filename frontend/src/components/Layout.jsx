import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Shield, Plus, LogOut, Server, Database, Globe, Key, Folder, Sun, Moon, Trash2, Users } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../utils/authStore';
import ProductModal from './ProductModal';

const ICONS = { server: Server, database: Database, globe: Globe, key: Key, folder: Folder };

export default function Layout() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('vault_theme') || 'dark');
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      if (data.success) setProducts(data.data);
    } catch {}
  };

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('vault_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const handleLogout = () => { logout(); navigate('/login'); };

  const handleDeleteProduct = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('确认删除该产品？产品下所有记录将一并删除，此操作不可恢复。')) return;
    try {
      await api.delete(`/products/${productId}`);
      await fetchProducts();
      // 如果当前在该产品页则跳回首页
      if (window.location.pathname.includes(`/product/${productId}`)) {
        navigate('/');
      }
    } catch (err) {
      alert(err.response?.data?.message || '删除失败');
    }
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside className="w-60 flex flex-col border-r" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Shield size={14} color="white" />
          </div>
          <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--text)' }}>Vault</span>
        </div>

        {/* 导航 */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <NavLink to="/"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-all ${isActive ? 'font-medium' : ''}`}
            style={({ isActive }) => ({
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              color: isActive ? '#818cf8' : 'var(--text-muted)',
            })}
            end>
            <Grid size={15} />
            总览
          </NavLink>

          {!!+user?.is_admin && (
            <NavLink to="/admin/users"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-all ${isActive ? 'font-medium' : ''}`}
              style={({ isActive }) => ({
                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                color: isActive ? '#818cf8' : 'var(--text-muted)',
              })}>
              <Users size={15} />
              用户管理
            </NavLink>
          )}

          <div className="mt-4 mb-2 px-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>产品</span>
              <button onClick={() => setShowModal(true)}
                className="w-5 h-5 rounded flex items-center justify-center transition-all"
                style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <Plus size={13} />
              </button>
            </div>
          </div>

          {products.map(p => {
            const Icon = ICONS[p.icon] || Folder;
            const isHovered = hoveredProduct === p.id;
            return (
              <div key={p.id} className="relative"
                onMouseEnter={() => setHoveredProduct(p.id)}
                onMouseLeave={() => setHoveredProduct(null)}>
                <NavLink to={`/product/${p.id}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-all"
                  style={({ isActive }) => ({
                    background: isActive ? 'var(--bg-hover)' : 'transparent',
                    color: isActive ? 'var(--text)' : 'var(--text-muted)',
                  })}>
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: p.color + '22' }}>
                    <Icon size={11} style={{ color: p.color }} />
                  </div>
                  <span className="flex-1 truncate">{p.name}</span>
                  {/* hover 时显示删除按钮，否则显示数量 */}
                  {isHovered ? (
                    <button
                      onClick={(e) => handleDeleteProduct(e, p.id)}
                      title="删除产品"
                      className="w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0"
                      style={{ color: 'var(--danger)', border: 'none', background: 'rgba(239,68,68,0.1)', cursor: 'pointer' }}>
                      <Trash2 size={11} />
                    </button>
                  ) : (
                    <span className="text-xs px-1.5 rounded-full flex-shrink-0"
                      style={{ background: 'var(--border-bright)', color: 'var(--text-muted)' }}>
                      {p.record_count || 0}
                    </span>
                  )}
                </NavLink>
              </div>
            );
          })}

          {products.length === 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>暂无产品，点击 + 创建</p>
            </div>
          )}
        </nav>

        {/* 底部用户 */}
        <div className="border-t p-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ background: 'var(--accent)', color: 'white' }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-dim)' }}>{user?.username}</span>

            {/* 主题切换 */}
            <button onClick={toggleTheme} title={theme === 'dark' ? '切换白天模式' : '切换夜间模式'}
              className="w-6 h-6 rounded flex items-center justify-center transition-all"
              style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            {/* 退出登录 */}
            <button onClick={handleLogout} title="退出登录"
              className="w-6 h-6 rounded flex items-center justify-center transition-all"
              style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 overflow-auto">
        <Outlet context={{ products, onProductsChange: fetchProducts }} />
      </main>

      {showModal && (
        <ProductModal onClose={() => setShowModal(false)} onSave={() => { fetchProducts(); setShowModal(false); }} />
      )}
    </div>
  );
}

function Grid({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
