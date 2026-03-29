import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Save, Globe, Palette, Percent, Mail, Upload, Image as ImageIcon, Loader2, Phone, CreditCard, Users, Plus, Pencil, Trash2, ShieldCheck, X } from 'lucide-react';
import api from './api/axios';
import { useAuthStore } from './store/authStore';
import toast from 'react-hot-toast';

const cardStyle: React.CSSProperties = {
  background: '#161b22',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 12,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0d1117',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  color: '#cdd9e5',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#6e7681', marginBottom: 6,
};

const sectionTitle = (icon: React.ReactNode, label: string) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
    {icon}
    <span style={{ fontSize: 13, fontWeight: 600, color: '#cdd9e5' }}>{label}</span>
  </div>
);

const emptyForm = {
  name: '', domain: '', taxRate: 19,
  primaryColor: '#0f172a', resendApiKey: '', logoUrl: '',
  companyTagline: '', whatsapp: '', companyEmail: '',
  bankHolder: '', bankName: '', bankAccountType: '', bankRut: '', bankAccount: '',
};

const ROLES = ['ADMIN', 'MANAGER', 'SALES', 'INVENTORY', 'ACCOUNTANT'] as const;
const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Administrador', MANAGER: 'Gerente',
  SALES: 'Vendedor', INVENTORY: 'Inventario', ACCOUNTANT: 'Contador',
};
const ROLE_COLOR: Record<string, string> = {
  SUPER_ADMIN: '#f87171', ADMIN: '#fb923c', MANAGER: '#60a5fa',
  SALES: '#4ade80', INVENTORY: '#a78bfa', ACCOUNTANT: '#fbbf24',
};

type UserForm = { firstName: string; lastName: string; email: string; role: string; password: string; };
const emptyUserForm: UserForm = { firstName: '', lastName: '', email: '', role: 'SALES', password: '' };

