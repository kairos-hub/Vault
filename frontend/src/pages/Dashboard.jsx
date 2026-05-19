import { useOutletContext, useNavigate } from 'react-router-dom';
import { Server, Database, Globe, Key, Folder, Plus, ArrowRight, Shield } from 'lucide-react';
import { useState } from 'react';
import ProductModal from '../components/ProductModal';

const ICONS = { server: Server, database: Database, globe: Globe, key: Key, folder: Folder };

export default function Dashboard() {
  const { products, onProductsChange } = useOutletContext();
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>总览</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            共 {products.length} 个产品，{products.reduce((a, b) => a + (b.record_count || 0), 0)} 条记录
          </p>
        </div>
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setShowModal(true)}>
          <Plus size={15} /> 新建产品
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: '产品总数', value: products.length, color: '#6366f1' },
          { label: '记录总数', value: products.reduce((a, b) => a + (b.record_count || 0), 0), color: '#10b981' },
          { label: '加密保护', value: '100%', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="vault-card px-5 py-4">
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-2xl font-semibold font-mono" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 产品列表 */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {products.map(p => {
            const Icon = ICONS[p.icon] || Folder;
            return (
              <div key={p.id} className="vault-card p-5 cursor-pointer group"
                onClick={() => navigate(`/product/${p.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: p.color + '20', border: `1px solid ${p.color}30` }}>
                    <Icon size={18} style={{ color: p.color }} />
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-mono"
                    style={{ background: 'var(--border)', color: 'var(--text-dim)' }}>
                    {p.record_count || 0} 条
                  </span>
                </div>
                <h3 className="font-medium text-sm mb-1" style={{ color: 'var(--text)' }}>{p.name}</h3>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{p.description || '暂无描述'}</p>
                <div className="flex items-center gap-1 mt-3 text-xs transition-all opacity-0 group-hover:opacity-100"
                  style={{ color: p.color }}>
                  查看详情 <ArrowRight size={12} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="vault-card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--bg-hover)' }}>
            <Shield size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>还没有产品</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>创建你的第一个产品来开始管理账号密码</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} className="inline mr-1" /> 新建产品
          </button>
        </div>
      )}

      {showModal && (
        <ProductModal onClose={() => setShowModal(false)}
          onSave={() => { onProductsChange(); setShowModal(false); }} />
      )}
    </div>
  );
}
