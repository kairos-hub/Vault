import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';
import useAuthStore from '../utils/authStore';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [allowRegister, setAllowRegister] = useState(true);
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/register-status').then(({ data }) => {
      setAllowRegister(data.allow_register);
      if (!data.allow_register) setMode('login');
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, form);
      if (data.success) {
        login(data.token, data.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || '请求失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        }} />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-4 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}>
            <Shield size={26} color="white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Vault</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>安全的账号密码管理系统</p>
        </div>

        <div className="vault-card p-7">
          {/* 模式切换（仅允许注册时显示） */}
          {allowRegister && (
            <div className="flex rounded-lg p-1 mb-6" style={{ background: 'var(--bg)' }}>
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); }}
                  className="flex-1 py-1.5 rounded-md text-sm font-medium transition-all"
                  style={{
                    background: mode === m ? 'var(--bg-card)' : 'transparent',
                    color: mode === m ? 'var(--text)' : 'var(--text-muted)',
                    boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                    border: 'none', cursor: 'pointer'
                  }}>
                  {m === 'login' ? '登录' : '注册'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>用户名</label>
              <input className="vault-input" placeholder="输入用户名"
                value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>邮箱（可选）</label>
                <input className="vault-input" type="email" placeholder="输入邮箱"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-dim)' }}>密码</label>
              <div className="relative">
                <input className="vault-input" type={showPwd ? 'text' : 'password'} placeholder="输入密码"
                  style={{ paddingRight: '2.5rem' }}
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs rounded-lg px-3 py-2"
                style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary mt-1" disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? '请稍候...' : (mode === 'login' ? '登录' : '注册')}
            </button>
          </form>

          {!allowRegister && (
            <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              注册已关闭，请联系管理员
            </p>
          )}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          数据经过 AES 加密存储，安全可靠
        </p>
      </div>
    </div>
  );
}
