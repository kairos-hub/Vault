import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Lock, Type, AlignLeft, List, Hash, Link, Mail } from 'lucide-react';
import api from '../utils/api';

const FIELD_TYPES = [
  { value: 'text',     label: '单行文本', Icon: Type },
  { value: 'password', label: '密码',     Icon: Lock },
  { value: 'textarea', label: '多行文本', Icon: AlignLeft },
  { value: 'select',   label: '下拉选择', Icon: List },
  { value: 'number',   label: '数字',     Icon: Hash },
  { value: 'url',      label: '链接',     Icon: Link },
  { value: 'email',    label: '邮箱',     Icon: Mail },
];

const PRESETS = {
  server: [
    { field_key: 'ip',       field_label: '服务器IP', field_type: 'text',     is_required: true,  is_sensitive: false },
    { field_key: 'port',     field_label: 'SSH端口',  field_type: 'number',   is_required: false, is_sensitive: false },
    { field_key: 'username', field_label: '账号',     field_type: 'text',     is_required: true,  is_sensitive: false },
    { field_key: 'password', field_label: '密码',     field_type: 'password', is_required: true,  is_sensitive: true  },
    { field_key: 'region',   field_label: '地域',     field_type: 'text',     is_required: false, is_sensitive: false },
    { field_key: 'purpose',  field_label: '用途',     field_type: 'text',     is_required: false, is_sensitive: false },
    { field_key: 'notes',    field_label: '备注',     field_type: 'textarea', is_required: false, is_sensitive: false },
  ],
  website: [
    { field_key: 'url',      field_label: '网站地址',  field_type: 'url',      is_required: true,  is_sensitive: false },
    { field_key: 'username', field_label: '账号/邮箱', field_type: 'text',     is_required: true,  is_sensitive: false },
    { field_key: 'password', field_label: '密码',      field_type: 'password', is_required: true,  is_sensitive: true  },
    { field_key: 'notes',    field_label: '备注',      field_type: 'textarea', is_required: false, is_sensitive: false },
  ],
  database: [
    { field_key: 'host',          field_label: '主机',       field_type: 'text',     is_required: true,  is_sensitive: false },
    { field_key: 'port',          field_label: '端口',       field_type: 'number',   is_required: true,  is_sensitive: false },
    { field_key: 'username',      field_label: '用户名',     field_type: 'text',     is_required: true,  is_sensitive: false },
    { field_key: 'password',      field_label: '密码',       field_type: 'password', is_required: true,  is_sensitive: true  },
    { field_key: 'database_name', field_label: '数据库名',   field_type: 'text',     is_required: false, is_sensitive: false },
    { field_key: 'notes',         field_label: '备注',       field_type: 'textarea', is_required: false, is_sensitive: false },
  ],
};

let uid = 0;
const makeCol = () => ({
  _id: ++uid,
  field_key: '',
  field_label: '',
  field_type: 'text',
  field_options: [],
  is_required: false,
  is_sensitive: false,
});

export default function ColumnsEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [columns, setColumns] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/products/${id}/columns`).then(({ data }) => {
      if (data.success) {
        setColumns(data.data.map(c => ({
          ...c,
          _id: ++uid,
          field_options: JSON.parse(c.field_options || '[]').filter(o => o !== ''),
        })));
      }
    });
  }, [id]);

  const addCol = () => setColumns(cols => [...cols, makeCol()]);
  const removeCol = (idx) => {
    if (!confirm('删除此列会同时删除所有记录中该列的数据，确认？')) return;
    setColumns(cols => cols.filter((_, i) => i !== idx));
  };
  const updateCol = (idx, field, val) =>
    setColumns(cols => cols.map((c, i) => i === idx ? { ...c, [field]: val } : c));

  const applyPreset = (preset) => {
    if (!confirm('应用预设将替换当前所有列，确认？')) return;
    setColumns(PRESETS[preset].map(p => ({ ...makeCol(), ...p })));
  };

  const handleSave = async () => {
    setError('');
    for (const col of columns) {
      if (!col.field_key.trim()) return setError('所有列都必须填写字段标识符');
      if (!col.field_label.trim()) return setError('所有列都必须填写显示名称');
      if (!/^[a-z_][a-z0-9_]*$/.test(col.field_key))
        return setError(`字段标识符 "${col.field_key}" 只能含小写字母、数字和下划线`);
    }
    setSaving(true);
    try {
      await api.put(`/products/${id}/columns`, { columns });
      setSaved(true);
      setTimeout(() => navigate(`/product/${id}`), 800);
    } catch (err) {
      setError(err.response?.data?.message || '保存失败');
    } finally { setSaving(false); }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/product/${id}`)} className="btn-ghost flex items-center gap-1.5 text-sm">
          <ArrowLeft size={14} /> 返回
        </button>
        <div className="flex-1">
          <h1 className="font-semibold" style={{ color: 'var(--text)' }}>自定义列</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            改名/改类型不影响原数据；删除列会同步删除该列所有数据
          </p>
        </div>
        <button className="btn-primary flex items-center gap-1.5" onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? '保存中...' : saved ? '✓ 已保存' : '保存'}
        </button>
      </div>

      {/* 快速预设 */}
      <div className="vault-card p-4 mb-5">
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-dim)' }}>快速预设</p>
        <div className="flex gap-2">
          {Object.keys(PRESETS).map(k => (
            <button key={k} className="btn-ghost text-xs" onClick={() => applyPreset(k)}>
              {{ server: '服务器', website: '网站账号', database: '数据库' }[k]}
            </button>
          ))}
        </div>
      </div>

      {/* ── 自定义列 ── */}
      <div className="mt-5">
        <p className="text-xs font-medium mb-2 px-1" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          自定义列 ({columns.length})
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {columns.map((col, idx) => (
            <div key={col._id || col.id} className="vault-card p-4">
              <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr 160px auto' }}>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>显示名称</label>
                  <input className="vault-input" placeholder="如：服务器IP"
                    value={col.field_label}
                    onChange={e => updateCol(idx, 'field_label', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>字段标识符</label>
                  <input className="vault-input" placeholder="如：server_ip"
                    style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem' }}
                    value={col.field_key}
                    onChange={e => updateCol(idx, 'field_key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>字段类型</label>
                  <select className="vault-input" value={col.field_type}
                    onChange={e => updateCol(idx, 'field_type', e.target.value)}
                    style={{ cursor: 'pointer' }}>
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button className="btn-danger" onClick={() => removeCol(idx)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={col.is_required}
                    onChange={e => updateCol(idx, 'is_required', e.target.checked)}
                    style={{ accentColor: 'var(--accent)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>必填</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={col.is_sensitive}
                    onChange={e => updateCol(idx, 'is_sensitive', e.target.checked)}
                    style={{ accentColor: 'var(--warning)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>加密存储（敏感字段）</span>
                </label>
                {col.field_type === 'select' && (
                  <div className="flex-1">
                    <input className="vault-input text-xs" placeholder="选项，英文逗号分隔，如：选项A,选项B"
                      value={Array.isArray(col.field_options) ? col.field_options.join(',') : ''}
                      onChange={e => updateCol(idx, 'field_options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 添加列 */}
      <button className="w-full mt-4 py-3 rounded-xl border-dashed text-sm flex items-center justify-center gap-2 transition-all"
        style={{ border: '2px dashed var(--border-bright)', color: 'var(--text-muted)', background: 'none', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = '#818cf8'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        onClick={addCol}>
        <Plus size={15} /> 添加列
      </button>

      {error && (
        <div className="mt-4 text-xs rounded-lg px-4 py-3"
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}
    </div>
  );
}
