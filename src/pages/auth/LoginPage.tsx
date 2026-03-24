import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Zap } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ tenantSlug: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenantSlug || !form.email || !form.password) {
      toast.error('Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      await login(form.tenantSlug, form.email, form.password);
      toast.success('Bienvenido');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: '#0d1117',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#f0f6fc',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: '#8b949e',
    marginBottom: 6,
    letterSpacing: '0.2px',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Subtle grid bg */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59,130,246,0.06) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(139,92,246,0.04) 0%, transparent 50%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 32px rgba(59,130,246,0.3)',
          }}>
            <Zap size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f6fc', margin: 0, letterSpacing: '-0.4px' }}>
            ERP Cmr ConectaAI
          </h1>
          <p style={{ fontSize: 13, color: '#484f58', marginTop: 6 }}>
            Plataforma de Gestión Empresarial
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#161b22',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: 28,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#cdd9e5', margin: '0 0 22px' }}>
            Iniciar Sesión
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Empresa</label>
              <input
                type="text"
                value={form.tenantSlug}
                onChange={e => setForm({ ...form, tenantSlug: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                placeholder="terrablinds"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                autoComplete="organization"
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="admin@empresa.cl"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                autoComplete="email"
              />
            </div>

            <div>
              <label style={labelStyle}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 40 }}
                  onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#484f58', display: 'flex', padding: 0,
                  }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '11px 16px', marginTop: 4,
                background: loading ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none', borderRadius: 8,
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(59,130,246,0.3)',
              }}>
              {loading ? 'Verificando...' : 'Ingresar al sistema'}
            </button>
          </form>
        </div>

        {/* Demo hint */}
        <p style={{ textAlign: 'center', fontSize: 11, color: '#30363d', marginTop: 16 }}>
          Demo: <span style={{ color: '#484f58' }}>terrablinds</span> · admin@terrablinds.cl · TerraBlinds2024!
        </p>
      </div>
    </div>
  );
}
