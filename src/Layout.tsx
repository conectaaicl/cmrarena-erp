import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, FileText, ShoppingCart, Globe, PackageCheck, FolderKanban, Building2,
  Settings as SettingsIcon, Landmark, Bell, LogOut,
  ChevronLeft, ChevronRight, Zap, TrendingUp, Search, ClipboardList, BookOpen,
} from 'lucide-react';
import { useAuthStore } from './store/authStore';
import api from './api/axios';
import { useQuery } from '@tanstack/react-query';

const NAV_GROUPS = [
  { label: 'INICIO', items: [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',          color: '#8b5cf6' },
  ]},
  { label: 'GESTIÓN', items: [
    { to: '/crm',          icon: Users,           label: 'CRM / Clientes',     color: '#10b981' },
    { to: '/seguimiento',  icon: ClipboardList,   label: 'Seguimiento',        color: '#06b6d4' },
    { to: '/inventory',    icon: Package,         label: 'Inventario',         color: '#3b82f6' },
    { to: '/quotations',   icon: FileText,        label: 'Cotizaciones',       color: '#f59e0b' },
    { to: '/sales',        icon: ShoppingCart,    label: 'Ventas',             color: '#ef4444' },
  ]},
  { label: 'FINANZAS', items: [
    { to: '/sii',          icon: Landmark,        label: 'SII Chile',          color: '#22d3ee' },
    { to: '/finance',      icon: BookOpen,        label: 'Finanzas',           color: '#4ade80' },
  ]},
  { label: 'CONECTAAI', items: [
    { to: '/ca-clientes',  icon: Building2,       label: 'Mis Clientes CA',    color: '#a78bfa' },
    { to: '/ca-proyectos', icon: FolderKanban,    label: 'Mis Proyectos CA',   color: '#f472b6' },
  ]},
  { label: 'DIGITAL', items: [
    { to: '/web-quotes',   icon: Globe,           label: 'Cotizador Web',      color: '#14b8a6' },
    { to: '/deliveries',   icon: PackageCheck,    label: 'Entregas Digitales', color: '#fb923c' },
    { to: '/seo',          icon: TrendingUp,      label: 'SEO Intelligence',   color: '#fbbf24' },
  ]},
  { label: 'CONFIG', items: [
    { to: '/settings',     icon: SettingsIcon,    label: 'Configuración',      color: '#94a3b8' },
  ]},
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth < 768) setCollapsed(true); };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.get('/notifications/unread-count').then(r => r.data.data),
    refetchInterval: 30_000,
  });
  const { data: notifList, refetch: refetchNotif } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data),
    enabled: showNotif,
  });

  const unread = typeof unreadData === 'number' ? unreadData : 0;
  const markAllRead = async () => { await api.patch('/notifications/read-all'); refetchNotif(); };

  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQ],
    queryFn: () => api.get('/search?q=' + encodeURIComponent(searchQ)).then(r => r.data.data ?? r.data),
    enabled: searchQ.trim().length >= 2,
    staleTime: 10_000,
  });

  const initials = (user?.firstName?.charAt(0) ?? '') + (user?.lastName?.charAt(0) ?? '');

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#080812', overflow: 'hidden' }}>

      {/* SIDEBAR */}
      <aside style={{
        width: collapsed ? 60 : 240, minWidth: collapsed ? 60 : 240,
        background: 'linear-gradient(180deg,#0c0c1e 0%,#08080f 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        position: 'relative', zIndex: 20, overflow: 'hidden',
      }}>

        <button onClick={() => setCollapsed(!collapsed)} style={{
          position: 'absolute', top: 20, right: -12, width: 24, height: 24,
          background: '#0c0c1e', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#475569', zIndex: 30, transition: 'color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        <div style={{
          padding: collapsed ? '20px 0' : '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 10, minHeight: 64, overflow: 'hidden',
        }}>
          {user?.tenant?.logoUrl && !collapsed ? (
            <img src={user.tenant.logoUrl} alt={user.tenant.name}
              style={{ height: 26, objectFit: 'contain', maxWidth: 110 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              boxShadow: '0 0 18px rgba(124,58,237,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Zap size={14} color="#fff" />
            </div>
          )}
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f6fc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.tenant?.name || 'ERP ConectaAI'}
              </p>
              <p style={{ fontSize: 10, color: '#334155', marginTop: 1 }}>ConectaAI Suite</p>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: 14 }}>
              {!collapsed && (
                <p style={{ fontSize: 9, fontWeight: 700, color: '#334155', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 3 }}>
                  {group.label}
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {group.items.map(({ to, icon: Icon, label, color }) => (
                  <NavLink key={to} to={to} title={collapsed ? label : undefined}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center',
                      gap: collapsed ? 0 : 8,
                      padding: collapsed ? '10px 0' : '7px 10px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: 8, fontSize: 13, fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#f0f6fc' : '#4b5563',
                      background: isActive ? (color + '14') : 'transparent',
                      boxShadow: isActive ? ('inset 0 0 0 1px ' + color + '20') : 'none',
                      textDecoration: 'none', transition: 'all 0.15s',
                      whiteSpace: 'nowrap', overflow: 'hidden', position: 'relative',
                    })}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      if (!el.style.background.includes('14')) el.style.background = 'rgba(255,255,255,0.035)';
                      el.style.color = '#e2e8f0';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      if (!el.getAttribute('aria-current')) { el.style.background = 'transparent'; el.style.color = '#4b5563'; }
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && !collapsed && (
                          <span style={{
                            position: 'absolute', left: 0, top: '15%', bottom: '15%',
                            width: 2, borderRadius: '0 2px 2px 0',
                            background: 'linear-gradient(180deg,' + color + ',' + color + '60)',
                          }} />
                        )}
                        {!collapsed && (
                          <span style={{ width: 4, height: 4, borderRadius: '50%', flexShrink: 0, background: isActive ? color : (color + '55') }} />
                        )}
                        <span style={{ flexShrink: 0, color: isActive ? color : (color + '88'), transition: 'color 0.15s' }}>
                          <Icon size={15} />
                        </span>
                        {!collapsed && <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px' }}>
          {!collapsed && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.firstName} {user.lastName}
                </p>
                <p style={{ fontSize: 10, color: '#334155', textTransform: 'capitalize' }}>{user.role}</p>
              </div>
              <button onClick={() => logout()} title="Salir"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', padding: 4, display: 'flex', transition: 'color 0.15s', borderRadius: 6 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
          {collapsed && user && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                {initials}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          height: 50, flexShrink: 0,
          background: 'rgba(8,8,18,0.95)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', gap: 12,
        }}>
          <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0 12px', height: 32 }}>
              <Search size={12} color="#334155" style={{ flexShrink: 0 }} />
              <input type="text" placeholder="Buscar clientes, productos, cotizaciones..."
                value={searchQ}
                onChange={e => { setSearchQ(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12, color: '#cdd9e5', flex: 1, minWidth: 0 }}
              />
              {searchQ && (
                <button onClick={() => { setSearchQ(''); setShowSearch(false); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', padding: 0, lineHeight: 1 }}>x</button>
              )}
            </div>
            {showSearch && searchQ.trim().length >= 2 && searchResults && (
              <div style={{ position: 'absolute', top: 38, left: 0, right: 0, background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.7)', zIndex: 210, maxHeight: 400, overflowY: 'auto' }}>
                {!searchResults.clients?.length && !searchResults.products?.length && !searchResults.quotations?.length && (
                  <p style={{ fontSize: 12, color: '#334155', textAlign: 'center', padding: '20px 0' }}>Sin resultados</p>
                )}
                {searchResults.clients?.map((c: any) => (
                  <button key={c.id} onClick={() => { navigate('/crm'); setShowSearch(false); setSearchQ(''); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                    <p style={{ fontSize: 12, color: '#e2e8f0' }}>{c.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowNotif(!showNotif)}
              style={{ width: 32, height: 32, borderRadius: 9, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#e2e8f0'; }}
              onMouseLeave={e => { if (!showNotif) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
            >
              <Bell size={15} />
              {unread > 0 && <span style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: '50%', background: '#f87171', border: '1.5px solid #080812' }} />}
            </button>
            {showNotif && (
              <div style={{ position: 'absolute', right: 0, top: 40, width: 300, background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.7)', zIndex: 100 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f6fc' }}>Notificaciones</span>
                  <button onClick={markAllRead} style={{ fontSize: 11, color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer' }}>Marcar leidas</button>
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {!notifList?.length ? (
                    <p style={{ fontSize: 12, color: '#334155', textAlign: 'center', padding: '24px 0' }}>Sin notificaciones</p>
                  ) : notifList.map((n: any) => (
                    <div key={n.id} style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{n.title}</p>
                      <p style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{n.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                {initials}
              </div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{user.firstName}</span>
            </div>
          )}
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#080812' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>

      {showNotif && <div onClick={() => setShowNotif(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />}
      {showSearch && <div onClick={() => setShowSearch(false)} style={{ position: 'fixed', inset: 0, zIndex: 190 }} />}
    </div>
  );
}
