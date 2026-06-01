import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Zap } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center', color: '#fca5a5' }}>
          <p>Enlace inválido.</p>
          <a href="/forgot-password" style={{ color: '#3b82f6', fontSize: 13 }}>Solicitar nuevo enlace</a>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
    if (form.newPassword.length < 8) { setError('Mínimo 8 caracteres.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (res.ok) { setSuccess(true); }
      else { setError(data.message || 'Token inválido o expirado.'); }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: '#0d1117',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    color: '#f0f6fc', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 32px rgba(59,130,246,0.3)' }}>
            <Zap size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f6fc', margin: 0 }}>ERP Cmr ConectaAI</h1>
        </div>
        <div style={{ background: '#161b22', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#cdd9e5', margin: '0 0 16px' }}>Nueva contraseña</h2>
          {success ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ width: 48, height: 48, background: '#064e3b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="22" height="22" fill="none" stroke="#34d399" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <p style={{ color: '#8b949e', fontSize: 13, marginBottom: 20 }}>Contraseña actualizada correctamente.</p>
              <a href="/login" style={{ color: '#3b82f6', fontSize: 13 }}>Ir al login</a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', color: '#fca5a5', padding: '10px 12px', borderRadius: 8, fontSize: 13 }}>{error}</div>}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>Nueva contraseña</label>
                <input type="password" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} placeholder="••••••••" style={inputStyle} minLength={8} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>Confirmar contraseña</label>
                <input type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="••••••••" style={inputStyle} minLength={8} required />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px 16px', background: loading ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
