import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Plus, Search, Settings, Trash2, Edit, Eye, EyeOff, Copy, Check,
  Server, Database, Globe, Key, Folder, RefreshCw,
  Download, Upload, X, AlertCircle, CheckCircle2
} from 'lucide-react';
import api from '../utils/api';
import RecordModal from '../components/RecordModal';
import ProductModal from '../components/ProductModal';

const ICONS = { server: Server, database: Database, globe: Globe, key: Key, folder: Folder };

// 虚拟标题列（不存数据库，前端统一管理）
const TITLE_COL = { id: '__title__', field_key: '__title__', field_label: '标题', field_type: 'text', is_sensitive: 0, is_required: 0, _isTitle: true };
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ── Tooltip 组件（悬停展示完整内容）─────────────────────
function Tooltip({ content, children }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef();

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: rect.left, y: rect.bottom + 6 });
    setVisible(true);
  };

  if (!content || content === '—' || content === '••••••••') return children;

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', maxWidth: '100%' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <span style={{
          position: 'fixed',
          left: Math.min(pos.x, window.innerWidth - 320),
          top: pos.y,
          zIndex: 9999,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-bright)',
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: '0.8rem',
          color: 'var(--text)',
          maxWidth: 300,
          wordBreak: 'break-all',
          whiteSpace: 'pre-wrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          pointerEvents: 'none',
          lineHeight: 1.5,
        }}>
          {content}
        </span>
      )}
    </span>
  );
}

