import { useState } from 'react';
import { X, Server, Database, Globe, Key, Folder } from 'lucide-react';
import api from '../utils/api';

const ICONS = [
  { value: 'server', label: '服务器', Icon: Server },
  { value: 'database', label: '数据库', Icon: Database },
  { value: 'globe', label: '网站', Icon: Globe },
  { value: 'key', label: 'API', Icon: Key },
  { value: 'folder', label: '其他', Icon: Folder },
];
const COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

export default function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    icon: product?.icon || 'folder',
    color: product?.color || '#6366f1',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.name.trim()) return setError('产品名称不能为空');
    setLoading(true);
    try {
      if (product) {
        await api.put(`/products/${product.id}`, form);
      } else {
        await api.post('/products', form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vault-card w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
            {product ? '编辑产品' : '新建产品'}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/10 transition-all"
            style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>产品名称 *</label>
            <input className="vault-input" placeholder="如：服务器管理、数据库账号..."
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>描述</label>
            <input className="vault-input" placeholder="简短描述这个产品的用途"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-dim)' }}>图标</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(({ value, label, Icon }) => (
                <button key={value} onClick={() => setForm(f => ({ ...f, icon: value }))}
                  title={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: form.icon === value ? form.color + '25' : 'var(--bg)',
                    border: `1px solid ${form.icon === value ? form.color : 'var(--border-bright)'}`,
                    color: form.icon === value ? form.color : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}>
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-dim)' }}>颜色</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{
                    background: c, border: 'none', cursor: 'pointer',
                    outline: form.color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2,
                    transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                  }} />
              ))}
            </div>
          </div>

          {error && (
            <div className="text-xs rounded-lg px-3 py-2"
              style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <div className="flex gap-2 mt-1">
            <button className="btn-ghost flex-1" onClick={onClose}>取消</button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
