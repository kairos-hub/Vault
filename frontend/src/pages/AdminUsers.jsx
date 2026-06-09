import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, Trash2, KeyRound, RefreshCw, Crown, UserX, UserCheck,
  X, AlertTriangle, Plus, Shield, ShieldOff, ToggleLeft, ToggleRight,
  Wifi, WifiOff, Ban, CheckCircle2, Clock, ChevronDown, ChevronUp, Trash,
  Server, Database, Globe, Key, Folder
} from 'lucide-react';

const SITE_ICONS = [
  { value: 'shield',   label: '盾牌',  Icon: Shield },
  { value: 'server',   label: '服务器', Icon: Server },
  { value: 'database', label: '数据库', Icon: Database },
  { value: 'globe',    label: '网站',  Icon: Globe },
  { value: 'key',      label: 'Key',   Icon: Key },
  { value: 'folder',   label: '文件夹', Icon: Folder },
];
import { useOutletContext } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../utils/authStore';

// ── 通用弹窗壳 ────────────────────────────────────────────
function Modal({ title, onClose, children, maxW = 'max-w-sm' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`vault-card w-full ${maxW} animate-fade-in`}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{title}</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── 新建用户弹窗 ──────────────────────────────────────────
function CreateUserModal({ onClose, onDone }) {
  const [form, setForm] = useState({ username: '', password: '', email: '', is_admin: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.username || !form.password) return setError('用户名和密码不能为空');
    if (form.password.length < 6) return setError('密码不能少于6位');
    setLoading(true);
    try {
      await api.post('/admin/users', form);
      onDone(); onClose();
    } catch (err) { setError(err.response?.data?.message || '创建失败'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="新建用户" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>用户名 *</label>
          <input className="vault-input" placeholder="输入用户名"
            value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>密码 * （至少6位）</label>
          <input className="vault-input" type="password" placeholder="输入密码"
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>邮箱（可选）</label>
          <input className="vault-input" type="email" placeholder="输入邮箱"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-lg"
          style={{ background: 'var(--bg)', border: '1px solid var(--border-bright)' }}>
          <input type="checkbox" checked={form.is_admin} onChange={e => setForm(f => ({ ...f, is_admin: e.target.checked }))}
            style={{ accentColor: 'var(--accent)', width: 14, height: 14 }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>设为管理员</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>拥有用户管理和系统设置权限</p>
          </div>
        </label>
        {error && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
        <div className="flex gap-2 mt-1">
          <button className="btn-ghost flex-1" onClick={onClose}>取消</button>
          <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>{loading ? '创建中...' : '创建用户'}</button>
        </div>
      </div>
    </Modal>
  );
}

// ── 重置密码弹窗 ──────────────────────────────────────────
function ResetPasswordModal({ user, onClose, onDone }) {
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (pwd.length < 6) return setError('密码不能少于6位');
    setLoading(true);
    try {
      await api.patch(`/admin/users/${user.id}/reset-password`, { new_password: pwd });
      onDone(); onClose();
    } catch (err) { setError(err.response?.data?.message || '操作失败'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="重置密码" onClose={onClose}>
      <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
        为 <span style={{ color: 'var(--text)' }}>@{user.username}</span> 设置新密码
      </p>
      <input className="vault-input mb-3" type="password" placeholder="新密码（至少6位）"
        value={pwd} onChange={e => setPwd(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
      {error && <div className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
      <div className="flex gap-2">
        <button className="btn-ghost flex-1" onClick={onClose}>取消</button>
        <button className="btn-primary flex-1" onClick={handleSubmit} disabled={loading}>{loading ? '保存中...' : '确认重置'}</button>
      </div>
    </Modal>
  );
}

// ── 删除用户确认 ──────────────────────────────────────────
function DeleteUserModal({ user, onClose, onDone }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/admin/users/${user.id}`);
      onDone(); onClose();
    } catch (err) { alert(err.response?.data?.message || '删除失败'); }
    finally { setLoading(false); }
  };
  return (
    <Modal title="确认删除用户" onClose={onClose}>
      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <AlertTriangle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
        <p className="text-sm" style={{ color: 'var(--text)' }}>此操作不可恢复</p>
      </div>
      <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
        删除用户 <span style={{ color: 'var(--text)', fontWeight: 500 }}>@{user.username}</span> 将同时删除：
      </p>
      <ul className="text-sm mb-4" style={{ color: 'var(--danger)', lineHeight: 2 }}>
        <li>• {user.product_count} 个产品 / {user.record_count} 条记录</li>
        <li>• 所有加密数据</li>
      </ul>
      <div className="flex gap-2">
        <button className="btn-ghost flex-1" onClick={onClose}>取消</button>
        <button onClick={handleDelete} disabled={loading}
          className="flex-1 rounded-lg text-sm font-medium py-2 transition-all"
          style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}>
          {loading ? '删除中...' : '确认删除'}
        </button>
      </div>
    </Modal>
  );
}

// ── 限流策略配置面板 ─────────────────────────────────────
function RateLimitConfig({ settings, onSave }) {
  const [form, setForm] = useState({
    api_rate_limit_enabled: settings.api_rate_limit_enabled ?? '1',
    api_rate_limit_max: settings.api_rate_limit_max ?? '300',
    api_rate_limit_window_min: settings.api_rate_limit_window_min ?? '15',
    login_rate_limit_enabled: settings.login_rate_limit_enabled ?? '1',
    login_rate_limit_max: settings.login_rate_limit_max ?? '10',
    login_rate_limit_window_min: settings.login_rate_limit_window_min ?? '15',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(form)) {
        await api.put('/admin/settings', { key, value });
      }
      setSaved(true);
      onSave(form);
      setTimeout(() => setSaved(false), 2000);
    } catch { alert('保存失败'); }
    finally { setSaving(false); }
  };

  const Field = ({ label, hint, settingKey, min, max }) => (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dim)' }}>{label}</label>
      {hint && <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      <input type="number" min={min} max={max} className="vault-input"
        style={{ width: 120 }}
        value={form[settingKey]}
        onChange={e => setForm(f => ({ ...f, [settingKey]: e.target.value }))} />
    </div>
  );

  const Toggle = ({ label, desc, settingKey }) => {
    const enabled = form[settingKey] === '1';
    return (
      <div className="flex items-center justify-between p-4 rounded-xl"
        style={{ background: 'var(--bg)', border: `1px solid ${enabled ? 'rgba(99,102,241,0.3)' : 'var(--border-bright)'}` }}>
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
        </div>
        <button onClick={() => setForm(f => ({ ...f, [settingKey]: enabled ? '0' : '1' }))}
          style={{ border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}>
          {enabled
            ? <ToggleRight size={36} style={{ color: 'var(--success)' }} />
            : <ToggleLeft size={36} style={{ color: 'var(--text-muted)' }} />}
        </button>
      </div>
    );
  };

  return (
    <div className="vault-card p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold" style={{ color: 'var(--text)' }}>限流策略配置</h3>
        <button onClick={handleSave} disabled={saving}
          className="btn-primary text-sm flex items-center gap-1.5"
          style={{ opacity: saving ? 0.7 : 1, padding: '6px 16px' }}>
          {saving ? '保存中...' : saved ? '✓ 已保存' : '保存配置'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Toggle settingKey="login_rate_limit_enabled"
            label="登录失败限流"
            desc="仅对登录失败的 IP 计数，成功登录不计入" />
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-bright)', opacity: form.login_rate_limit_enabled === '1' ? 1 : 0.4 }}>
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>登录限流参数</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field settingKey="login_rate_limit_window_min" label="统计窗口（分钟）" hint="在此时间窗口内统计失败次数" min={1} max={1440} />
              <Field settingKey="login_rate_limit_max" label="最大失败次数" hint="超过此次数后该 IP 被锁定" min={1} max={100} />
            </div>
            <div className="mt-3 px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              策略：{form.login_rate_limit_window_min} 分钟内失败超过 {form.login_rate_limit_max} 次则锁定
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Toggle settingKey="api_rate_limit_enabled"
            label="API 请求限流"
            desc="限制普通用户的 API 请求频率，管理员不受限" />
          <div className="p-4 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-bright)', opacity: form.api_rate_limit_enabled === '1' ? 1 : 0.4 }}>
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>API 限流参数</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field settingKey="api_rate_limit_window_min" label="统计窗口（分钟）" hint="在此时间窗口内统计请求次数" min={1} max={1440} />
              <Field settingKey="api_rate_limit_max" label="最大请求次数" hint="窗口期内超过此次数触发限流" min={1} max={10000} />
            </div>
            <div className="mt-3 px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              策略：{form.api_rate_limit_window_min} 分钟内超过 {form.api_rate_limit_max} 次请求则限流
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 限流管理面板 ──────────────────────────────────────────
function RateLimitPanel() {
  const [blocked, setBlocked] = useState([]);
  const [logs, setLogs] = useState([]);
  const [config, setConfig] = useState({ windowMin: 15, maxFails: 10 });
  const [loading, setLoading] = useState(true);
  const [expandedIp, setExpandedIp] = useState(null);
  const [releasing, setReleasing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/rate-limits');
      if (data.success) {
        setBlocked(data.blocked || []);
        setLogs(data.logs || []);
        setConfig(data.config || { windowMin: 15, maxFails: 10 });
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRelease = async (ip) => {
    setReleasing(ip);
    try {
      await api.post('/admin/rate-limits/release', { ip });
      await fetchData();
    } catch (err) { alert(err.response?.data?.message || '操作失败'); }
    finally { setReleasing(null); }
  };

  const handleDeleteIp = async (ip) => {
    if (!confirm(`确认删除 ${ip} 的所有登录失败记录？`)) return;
    setDeleting(ip);
    try {
      await api.delete('/admin/rate-limits', { data: { ip } });
      await fetchData();
    } catch { alert('删除失败'); }
    finally { setDeleting(null); }
  };

  const handleDeleteOne = async (id) => {
    try {
      await api.delete('/admin/rate-limits', { data: { id } });
      await fetchData();
    } catch { alert('删除失败'); }
  };

  const handleCleanup = async () => {
    if (!confirm('确认清理所有已过期和已释放的记录？')) return;
    try {
      await api.delete('/admin/rate-limits', { data: {} });
      await fetchData();
    } catch {}
  };

  const ipLogs = (ip) => logs.filter(l => l.ip === ip);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>登录限流记录</h2>
          {blocked.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: blocked.some(b => b.hit_count >= config.maxFails) ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: blocked.some(b => b.hit_count >= config.maxFails) ? 'var(--danger)' : 'var(--warning)' }}>
              {blocked.filter(b => b.hit_count >= config.maxFails).length > 0
                ? `${blocked.filter(b => b.hit_count >= config.maxFails).length} 个 IP 限流中`
                : `${blocked.length} 个 IP 有失败记录`}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-xs flex items-center gap-1" onClick={handleCleanup}>
            <Trash size={12} /> 清理过期记录
          </button>
          <button className="btn-ghost text-xs flex items-center gap-1" onClick={fetchData}>
            <RefreshCw size={12} /> 刷新
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : blocked.length === 0 ? (
        <div className="vault-card p-8 text-center">
          <CheckCircle2 size={32} style={{ color: 'var(--success)', margin: '0 auto 8px' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            当前没有登录失败记录
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {blocked.map(b => {
            const expanded = expandedIp === b.ip;
            const detail = ipLogs(b.ip);
            const remainMs = Math.max(0, new Date(b.expires_at) - Date.now());
            const remainMin = Math.ceil(remainMs / 60000);

            return (
              <div key={b.ip} className="vault-card overflow-hidden">
                {/* IP 行 */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: b.hit_count >= config.maxFails ? 'var(--danger)' : 'var(--warning)', animation: b.hit_count >= config.maxFails ? 'pulse 2s infinite' : 'none' }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-semibold" style={{ color: 'var(--text)' }}>{b.ip}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{
                          background: b.hit_count >= config.maxFails ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                          color: b.hit_count >= config.maxFails ? 'var(--danger)' : 'var(--warning)'
                        }}>
                        失败 {b.hit_count} 次
                      </span>
                      {b.hit_count >= config.maxFails && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
                          限流中
                        </span>
                      )}
                      {b.usernames && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          尝试账号：{b.usernames}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        最后尝试：{new Date(b.last_hit).toLocaleString('zh-CN')}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--warning)' }}>
                        还需等待 {remainMin} 分钟
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* 解除限制 */}
                    <button onClick={() => handleRelease(b.ip)} disabled={releasing === b.ip}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-all"
                      style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.25)', cursor: 'pointer' }}>
                      {releasing === b.ip ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                      解除限制
                    </button>
                    {/* 删除该 IP 所有记录 */}
                    <button onClick={() => handleDeleteIp(b.ip)} disabled={deleting === b.ip}
                      className="w-7 h-7 rounded flex items-center justify-center transition-all"
                      style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}
                      title="删除该 IP 所有记录"
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}>
                      {deleting === b.ip ? <RefreshCw size={13} className="animate-spin" /> : <Trash size={13} />}
                    </button>
                    {/* 展开详情 */}
                    <button onClick={() => setExpandedIp(expanded ? null : b.ip)}
                      className="w-7 h-7 rounded flex items-center justify-center transition-all"
                      style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}>
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* 展开详细记录 */}
                {expanded && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="px-4 py-2 text-xs font-medium"
                      style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
                      详细登录记录（共 {detail.length} 条）
                    </div>
                    <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                            {['登录账号', '登录 IP', '登录时间', '状态', ''].map(h => (
                              <th key={h} style={{ padding: '6px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {detail.map((log, i) => {
                            const stillValid = !log.is_released && new Date(log.expires_at) > new Date();
                            // 只有该 IP 总失败次数达到阈值，且本条记录仍在有效期内，才算「限流中」
                            const isActive = stillValid && b.hit_count >= config.maxFails;
                            const isExpired = new Date(log.expires_at) <= new Date();
                            return (
                              <tr key={log.id}
                                style={{ borderBottom: i < detail.length - 1 ? '1px solid var(--border)' : 'none' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = ''}>
                                <td style={{ padding: '7px 12px', color: 'var(--text-dim)' }}>
                                  {log.username || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>未知</span>}
                                </td>
                                <td style={{ padding: '7px 12px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                                  {log.ip}
                                </td>
                                <td style={{ padding: '7px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                  {new Date(log.hit_at).toLocaleString('zh-CN')}
                                </td>
                                <td style={{ padding: '7px 12px', whiteSpace: 'nowrap' }}>
                                  <span style={{
                                    fontSize: '0.75rem', padding: '2px 8px', borderRadius: 99,
                                    background: log.is_released ? 'rgba(16,185,129,0.1)'
                                      : isExpired ? 'rgba(100,116,139,0.1)'
                                      : isActive ? 'rgba(239,68,68,0.1)'
                                      : 'rgba(245,158,11,0.1)',
                                    color: log.is_released ? 'var(--success)'
                                      : isExpired ? 'var(--text-muted)'
                                      : isActive ? 'var(--danger)'
                                      : 'var(--warning)',
                                  }}>
                                    {log.is_released ? '已解除' : isExpired ? '已过期' : isActive ? '限流中' : '记录中'}
                                  </span>
                                </td>
                                <td style={{ padding: '7px 12px', textAlign: 'right' }}>
                                  <button onClick={() => handleDeleteOne(log.id)}
                                    style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }}
                                    title="删除此条记录"
                                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}>
                                    <Trash size={12} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 品牌设置卡片 ──────────────────────────────────────────
function SiteBrandingCard({ settings, onSave, onSiteInfoChange }) {
  const [name, setName] = useState(settings.site_name || 'Vault');
  const [icon, setIcon] = useState(settings.site_icon || 'shield');
  const [iconUrl, setIconUrl] = useState(settings.site_icon_url || '');
  const [faviconUrl, setFaviconUrl] = useState(settings.favicon_url || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [faviconDragOver, setFaviconDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  useEffect(() => {
    setName(settings.site_name || 'Vault');
    setIcon(settings.site_icon || 'shield');
    setIconUrl(settings.site_icon_url || '');
    setFaviconUrl(settings.favicon_url || '');
  }, [settings.site_name, settings.site_icon, settings.site_icon_url, settings.favicon_url]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalName = name.trim() || 'Vault';
      await api.put('/admin/settings', { key: 'site_name', value: finalName });
      await api.put('/admin/settings', { key: 'site_icon', value: icon });
      await api.put('/admin/settings', { key: 'site_icon_url', value: iconUrl });
      await api.put('/admin/settings', { key: 'favicon_url', value: faviconUrl });
      onSave('site_name', finalName);
      onSave('site_icon', icon);
      onSave('site_icon_url', iconUrl);
      onSave('favicon_url', faviconUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSiteInfoChange?.();
    } catch { alert('保存失败'); }
    finally { setSaving(false); }
  };

  const uploadFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('请上传图片文件');
    if (file.size > 512 * 1024) return alert('图片不能超过 512 KB');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('icon', file);
      const { data } = await api.post('/admin/settings/upload-icon', fd);
      if (data.success) setIconUrl(data.url);
    } catch (err) {
      alert(err.response?.data?.message || '上传失败');
    } finally { setUploading(false); }
  };

  const handleClearCustom = async () => {
    try {
      await api.delete('/admin/settings/upload-icon');
      await api.put('/admin/settings', { key: 'site_icon_url', value: '' });
      setIconUrl('');
      onSave('site_icon_url', '');
      onSiteInfoChange?.();
    } catch { alert('清除失败'); }
  };

  const uploadFavicon = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.name.endsWith('.ico')) return alert('请上传图片文件');
    if (file.size > 512 * 1024) return alert('文件不能超过 512 KB');
    setFaviconUploading(true);
    try {
      const fd = new FormData();
      fd.append('favicon', file);
      const { data } = await api.post('/admin/settings/upload-favicon', fd);
      if (data.success) setFaviconUrl(data.url);
    } catch (err) {
      alert(err.response?.data?.message || '上传失败');
    } finally { setFaviconUploading(false); }
  };

  const handleClearFavicon = async () => {
    try {
      await api.delete('/admin/settings/upload-favicon');
      await api.put('/admin/settings', { key: 'favicon_url', value: '' });
      setFaviconUrl('');
      onSave('favicon_url', '');
      onSiteInfoChange?.();
    } catch { alert('清除失败'); }
  };

  const PreviewIcon = (SITE_ICONS.find(i => i.value === icon) || SITE_ICONS[0]).Icon;

  return (
    <div className="vault-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold" style={{ color: 'var(--text)' }}>品牌设置</h2>
        <button onClick={handleSave} disabled={saving}
          className="btn-primary text-sm"
          style={{ padding: '6px 16px', opacity: saving ? 0.7 : 1 }}>
          {saving ? '保存中...' : saved ? '✓ 已保存' : '保存'}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 预览 */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-bright)', width: 'fit-content' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={iconUrl ? {} : { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {iconUrl
              ? <img src={iconUrl} alt="logo" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 8 }} />
              : <PreviewIcon size={14} color="white" />}
          </div>
          <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--text)' }}>
            {name || 'Vault'}
          </span>
        </div>

        {/* 应用名称 */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>应用名称</label>
          <input className="vault-input" style={{ maxWidth: 240 }}
            placeholder="Vault" value={name}
            onChange={e => setName(e.target.value)} />
        </div>

        {/* 自定义上传图标 */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-dim)' }}>
            自定义图标
            <span className="ml-1 font-normal" style={{ color: 'var(--text-muted)' }}>PNG / JPG / WebP / SVG，≤ 512 KB</span>
          </label>
          {iconUrl ? (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-bright)' }}>
              <img src={iconUrl} alt="custom icon" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 6 }} />
              <span className="text-xs flex-1" style={{ color: 'var(--text-muted)' }}>已上传自定义图标</span>
              <button onClick={handleClearCustom}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
                清除
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-dim)', border: '1px solid var(--border-bright)', cursor: 'pointer' }}>
                {uploading ? '上传中...' : '重新上传'}
              </button>
            </div>
          ) : (
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); uploadFile(e.dataTransfer.files[0]); }}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all"
              style={{
                height: 80, cursor: uploading ? 'wait' : 'pointer',
                border: `2px dashed ${dragOver ? '#6366f1' : 'var(--border-bright)'}`,
                background: dragOver ? 'rgba(99,102,241,0.06)' : 'var(--bg)',
              }}>
              {uploading
                ? <span className="text-sm" style={{ color: 'var(--text-muted)' }}>上传中...</span>
                : <>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>点击或拖拽图片到这里</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>上传后将覆盖预设图标</span>
                  </>}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { uploadFile(e.target.files[0]); e.target.value = ''; }} />
        </div>

        {/* 预设图标（无自定义图标时生效） */}
        <div style={{ opacity: iconUrl ? 0.4 : 1, pointerEvents: iconUrl ? 'none' : 'auto' }}>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-dim)' }}>
            预设图标
            {iconUrl && <span className="ml-1 font-normal" style={{ color: 'var(--text-muted)' }}>（已被自定义图标覆盖）</span>}
          </label>
          <div className="flex gap-2 flex-wrap">
            {SITE_ICONS.map(({ value, label, Icon }) => (
              <button key={value} onClick={() => setIcon(value)} title={label}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: icon === value ? 'rgba(99,102,241,0.15)' : 'var(--bg)',
                  border: `1px solid ${icon === value ? '#6366f1' : 'var(--border-bright)'}`,
                  color: icon === value ? '#818cf8' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}>
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* 分割线 */}
        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* Favicon 上传 */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-dim)' }}>
            网站图标（浏览器标签页）
          </label>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            ICO / PNG / SVG，建议 32×32 或 64×64，≤ 512 KB
          </p>
          {faviconUrl ? (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-bright)' }}>
              <img src={faviconUrl} alt="favicon" style={{ width: 24, height: 24, objectFit: 'contain' }} />
              <span className="text-xs flex-1" style={{ color: 'var(--text-muted)' }}>已上传自定义标签页图标</span>
              <button onClick={handleClearFavicon}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
                清除
              </button>
              <button onClick={() => faviconInputRef.current?.click()} disabled={faviconUploading}
                className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-dim)', border: '1px solid var(--border-bright)', cursor: 'pointer' }}>
                {faviconUploading ? '上传中...' : '重新上传'}
              </button>
            </div>
          ) : (
            <div
              onClick={() => !faviconUploading && faviconInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setFaviconDragOver(true); }}
              onDragLeave={() => setFaviconDragOver(false)}
              onDrop={e => { e.preventDefault(); setFaviconDragOver(false); uploadFavicon(e.dataTransfer.files[0]); }}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all"
              style={{
                height: 72, cursor: faviconUploading ? 'wait' : 'pointer',
                border: `2px dashed ${faviconDragOver ? '#6366f1' : 'var(--border-bright)'}`,
                background: faviconDragOver ? 'rgba(99,102,241,0.06)' : 'var(--bg)',
              }}>
              {faviconUploading
                ? <span className="text-sm" style={{ color: 'var(--text-muted)' }}>上传中...</span>
                : <span className="text-sm" style={{ color: 'var(--text-muted)' }}>点击或拖拽图标文件到这里</span>}
            </div>
          )}
          <input ref={faviconInputRef} type="file" accept="image/*,.ico" style={{ display: 'none' }}
            onChange={e => { uploadFavicon(e.target.files[0]); e.target.value = ''; }} />
        </div>

      </div>
    </div>
  );
}

// ── 主页面 ────────────────────────────────────────────────
const TABS = [
  { key: 'users', label: '用户管理', icon: Users },
  { key: 'rate', label: '限流管理', icon: Ban },
  { key: 'settings', label: '系统设置', icon: Shield },
];

export default function AdminUsers() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [settings, setSettings] = useState({ allow_register: '1' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [togglingAdminId, setTogglingAdminId] = useState(null);
  const currentUser = useAuthStore(s => s.user);
  const { onSiteInfoChange } = useOutletContext() || {};

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const { data } = await api.get('/admin/users');
      if (data.success) setUsers(data.data);
    } catch (err) {
      if (err.response?.status === 403) alert('无管理员权限');
    } finally { setLoadingUsers(false); }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/settings');
      if (data.success) setSettings(data.data);
    } catch {}
  }, []);

  useEffect(() => { fetchUsers(); fetchSettings(); }, [fetchUsers, fetchSettings]);

  const handleToggleDisable = async (user) => {
    setTogglingId(user.id);
    try {
      await api.patch(`/admin/users/${user.id}/toggle-disable`);
      await fetchUsers();
    } catch (err) { alert(err.response?.data?.message || '操作失败'); }
    finally { setTogglingId(null); }
  };

  const handleToggleAdmin = async (user) => {
    const action = !!+user.is_admin ? '撤销' : '授予';
    if (!confirm(`确认${action} @${user.username} 的管理员权限？`)) return;
    setTogglingAdminId(user.id);
    try {
      await api.patch(`/admin/users/${user.id}/toggle-admin`);
      await fetchUsers();
    } catch (err) { alert(err.response?.data?.message || '操作失败'); }
    finally { setTogglingAdminId(null); }
  };

  const handleSaveSetting = async (key, value) => {
    setSavingSettings(true);
    try {
      await api.put('/admin/settings', { key, value });
      setSettings(s => ({ ...s, [key]: value }));
    } catch (err) { alert(err.response?.data?.message || '保存失败'); }
    finally { setSavingSettings(false); }
  };

  const isSelf = (u) => u.id === currentUser?.id;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>管理后台</h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>管理员</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>用户管理、限流监控与系统设置</p>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', width: 'fit-content' }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === key ? 'var(--bg-hover)' : 'none',
              color: tab === key ? 'var(--text)' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer',
              boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
            }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── 用户管理 Tab ── */}
      {tab === 'users' && (
        <>
          {/* 统计 */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: '总用户', value: users.length, color: '#6366f1' },
              { label: '管理员', value: users.filter(u => !!+u.is_admin).length, color: '#818cf8' },
              { label: '活跃', value: users.filter(u => !+u.is_disabled).length, color: '#10b981' },
              { label: '已禁用', value: users.filter(u => !!+u.is_disabled).length, color: '#ef4444' },
            ].map(s => (
              <div key={s.label} className="vault-card px-4 py-3">
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                <p className="text-xl font-semibold font-mono" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end mb-3">
            <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> 新建用户
            </button>
          </div>

          {/* 用户表格 */}
          <div className="vault-card overflow-hidden">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['用户', '邮箱', '数据量', '注册时间', '最近登录', '状态', '权限', '操作'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, ri) => (
                    <tr key={u.id}
                      style={{ borderBottom: ri < users.length - 1 ? '1px solid var(--border)' : 'none', opacity: u.is_disabled ? 0.55 : 1, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>

                      {/* 用户名 */}
                      <td style={tdStyle}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                            style={{ background: !!+u.is_admin ? 'rgba(99,102,241,0.2)' : 'var(--bg-hover)', color: !!+u.is_admin ? '#818cf8' : 'var(--text-muted)' }}>
                            {u.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{u.username}</span>
                              {!!+u.is_admin && <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}><Crown size={9} />管理员</span>}
                              {isSelf(u) && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>本账号</span>}
                            </div>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ID: {u.id}</p>
                          </div>
                        </div>
                      </td>

                      <td style={tdStyle}><span className="text-xs" style={{ color: 'var(--text-dim)' }}>{u.email || '—'}</span></td>

                      <td style={tdStyle}>
                        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                          {u.product_count}产品 / {u.record_count}记录
                        </span>
                      </td>

                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('zh-CN')}</span></td>

                      {/* 最近登录 */}
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {u.last_login_at
                            ? new Date(u.last_login_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                            : <span style={{ color: 'var(--border-bright)' }}>从未登录</span>}
                        </span>
                      </td>

                      {/* 状态 */}
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <span className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ background: !!+u.is_disabled ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: !!+u.is_disabled ? 'var(--danger)' : 'var(--success)' }}>
                          {!!+u.is_disabled ? '已禁用' : '正常'}
                        </span>
                      </td>

                      {/* 管理员权限切换 */}
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        {isSelf(u) ? (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                        ) : (
                          <button onClick={() => handleToggleAdmin(u)} disabled={togglingAdminId === u.id}
                            title={!!+u.is_admin ? '点击撤销管理员' : '点击授予管理员'}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '3px 8px', borderRadius: 99,
                              fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                              border: `1px solid ${!!+u.is_admin ? 'rgba(99,102,241,0.35)' : 'var(--border-bright)'}`,
                              background: !!+u.is_admin ? 'rgba(99,102,241,0.1)' : 'transparent',
                              color: !!+u.is_admin ? '#818cf8' : 'var(--text-muted)',
                              transition: 'all 0.15s', whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = !!+u.is_admin ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)';
                              e.currentTarget.style.color = !!+u.is_admin ? 'var(--danger)' : '#818cf8';
                              e.currentTarget.style.borderColor = !!+u.is_admin ? 'rgba(239,68,68,0.35)' : 'rgba(99,102,241,0.35)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = !!+u.is_admin ? 'rgba(99,102,241,0.1)' : 'transparent';
                              e.currentTarget.style.color = !!+u.is_admin ? '#818cf8' : 'var(--text-muted)';
                              e.currentTarget.style.borderColor = !!+u.is_admin ? 'rgba(99,102,241,0.35)' : 'var(--border-bright)';
                            }}>
                            {togglingAdminId === u.id
                              ? <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} />
                              : <Crown size={10} />}
                            {!!+u.is_admin ? '管理员' : '普通用户'}
                          </button>
                        )}
                      </td>

                      {/* 操作 */}
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <div className="flex items-center gap-1">
                          {/* 重置密码 */}
                          <button onClick={() => setResetTarget(u)} title="重置密码"
                            className="w-7 h-7 rounded flex items-center justify-center transition-all"
                            style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--accent)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                            <KeyRound size={13} />
                          </button>
                          {/* 禁用/启用/删除：不能操作自己或其他管理员 */}
                          {!isSelf(u) && !+u.is_admin && (
                            <>
                              <button onClick={() => handleToggleDisable(u)} disabled={togglingId === u.id}
                                title={+u.is_disabled ? '启用用户' : '禁用用户'}
                                className="w-7 h-7 rounded flex items-center justify-center transition-all"
                                style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}
                                onMouseEnter={e => { e.currentTarget.style.background = +u.is_disabled ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'; e.currentTarget.style.color = +u.is_disabled ? 'var(--success)' : 'var(--warning)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                                {togglingId === u.id ? <RefreshCw size={13} className="animate-spin" /> : +u.is_disabled ? <UserCheck size={13} /> : <UserX size={13} />}
                              </button>
                              <button onClick={() => setDeleteTarget(u)} title="删除用户"
                                className="w-7 h-7 rounded flex items-center justify-center transition-all"
                                style={{ color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'var(--danger)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── 限流管理 Tab ── */}
      {tab === 'rate' && (
        <div>
          <RateLimitConfig settings={settings} onSave={s => setSettings(prev => ({ ...prev, ...s }))} />
          <RateLimitPanel />
        </div>
      )}

      {/* ── 系统设置 Tab ── */}
      {tab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 520 }}>
          {/* 注册开关 */}
          <div className="vault-card p-6">
            <h2 className="font-semibold mb-5" style={{ color: 'var(--text)' }}>系统设置</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border-bright)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>允许公开注册</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    关闭后登录页隐藏注册入口，仅管理员可创建新用户
                  </p>
                </div>
                <button
                  onClick={() => handleSaveSetting('allow_register', settings.allow_register === '1' ? '0' : '1')}
                  disabled={savingSettings}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}>
                  {settings.allow_register === '1'
                    ? <ToggleRight size={36} style={{ color: 'var(--success)' }} />
                    : <ToggleLeft size={36} style={{ color: 'var(--text-muted)' }} />}
                </button>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                当前状态：注册功能
                <span style={{ color: settings.allow_register === '1' ? 'var(--success)' : 'var(--danger)', fontWeight: 500, marginLeft: 4 }}>
                  {settings.allow_register === '1' ? '已开启' : '已关闭'}
                </span>
              </p>
            </div>
          </div>

          {/* 品牌设置 */}
          <SiteBrandingCard settings={settings} onSave={(key, value) => setSettings(s => ({ ...s, [key]: value }))} onSiteInfoChange={onSiteInfoChange} />
        </div>
      )}

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onDone={fetchUsers} />}
      {resetTarget && <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} onDone={fetchUsers} />}
      {deleteTarget && <DeleteUserModal user={deleteTarget} onClose={() => setDeleteTarget(null)} onDone={fetchUsers} />}
    </div>
  );
}

const thStyle = {
  padding: '10px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.05em',
  color: 'var(--text-muted)', background: 'var(--bg)', whiteSpace: 'nowrap',
};
const tdStyle = { padding: '10px 16px', verticalAlign: 'middle' };