export default function Settings() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...emptyForm });

  // Users management state
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);

  const { data: usersData = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.data ?? r.data),
  });

  const createUserMutation = useMutation({
    mutationFn: (data: UserForm) => api.post('/users', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Usuario creado'); resetUserForm(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al crear usuario'),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserForm> }) => api.patch(`/users/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Usuario actualizado'); resetUserForm(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al actualizar'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/users/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Usuario eliminado'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al eliminar'),
  });

  const resetUserForm = () => { setShowUserForm(false); setEditingUserId(null); setUserForm(emptyUserForm); };

  const handleEditUser = (u: any) => {
    setEditingUserId(u.id);
    setUserForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role, password: '' });
    setShowUserForm(true);
  };

  const handleSaveUser = () => {
    if (!userForm.firstName || !userForm.email) return toast.error('Nombre y email son requeridos');
    if (!editingUserId && !userForm.password) return toast.error('La contraseña es requerida para nuevos usuarios');
    const payload: Partial<UserForm> = {
      firstName: userForm.firstName, lastName: userForm.lastName,
      email: userForm.email, role: userForm.role,
      ...(userForm.password && { password: userForm.password }),
    };
    if (editingUserId) updateUserMutation.mutate({ id: editingUserId, data: payload });
    else createUserMutation.mutate(payload as UserForm);
  };

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/tenants/me').then(r => r.data.data ?? r.data),
  });

  useEffect(() => {
    const s = settings || user?.tenant;
    if (s) {
      setForm({
        name:            s.name            || '',
        domain:          s.domain          || '',
        taxRate:         s.taxRate         ?? 19,
        primaryColor:    s.primaryColor    || '#0f172a',
        resendApiKey:    s.resendApiKey    || '',
        logoUrl:         s.logoUrl         || '',
        companyTagline:  s.companyTagline  || '',
        whatsapp:        s.whatsapp        || '',
        companyEmail:    s.companyEmail    || '',
        bankHolder:      s.bankHolder      || '',
        bankName:        s.bankName        || '',
        bankAccountType: s.bankAccountType || '',
        bankRut:         s.bankRut         || '',
        bankAccount:     s.bankAccount     || '',
      });
    }
  }, [settings, user]);

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) => api.patch('/tenants/me', data),
    onSuccess: (res) => {
      const updated = res.data.data ?? res.data;
      if (user) {
        setUser({
          ...user,
          tenant: {
            ...user.tenant,
            name:            updated.name            ?? form.name,
            primaryColor:    updated.primaryColor    ?? form.primaryColor,
            taxRate:         updated.taxRate          ?? form.taxRate,
            logoUrl:         updated.logoUrl          ?? form.logoUrl,
            companyTagline:  updated.companyTagline  ?? form.companyTagline,
            whatsapp:        updated.whatsapp        ?? form.whatsapp,
            companyEmail:    updated.companyEmail    ?? form.companyEmail,
            bankHolder:      updated.bankHolder      ?? form.bankHolder,
            bankName:        updated.bankName        ?? form.bankName,
            bankAccountType: updated.bankAccountType ?? form.bankAccountType,
            bankRut:         updated.bankRut         ?? form.bankRut,
            bankAccount:     updated.bankAccount     ?? form.bankAccount,
          },
        });
      }
      document.documentElement.style.setProperty('--accent', form.primaryColor);
      toast.success('Configuración guardada');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al guardar'),
  });

  const [logoUploading, setLogoUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setLogoUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = res.data.url || res.data.data?.url || res.data.data?.fileUrl;
      if (url) {
        setForm(f => ({ ...f, logoUrl: url }));
        toast.success('Logo subido. Recuerda guardar la configuración.');
      } else throw new Error('no url');
    } catch {
      // Fallback: store as base64 (works when file server not configured)
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(f => ({ ...f, logoUrl: reader.result as string }));
        toast.success('Logo listo. Recuerda guardar la configuración.');
      };
      reader.readAsDataURL(file);
    } finally {
      setLogoUploading(false);
    }
  };

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '96px 0' }}>
      <Loader2 size={28} color="#3b82f6" className="animate-spin" />
    </div>
  );

  return (
    <div style={{ maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <SettingsIcon size={22} color="#6e7681" />
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f6fc', letterSpacing: '-0.4px', margin: 0 }}>Configuración</h1>
          <p style={{ fontSize: 13, color: '#484f58', marginTop: 2 }}>Empresa, marca, cotizaciones y datos bancarios</p>
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 28 }}>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

            {/* Empresa */}
            <div>
              {sectionTitle(<Globe size={14} color="#6e7681" />, 'Información de la Empresa')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Logo</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Preview */}
                    <div style={{ width: '100%', height: 100, borderRadius: 10, background: '#1a2332', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 12 }}>
                      {logoUploading
                        ? <Loader2 size={24} color="#3b82f6" className="animate-spin" />
                        : form.logoUrl
                          ? <img src={form.logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          : <div style={{ textAlign: 'center', color: '#484f58' }}>
                              <ImageIcon size={24} style={{ margin: '0 auto 6px' }} />
                              <p style={{ fontSize: 11 }}>Sin logo</p>
                            </div>
                      }
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <label style={{ cursor: logoUploading ? 'not-allowed' : 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 6, opacity: logoUploading ? 0.6 : 1 }}>
                        {logoUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                        {logoUploading ? 'Subiendo...' : 'Subir logo'}
                        <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{ display: 'none' }} onChange={handleLogoUpload} disabled={logoUploading} />
                      </label>
                      {form.logoUrl && (
                        <button type="button" onClick={() => setForm(f => ({ ...f, logoUrl: '' }))}
                          style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.2)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: '#f85149', fontSize: 12 }}>
                          Quitar
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: '#484f58' }}>PNG, SVG o WEBP recomendado. Fondo transparente o azul oscuro.</p>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Nombre Comercial</label>
                  <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Slogan / Tagline (aparece en cotizaciones)</label>
                  <input style={inputStyle} value={form.companyTagline}
                    onChange={e => setForm(f => ({ ...f, companyTagline: e.target.value }))}
                    placeholder="Fabricación a medida, toldos, persianas..." />
                </div>
                <div>
                  <label style={labelStyle}>Dominio</label>
                  <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ padding: '8px 12px', fontSize: 12, color: '#484f58', background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>
                      https://
                    </span>
                    <input style={{ ...inputStyle, border: 'none', borderRadius: 0, flex: 1 }}
                      value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Personalización + Fiscal */}
            <div>
              {sectionTitle(<Palette size={14} color="#6e7681" />, 'Personalización')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Color Primario</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={form.primaryColor}
                      onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                      style={{ width: 40, height: 40, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', background: 'none', padding: 2 }} />
                    <input style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 12, flex: 1 }}
                      value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} />
                    <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, background: form.primaryColor, border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                </div>
                <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {sectionTitle(<Percent size={14} color="#6e7681" />, 'Reglas Fiscales')}
                  <div>
                    <label style={labelStyle}>Tasa IVA (%)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="number" min="0" max="100" style={{ ...inputStyle, width: 80 }}
                        value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: Number(e.target.value) }))} />
                      <span style={{ fontSize: 12, color: '#484f58' }}>% (Chile: 19%)</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#484f58', marginTop: 6 }}>Usado en cotizaciones y ventas automáticamente.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contacto para cotizaciones */}
            <div style={{ gridColumn: '1/-1', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {sectionTitle(<Phone size={14} color="#6e7681" />, 'Contacto (aparece en pie de cotizaciones)')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>WhatsApp</label>
                  <input style={inputStyle} value={form.whatsapp}
                    onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                    placeholder="+56 9 XXXX XXXX" />
                </div>
                <div>
                  <label style={labelStyle}>Correo de contacto</label>
                  <input type="email" style={inputStyle} value={form.companyEmail}
                    onChange={e => setForm(f => ({ ...f, companyEmail: e.target.value }))}
                    placeholder="contacto@empresa.cl" />
                </div>
              </div>
            </div>

            {/* Datos bancarios */}
            <div style={{ gridColumn: '1/-1', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {sectionTitle(<CreditCard size={14} color="#6e7681" />, 'Datos Bancarios (transferencias en cotizaciones)')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Nombre titular</label>
                  <input style={inputStyle} value={form.bankHolder}
                    onChange={e => setForm(f => ({ ...f, bankHolder: e.target.value }))}
                    placeholder="NOMBRE APELLIDO" />
                </div>
                <div>
                  <label style={labelStyle}>RUT titular</label>
                  <input style={inputStyle} value={form.bankRut}
                    onChange={e => setForm(f => ({ ...f, bankRut: e.target.value }))}
                    placeholder="XX.XXX.XXX-X" />
                </div>
                <div>
                  <label style={labelStyle}>Banco</label>
                  <input style={inputStyle} value={form.bankName}
                    onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                    placeholder="BANCO DE CHILE" />
                </div>
                <div>
                  <label style={labelStyle}>Tipo de cuenta</label>
                  <input style={inputStyle} value={form.bankAccountType}
                    onChange={e => setForm(f => ({ ...f, bankAccountType: e.target.value }))}
                    placeholder="CORRIENTE / VISTA / AHORRO" />
                </div>
                <div>
                  <label style={labelStyle}>Número de cuenta</label>
                  <input style={inputStyle} value={form.bankAccount}
                    onChange={e => setForm(f => ({ ...f, bankAccount: e.target.value }))}
                    placeholder="000000000000" />
                </div>
              </div>
            </div>

            {/* Integraciones */}
            <div style={{ gridColumn: '1/-1', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {sectionTitle(<Mail size={14} color="#6e7681" />, 'Integraciones')}
              <div>
                <label style={labelStyle}>Resend API Key (envío de cotizaciones por email)</label>
                <input type="password" style={inputStyle} value={form.resendApiKey}
                  onChange={e => setForm(f => ({ ...f, resendApiKey: e.target.value }))} placeholder="re_..." />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button type="submit" disabled={saveMutation.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: form.primaryColor, border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: saveMutation.isPending ? 0.6 : 1 }}>
              {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
      {/* ── USUARIOS ── */}
      <div style={{ ...cardStyle, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={14} color="#6e7681" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#cdd9e5' }}>Usuarios del Equipo</span>
            <span style={{ fontSize: 11, color: '#484f58', background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '2px 8px' }}>{usersData.length}</span>
          </div>
          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <button onClick={() => { resetUserForm(); setShowUserForm(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: form.primaryColor || '#1d4ed8', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              <Plus size={13} />Nuevo usuario
            </button>
          )}
        </div>

        {/* Form */}
        {showUserForm && (
          <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#cdd9e5' }}>{editingUserId ? 'Editar usuario' : 'Nuevo usuario'}</span>
              <button onClick={resetUserForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6e7681' }}><X size={15} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nombre</label>
                <input value={userForm.firstName} onChange={e => setUserForm(f => ({ ...f, firstName: e.target.value }))}
                  placeholder="Juan" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Apellido</label>
                <input value={userForm.lastName} onChange={e => setUserForm(f => ({ ...f, lastName: e.target.value }))}
                  placeholder="Pérez" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="juan@empresa.cl" style={inputStyle} disabled={!!editingUserId} />
              </div>
              <div>
                <label style={labelStyle}>Rol</label>
                <select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>{editingUserId ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label>
                <input type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 8 caracteres" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button onClick={resetUserForm}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '7px 14px', fontSize: 12, color: '#8b949e', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleSaveUser} disabled={createUserMutation.isPending || updateUserMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: form.primaryColor || '#1d4ed8', border: 'none', borderRadius: 7, padding: '7px 16px', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: (createUserMutation.isPending || updateUserMutation.isPending) ? 0.6 : 1 }}>
                {(createUserMutation.isPending || updateUserMutation.isPending) && <Loader2 size={12} className="animate-spin" />}
                {editingUserId ? 'Actualizar' : 'Crear usuario'}
              </button>
            </div>
          </div>
        )}

        {/* Users list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {usersData.map((u: any, idx: number) => (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
              borderBottom: idx < usersData.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              opacity: u.isActive ? 1 : 0.45,
            }}>
              {/* Avatar */}
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${ROLE_COLOR[u.role] || '#60a5fa'}18`, border: `1px solid ${ROLE_COLOR[u.role] || '#60a5fa'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: ROLE_COLOR[u.role] || '#60a5fa' }}>
                  {u.firstName?.[0]}{u.lastName?.[0]}
                </span>
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#cdd9e5' }}>{u.firstName} {u.lastName}</span>
                  {u.id === user?.id && (
                    <span style={{ fontSize: 10, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>Tú</span>
                  )}
                  {!u.isActive && (
                    <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>Inactivo</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: '#6e7681' }}>{u.email}</span>
                  <span style={{ fontSize: 10, color: ROLE_COLOR[u.role] || '#60a5fa', background: `${ROLE_COLOR[u.role] || '#60a5fa'}15`, borderRadius: 4, padding: '1px 6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <ShieldCheck size={9} />{ROLE_LABEL[u.role] || u.role}
                  </span>
                </div>
              </div>
              {/* Actions — solo admin puede modificar otros usuarios */}
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && u.id !== user?.id && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => toggleActiveMutation.mutate({ id: u.id, isActive: !u.isActive })}
                    title={u.isActive ? 'Desactivar' : 'Activar'}
                    style={{ background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: u.isActive ? '#4ade80' : '#f87171', fontSize: 11, fontWeight: 600 }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </button>
                  <button onClick={() => handleEditUser(u)} title="Editar"
                    style={{ background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: '#6e7681', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fbbf24'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#6e7681'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => { if (confirm(`¿Eliminar a ${u.firstName}?`)) deleteUserMutation.mutate(u.id); }}
                    title="Eliminar"
                    style={{ background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: '#6e7681', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#6e7681'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