// ── 导出下拉菜单 ──────────────────────────────────────────
function ExportDropdown({ exporting, selectedCount, onExportAll, onExportSelected }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center',
        border: '1px solid var(--border-bright)', borderRadius: 8,
        overflow: 'hidden',
      }}>
        <button
          onClick={() => setOpen(v => !v)}
          disabled={exporting}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.6rem 0.85rem', background: 'transparent',
            border: 'none', borderRight: '1px solid var(--border-bright)',
            color: 'var(--text-dim)', fontSize: '0.875rem',
            cursor: exporting ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { if (!exporting) e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Download size={13} />
          {exporting ? '导出中...' : selectedCount > 0 ? `导出 (${selectedCount})` : '导出'}
        </button>
        <button
          onClick={() => setOpen(v => !v)}
          disabled={exporting}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0.6rem 7px', background: 'transparent',
            border: 'none', color: 'var(--text-dim)',
            cursor: exporting ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => { if (!exporting) e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 100,
          background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
          borderRadius: 10, minWidth: 180, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        }}>
          <button
            onClick={() => { onExportAll(); setOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: '0.875rem', textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Download size={13} style={{ color: 'var(--text-muted)' }} />
            导出全部记录
          </button>
          <div style={{ height: 1, background: 'var(--border)', margin: '0 10px' }} />
          <button
            onClick={() => { onExportSelected(); setOpen(false); }}
            disabled={selectedCount === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: selectedCount === 0 ? 'not-allowed' : 'pointer', color: selectedCount === 0 ? 'var(--text-muted)' : 'var(--text)', fontSize: '0.875rem', textAlign: 'left', opacity: selectedCount === 0 ? 0.45 : 1 }}
            onMouseEnter={e => { if (selectedCount > 0) e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)', flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
            {selectedCount > 0 ? `导出选中 ${selectedCount} 条` : '导出选中（未选择）'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── CSV 解析 ───────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const parseRow = (line) => {
    const cols = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
      else cur += ch;
    }
    cols.push(cur);
    return cols;
  };
  const headers = parseRow(lines[0]);
  return lines.slice(1).map(line => {
    const vals = parseRow(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
}

// ── 导入弹窗 ───────────────────────────────────────────────
function ImportModal({ productId, columns, onClose, onDone }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) return setError('请上传 CSV 文件');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target.result);
        if (rows.length === 0) return setError('CSV 文件为空或格式不正确');
        setPreview(rows); setError('');
      } catch { setError('解析失败，请检查 CSV 格式'); }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleImport = async () => {
    if (!preview?.length) return;
    setStatus('importing');
    try {
      const { data } = await api.post(`/records/product/${productId}/import`, { rows: preview });
      setResult(data); setStatus('done');
    } catch (err) { setError(err.response?.data?.message || '导入失败'); setStatus('idle'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="vault-card w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>导入 CSV</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div className="p-5" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {status === 'done' ? (
            <div className="text-center py-6">
              <CheckCircle2 size={40} style={{ color: 'var(--success)', margin: '0 auto 12px' }} />
              <p className="font-medium" style={{ color: 'var(--text)' }}>导入完成</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>成功导入 {result?.imported} 条记录</p>
              <button className="btn-primary mt-4" onClick={() => { onDone(); onClose(); }}>完成</button>
            </div>
          ) : (
            <>
              <div className="rounded-lg p-3 text-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border-bright)', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                <p className="font-medium mb-1" style={{ color: 'var(--text-dim)' }}>CSV 格式要求</p>
                <p>第一行为列名，需包含：<span style={{ color: 'var(--accent)' }}>标题</span>（选填）</p>
                <p>其他列名：{columns.map(c => c.field_label).join('、')}</p>
                <div className="flex items-center gap-1.5 mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--success)', flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>导入为新增数据，不会覆盖或修改已有记录</span>
                </div>
              </div>
              <div className="rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all"
                style={{ borderColor: 'var(--border-bright)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
                onClick={() => fileRef.current?.click()}>
                <Upload size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {preview ? `已选择 ${preview.length} 行数据` : '点击选择 CSV 文件'}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>支持 UTF-8 编码的 CSV</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
              </div>
              {preview?.length > 0 && (
                <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <div className="px-3 py-2 text-sm font-medium" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>预览（前3行）</div>
                  <div className="overflow-x-auto">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {Object.keys(preview[0]).map(k => <th key={k} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{k}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.slice(0, 3).map((row, i) => (
                          <tr key={i} style={{ borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                            {Object.values(row).map((v, j) => <td key={j} style={{ padding: '6px 10px', color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v || '—'}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-2"
                  style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle size={13} /> {error}
                </div>
              )}
              <div className="flex gap-2">
                <button className="btn-ghost flex-1" onClick={onClose}>取消</button>
                <button className="btn-primary flex-1" onClick={handleImport}
                  disabled={!preview || status === 'importing'}
                  style={{ opacity: (!preview || status === 'importing') ? 0.6 : 1 }}>
                  {status === 'importing' ? '导入中...' : `导入 ${preview?.length || 0} 条`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 主页面 ─────────────────────────────────────────────────
export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, onProductsChange } = useOutletContext();
  const product = products.find(p => String(p.id) === id);

  const [columns, setColumns] = useState([]);
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(() => parseInt(localStorage.getItem('vault_page_size')) || 20);
  const [loading, setLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [revealedFields, setRevealedFields] = useState({});
  const [copiedField, setCopiedField] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showColPanel, setShowColPanel] = useState(false);
  const [colOrder, setColOrder] = useState(null);
  const [hiddenCols, setHiddenCols] = useState(new Set());
  const dragColRef = useRef(null);

  // id 变化时用 useEffect 重置，保证时序正确、按产品隔离
  useEffect(() => {
    // colOrder 让 fetchColumns 去初始化，这里只重置为 null 触发重新合并
    setColOrder(null);

    const savedHidden = (() => {
      try {
        // 统一转字符串，避免数字/字符串类型不一致
        return new Set((JSON.parse(localStorage.getItem(`vault_hidden_${id}`) || '[]')).map(String));
      }
      catch { return new Set(); }
    })();
    setHiddenCols(savedHidden);
  }, [id]);

  const fetchColumns = useCallback(async () => {
    try {
      const { data } = await api.get(`/products/${id}/columns`);
      if (data.success) {
        setColumns(data.data);
        // 初始化列顺序（只用一次，后续由用户拖拽决定）
        // 每次都合并：保留用户排序，补上新列，移除已删除列
        setColOrder(prev => {
          // allIds 始终包含 __title__
          const allIds = ['__title__', ...data.data.map(c => c.id)];
          const validIds = new Set(allIds);
          // base 优先用当前 prev，其次读 localStorage，都没有则用默认顺序
          const stored = (() => { try { const s = localStorage.getItem(`vault_col_order_${id}`); return s ? JSON.parse(s) : null; } catch { return null; } })();
          const base = (prev !== null ? prev : stored);
          if (!base) return allIds; // 全新产品，用默认顺序（含 __title__）
          // 过滤掉已删除列，补上新增列（含可能缺失的 __title__）
          const newIds = allIds.filter(cid => !base.includes(cid));
          return [...base.filter(cid => validIds.has(cid)), ...newIds];
        });
      }
    } catch {}
  }, [id]);

  const fetchRecords = useCallback(async (page = 1) => {
    setSelectedIds(new Set());
    setLoading(true);
    try {
      const { data } = await api.get(`/records/product/${id}`, { params: { page, search, limit: pageSize } });
      if (data.success) { setRecords(data.data); setPagination(data.pagination); }
    } catch {} finally { setLoading(false); }
  }, [id, search, pageSize]);

  useEffect(() => { fetchColumns(); }, [fetchColumns]);
  useEffect(() => { const t = setTimeout(() => fetchRecords(), 300); return () => clearTimeout(t); }, [fetchRecords]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    localStorage.setItem('vault_page_size', size);
  };

  const handleReveal = async (recordId, fieldKey) => {
    const key = `${recordId}_${fieldKey}`;
    if (revealedFields[key]) {
      setRevealedFields(prev => { const n = { ...prev }; delete n[key]; return n; });
      return;
    }
    try {
      const { data } = await api.post(`/records/${recordId}/decrypt`, { field_key: fieldKey });
      if (data.success) setRevealedFields(prev => ({ ...prev, [key]: data.value }));
    } catch {}
  };

  const handleCopy = async (text, fieldId) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // 兼容 HTTP 环境
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 1500);
    } catch (e) {
      alert('复制失败，请手动复制');
    }
  };

  const handleDelete = async (recordId) => {
    if (!confirm('确认删除这条记录？此操作不可恢复。')) return;
    await api.delete(`/records/${recordId}`);
    fetchRecords();
    onProductsChange();
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确认删除选中的 ${selectedIds.size} 条记录？此操作不可恢复。`)) return;
    try {
      await Promise.all([...selectedIds].map(rid => api.delete(`/records/${rid}`)));
      setSelectedIds(new Set());
      fetchRecords();
      onProductsChange();
    } catch { alert('部分记录删除失败，请刷新后重试'); fetchRecords(); onProductsChange(); }
  };

  const handleExport = async (onlySelected = false) => {
    setExporting(true);
    try {
      const params = {};
      if (onlySelected && selectedIds.size > 0) {
        params.ids = [...selectedIds].join(',');
      }
      // 把当前列顺序传给后端（过滤掉虚拟标题列 __title__）
      const currentOrder = colOrder || columns.map(c => c.id);
      const colIds = currentOrder.filter(cid => cid !== '__title__').join(',');
      if (colIds) params.col_order = colIds;
      const response = await api.get(`/records/product/${id}/export`, { params, responseType: 'blob' });
      const count = onlySelected && selectedIds.size > 0 ? selectedIds.size : (pagination.total || '');
      const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${product?.name || 'export'}_${onlySelected && selectedIds.size > 0 ? `选中${selectedIds.size}条_` : ''}${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert('导出失败，请重试'); }
    finally { setExporting(false); }
  };

  const Icon = ICONS[product?.icon] || Folder;

  // 所有可显示列（含虚拟标题列）
  const allCols = [TITLE_COL, ...columns.filter(c => c.field_type !== 'textarea')];

  // 按 colOrder 排序（colOrder 里包含 '__title__'）
  const allDisplayCols = colOrder
    ? colOrder
        .map(cid => allCols.find(c => c.id === cid))
        .filter(Boolean)
    : allCols;
  const displayCols = allDisplayCols.filter(c => !hiddenCols.has(String(c.id)));

  const saveColOrder = (newOrder) => {
    // 确保 __title__ 不会在拖拽中丢失
    const safe = newOrder.includes('__title__') ? newOrder : ['__title__', ...newOrder];
    setColOrder(safe);
    localStorage.setItem(`vault_col_order_${id}`, JSON.stringify(safe));
  };
  const toggleHideCol = (colId) => {
    const key = String(colId); // 统一用字符串
    setHiddenCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      setTimeout(() => {
        localStorage.setItem(`vault_hidden_${id}`, JSON.stringify([...next]));
      }, 0);
      return next;
    });
  };

  // 拖拽处理
  const handleDragStart = (e, colId) => {
    dragColRef.current = colId;
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = (e, targetColId) => {
    e.preventDefault();
    const dragId = dragColRef.current;
    if (!dragId || dragId === targetColId) return;
    const currentOrder = colOrder || ['__title__', ...columns.map(c => c.id)];
    const from = currentOrder.indexOf(dragId);
    const to = currentOrder.indexOf(targetColId);
    if (from === -1 || to === -1) return;
    const next = [...currentOrder];
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    saveColOrder(next);
    dragColRef.current = null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* 页头 */}
      <div className="border-b px-8 py-5 flex items-center justify-between flex-shrink-0"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <div className="flex items-center gap-3">
          {product && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: product.color + '20' }}>
              <Icon size={16} style={{ color: product.color }} />
            </div>
          )}
          <div>
            <h1 className="font-semibold" style={{ color: 'var(--text)' }}>{product?.name || '...'}</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{pagination.total || 0} 条记录</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost flex items-center gap-1.5 text-sm" onClick={() => navigate(`/product/${id}/columns`)}>
            <Settings size={13} /> 自定义列
          </button>
          <button className="btn-ghost flex items-center gap-1.5 text-sm"
            onClick={() => setShowColPanel(v => !v)}
            style={{ position: 'relative', color: showColPanel ? 'var(--accent)' : undefined,
              borderColor: showColPanel ? 'var(--accent)' : undefined }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="18" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>
            列设置
            {hiddenCols.size > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: 'var(--accent)', color: 'white', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                {hiddenCols.size}
              </span>
            )}
          </button>
          {product && (
            <button className="btn-ghost flex items-center gap-1.5 text-sm" onClick={() => setShowProductModal(true)}>
              <Edit size={13} /> 编辑
            </button>
          )}
          <ExportDropdown
            exporting={exporting}
            selectedCount={selectedIds.size}
            onExportAll={() => handleExport(false)}
            onExportSelected={() => handleExport(true)}
          />
          <button className="btn-ghost flex items-center gap-1.5 text-sm" onClick={() => setShowImportModal(true)}>
            <Upload size={13} /> 导入
          </button>
          <button className="btn-primary flex items-center gap-1.5 text-sm"
            onClick={() => { setEditRecord(null); setShowRecordModal(true); }}>
            <Plus size={14} /> 添加记录
          </button>
        </div>
      </div>

      {/* 列设置面板 */}
      {showColPanel && (
        <div className="border-b px-8 py-4 flex-shrink-0 animate-fade-in" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>列设置</p>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>拖拽调整顺序，点击眼睛隐藏/显示列</span>
              <button onClick={() => { saveColOrder(['__title__', ...columns.map(c => c.id)]); setHiddenCols(new Set()); localStorage.removeItem(`vault_hidden_${id}`); }}
                className="text-xs px-2 py-1 rounded-lg transition-all"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border-bright)', background: 'none', cursor: 'pointer' }}>
                重置
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {allDisplayCols.map(col => {
              const isHidden = hiddenCols.has(String(col.id));
              return (
                <div key={col.id}
                  draggable
                  onDragStart={e => handleDragStart(e, col.id)}
                  onDragOver={e => handleDragOver(e, col.id)}
                  onDrop={e => handleDrop(e, col.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px', borderRadius: 8, cursor: 'grab',
                    background: isHidden ? 'var(--bg-card)' : 'var(--bg-card)',
                    border: `1px solid ${isHidden ? 'var(--border)' : 'var(--border-bright)'}`,
                    opacity: isHidden ? 0.45 : 1,
                    transition: 'all 0.15s',
                    userSelect: 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = isHidden ? 'var(--border)' : 'var(--border-bright)'}>
                  <svg width="10" height="14" viewBox="0 0 10 14" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                    <circle cx="3" cy="2.5" r="1.2" fill="currentColor"/><circle cx="7" cy="2.5" r="1.2" fill="currentColor"/>
                    <circle cx="3" cy="7" r="1.2" fill="currentColor"/><circle cx="7" cy="7" r="1.2" fill="currentColor"/>
                    <circle cx="3" cy="11.5" r="1.2" fill="currentColor"/><circle cx="7" cy="11.5" r="1.2" fill="currentColor"/>
                  </svg>
                  <span style={{ fontSize: '0.82rem', color: isHidden ? 'var(--text-muted)' : 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {col.field_label}
                  </span>
                  {col._isTitle && <span style={{ fontSize: 9, color: 'var(--text-muted)', border: '1px solid var(--border-bright)', borderRadius: 3, padding: '0 3px' }}>内置</span>}
                  {!!+col.is_sensitive && <span style={{ fontSize: 9, color: 'var(--warning)' }}>🔒</span>}
                  <button onClick={() => toggleHideCol(col.id)}
                    style={{ color: isHidden ? 'var(--text-muted)' : 'var(--text-dim)', border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                    {isHidden
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 搜索栏 */}
      <div className="px-8 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="vault-input pl-9" placeholder="搜索标题、IP、账号等所有字段..."
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}>
              <X size={13} />
            </button>
          )}
        </div>
        {search && (
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>找到 {pagination.total || 0} 条匹配记录</p>
        )}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 mt-2 px-3 py-2 rounded-lg animate-fade-in"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <span className="text-sm font-medium" style={{ color: '#818cf8' }}>已选 {selectedIds.size} 条</span>
            <button onClick={() => handleExport(true)} disabled={exporting}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer' }}>
              <Download size={11} /> 导出选中
            </button>
            <button onClick={handleBatchDelete}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer' }}>
              <Trash2 size={11} /> 删除选中
            </button>
            <button onClick={() => setSelectedIds(new Set())}
              className="text-xs px-2 py-1.5 rounded-lg transition-all"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border-bright)', background: 'none', cursor: 'pointer' }}>
              取消选择
            </button>
          </div>
        )}
      </div>

      {/* 表格 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : records.length === 0 ? (
          <div className="vault-card p-12 text-center">
            <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>暂无记录</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              {search ? `未找到包含"${search}"的记录` : '点击"添加记录"开始'}
            </p>
            {!search && (
              <button className="btn-primary" onClick={() => { setEditRecord(null); setShowRecordModal(true); }}>
                <Plus size={14} className="inline mr-1" /> 添加记录
              </button>
            )}
          </div>
        ) : (
          <div className="vault-card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ ...thStyle, width: 36, paddingRight: 4 }}>
                    <input type="checkbox"
                      checked={records.length > 0 && selectedIds.size === records.length}
                      ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < records.length; }}
                      onChange={toggleSelectAll}
                      style={{ accentColor: 'var(--accent)', cursor: 'pointer', width: 14, height: 14 }} />
                  </th>
                  {displayCols.map(col => (
                    <th key={col.id}
                      style={{ ...thStyle, cursor: 'grab', userSelect: 'none', width: col._isTitle ? 180 : undefined }}
                      draggable
                      onDragStart={e => handleDragStart(e, col.id)}
                      onDragOver={e => handleDragOver(e, col.id)}
                      onDrop={e => handleDrop(e, col.id)}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {col.field_label}
                        {!!+col.is_sensitive && <span style={{ color: 'var(--warning)', fontSize: 10 }}>🔒</span>}
                      </span>
                    </th>
                  ))}
                  <th style={{ ...thStyle, width: 90 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, ri) => (
                  <tr key={record.id}
                    style={{ borderBottom: ri < records.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>

                    {/* 选择列 */}
                    <td style={{ ...tdStyle, paddingRight: 4, width: 36 }}>
                      <input type="checkbox"
                        checked={selectedIds.has(record.id)}
                        onChange={() => toggleSelect(record.id)}
                        style={{ accentColor: 'var(--accent)', cursor: 'pointer', width: 14, height: 14 }} />
                    </td>
                    {/* 统一渲染所有列（含虚拟标题列） */}
                    {displayCols.map(col => {
                      // 虚拟标题列单独处理
                      if (col._isTitle) return (
                        <td key="__title__" style={tdStyle}>
                          <Tooltip content={record.title}>
                            <span className="font-medium" style={{ fontSize: '0.9rem', color: 'var(--text)', display: 'block', maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {record.title || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 400 }}>无标题</span>}
                            </span>
                          </Tooltip>
                        </td>
                      );
                      const valObj = record.values?.find(v => v.field_key === col.field_key);
                      const fkey = `${record.id}_${col.field_key}`;
                      const revealed = revealedFields[fkey];
                      const isSensitive = !!+col.is_sensitive;
                      const rawVal = isSensitive ? (revealed || null) : (valObj?.field_value || '');
                      const displayVal = isSensitive ? (revealed || '••••••••') : (rawVal || '—');

                      return (
                        <td key={col.id} style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {col.field_type === 'datetime' && valObj?.field_value ? (
                              <Tooltip content={valObj.field_value.replace('T', ' ')}>
                                <span style={{ fontSize: '0.88rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', fontFamily: '"JetBrains Mono", monospace' }}>
                                  {valObj.field_value.replace('T', ' ')}
                                </span>
                              </Tooltip>
                            ) : col.field_type === 'url' && valObj?.field_value ? (
                              <Tooltip content={valObj.field_value}>
                                <a href={valObj.field_value} target="_blank" rel="noreferrer"
                                  style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.88rem', display: 'block', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {valObj.field_value}
                                </a>
                              </Tooltip>
                            ) : (
                              <Tooltip content={isSensitive ? (revealed || null) : (valObj?.field_value || null)}>
                                <span style={{
                                  fontSize: '0.88rem',
                                  color: isSensitive ? (revealed ? 'var(--text)' : 'var(--text-muted)') : 'var(--text-dim)',
                                  fontFamily: isSensitive ? '"JetBrains Mono", monospace' : 'inherit',
                                  display: 'block',
                                  maxWidth: 160,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {displayVal}
                                </span>
                              </Tooltip>
                            )}

                            {isSensitive && (
                              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                                <button onClick={() => handleReveal(record.id, col.field_key)}
                                  style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }}>
                                  {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                                {revealed && (
                                  <button onClick={() => handleCopy(revealed, fkey)}
                                    style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: copiedField === fkey ? 'var(--success)' : 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }}>
                                    {copiedField === fkey ? <Check size={12} /> : <Copy size={12} />}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* 操作列 */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <button onClick={() => { setEditRecord(record); setShowRecordModal(true); }}
                          title="编辑"
                          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 6 }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => handleDelete(record.id)}
                          title="删除"
                          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 6 }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'var(--danger)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 - 固定在内容区右下角 */}
        {(pagination.pages >= 1 && pagination.total > 0) && (
          <div className="flex items-center justify-end gap-3 mt-4">
            {/* 条数信息 */}
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              共 {pagination.total} 条
            </span>

            {/* 页码 */}
            {pagination.pages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => fetchRecords(pagination.page - 1)} disabled={pagination.page <= 1}
                  className="w-8 h-8 rounded-lg text-sm transition-all"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-bright)', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', opacity: pagination.page <= 1 ? 0.35 : 1 }}>
                  ‹
                </button>
                {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                  let page;
                  if (pagination.pages <= 7) page = i + 1;
                  else if (pagination.page <= 4) page = i + 1;
                  else if (pagination.page >= pagination.pages - 3) page = pagination.pages - 6 + i;
                  else page = pagination.page - 3 + i;
                  return (
                    <button key={page} onClick={() => fetchRecords(page)}
                      className="w-8 h-8 rounded-lg text-sm transition-all"
                      style={{
                        background: pagination.page === page ? 'var(--accent)' : 'var(--bg-card)',
                        color: pagination.page === page ? 'white' : 'var(--text-muted)',
                        border: `1px solid ${pagination.page === page ? 'var(--accent)' : 'var(--border-bright)'}`,
                        cursor: 'pointer', fontWeight: pagination.page === page ? 600 : 400,
                      }}>
                      {page}
                    </button>
                  );
                })}
                <button onClick={() => fetchRecords(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                  className="w-8 h-8 rounded-lg text-sm transition-all"
                  style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-bright)', cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer', opacity: pagination.page >= pagination.pages ? 0.35 : 1 }}>
                  ›
                </button>
              </div>
            )}

            {/* 每页条数下拉 */}
            <select
              value={pageSize}
              onChange={e => handlePageSizeChange(Number(e.target.value))}
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-dim)',
                border: '1px solid var(--border-bright)',
                borderRadius: 8,
                padding: '4px 8px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none',
              }}>
              {PAGE_SIZE_OPTIONS.map(s => (
                <option key={s} value={s}>{s} 条/页</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {showRecordModal && (
        <RecordModal productId={id} columns={columns} record={editRecord}
          onClose={() => setShowRecordModal(false)}
          onSave={() => { fetchColumns(); fetchRecords(); onProductsChange(); setShowRecordModal(false); }} />
      )}
      {showProductModal && product && (
        <ProductModal product={product} onClose={() => setShowProductModal(false)}
          onSave={() => { onProductsChange(); setShowProductModal(false); }} />
      )}
      {showImportModal && (
        <ImportModal productId={id} columns={columns}
          onClose={() => setShowImportModal(false)}
          onDone={() => fetchRecords()} />
      )}
    </div>
  );
}

const thStyle = {
  padding: '11px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.05em',
  color: 'var(--text-muted)', background: 'var(--bg)', whiteSpace: 'nowrap',
};
const tdStyle = { padding: '11px 16px', verticalAlign: 'middle' };
