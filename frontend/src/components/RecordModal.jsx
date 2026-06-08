import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';

export default function RecordModal({ productId, columns, record, onClose, onSave }) {
  const [title, setTitle] = useState(record?.title || '');
  const [values, setValues] = useState({});
  const [showFields, setShowFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (record) {
      // 编辑时：先拉取完整记录（含解密）
      api.get(`/records/${record.id}`).then(({ data }) => {
        if (data.success) {
          const vals = {};
          data.data.values?.forEach(v => { vals[v.field_key] = v.field_value; });
          setValues(vals);
        }
      });
    } else {
      const defaults = {};
      // datetime 字段默认填入当前本地时间
      const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16); // 格式：2026-05-20T14:30
      columns.forEach(c => {
        defaults[c.field_key] = c.field_type === 'datetime' ? nowLocal : '';
      });
      setValues(defaults);
    }
  }, [record, columns]);

  const handleSave = async () => {
    // 标题非必填，为空时自动用第一个字段值或时间戳代替
    setLoading(true);
    try {
      const finalTitle = title.trim() || Object.values(values).find(v => v && v.trim()) || new Date().toLocaleString('zh-CN');
      if (record) {
        await api.put(`/records/${record.id}`, { title: finalTitle, values });
      } else {
        await api.post(`/records/product/${productId}`, { title: finalTitle, values });
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || '保存失败');
    } finally { setLoading(false); }
  };

  const toggleShow = (key) => setShowFields(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
>
      <div className="vault-card w-full max-w-lg animate-fade-in flex flex-col"
        style={{ maxHeight: '85vh' }}>
        {/* 头 */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>
            {record ? '编辑记录' : '添加记录'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* 内容 */}
        <div className="overflow-y-auto flex-1 p-5" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 标题 */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>
              标题 <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 400 }}>（选填，留空自动生成）</span>
            </label>
            <input className="vault-input" placeholder="给这条记录起个名字，如：生产服务器-上海"
              value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {/* 自定义字段 */}
          {columns.map(col => {
            const val = values[col.field_key] || '';
            const isShown = showFields[col.field_key];

            return (
              <div key={col.id}>
                <div className="flex items-center gap-1 mb-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>
                    {col.field_label}
                  </label>
                  {!!+col.is_required && <span style={{ color: 'var(--danger)', fontSize: 12 }}>*</span>}
                  {!!+col.is_sensitive && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full ml-1"
                      style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', fontSize: 10 }}>
                      加密
                    </span>
                  )}
                </div>

                {col.field_type === 'textarea' ? (
                  <textarea className="vault-input resize-none" rows={3} placeholder={`输入${col.field_label}`}
                    value={val}
                    onChange={e => setValues(p => ({ ...p, [col.field_key]: e.target.value }))} />
                ) : col.field_type === 'select' ? (
                  <select className="vault-input" value={val}
                    onChange={e => setValues(p => ({ ...p, [col.field_key]: e.target.value }))}
                    style={{ cursor: 'pointer' }}>
                    <option value="">— 请选择 —</option>
                    {JSON.parse(col.field_options || '[]').map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : col.field_type === 'datetime' ? (
                  <input className="vault-input"
                    type="datetime-local"
                    value={val ? val.replace(' ', 'T').slice(0, 16) : ''}
                    onChange={e => setValues(p => ({ ...p, [col.field_key]: e.target.value }))}
                    style={{ colorScheme: 'dark' }} />
                ) : col.field_type === 'password' ? (
                  <div className="relative">
                    <input className="vault-input"
                      type={isShown ? 'text' : 'password'}
                      placeholder={`输入${col.field_label}`}
                      style={{ paddingRight: '2.5rem', fontFamily: isShown ? 'inherit' : '"JetBrains Mono", monospace' }}
                      value={val}
                      onChange={e => setValues(p => ({ ...p, [col.field_key]: e.target.value }))} />
                    <button type="button" onClick={() => toggleShow(col.field_key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {isShown ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                ) : (
                  <input className="vault-input"
                    type={col.field_type === 'email' ? 'email' : col.field_type === 'url' ? 'url' : col.field_type === 'number' ? 'number' : 'text'}
                    placeholder={`输入${col.field_label}`}
                    value={val}
                    onChange={e => setValues(p => ({ ...p, [col.field_key]: e.target.value }))} />
                )}
              </div>
            );
          })}

          {error && (
            <div className="text-xs rounded-lg px-3 py-2"
              style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-2 p-5 border-t flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button className="btn-ghost flex-1" onClick={onClose}>取消</button>
          <button className="btn-primary flex-1" onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
