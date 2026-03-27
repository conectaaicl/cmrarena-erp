import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, FileText, ShoppingCart,
  Settings as SettingsIcon, Landmark, Bell, LogOut,
  ChevronLeft, ChevronRight, Zap, TrendingUp,
} from 'lucide-react';
import { useAuthStore } from './store/authStore';
import api from './api/axios';
import { useQuery } from '@tanstack/react-query';

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/crm',         icon: Users,           label: 'CRM / Clientes' },
  { to: '/inventory',   icon: Package,         label: 'Inventario' },
  { to: '/quotations',  icon: FileText,        label: 'Cotizaciones' },
  { to: '/sales',       icon: ShoppingCart,    label: 'Ventas' },
  { to: '/sii',         icon: Landmark,        label: 'SII Chile' },
  { to: '/seo',         icon: TrendingUp,      label: 'SEO Intelligence' },
  { to: '/settings',    icon: SettingsIcon,    label: 'Configuración' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  const accentColor = user?.tenant?.primaryColor || '#3b82f6';

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor);
  }, [accentColor]);

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

  const initials = `${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0d1117', overflow: 'hidden' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: collapsed ? 64 : 240,
        minWidth: collapsed ? 64 : 240,
        background: '#010409',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        position: 'relative',
        zIndex: 20,
        overflow: 'hidden',
      }}>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute', top: 20, right: -12,
            width: 24, height: 24,
            background: '#161b22',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#8b949e',
            zIndex: 30, transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        {/* Brand */}
        <div style={{
          padding: collapsed ? '22px 0' : '22px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 10, minHeight: 72,
          overflow: 'hidden',
        }}>
          {/* Logo or icon */}
          {user?.tenant?.logoUrl && !collapsed ? (
            <img
              src={user.tenant.logoUrl}
              alt={user.tenant.name}
              style={{ height: 28, objectFit: 'contain', maxWidth: 120 }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Zap size={15} color="#fff" />
            </div>
          )}
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{
                fontSize: 13, fontWeight: 700, color: '#f0f6fc',
                whiteSpace: 'nowrap', letterSpacing: '-0.2px',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.tenant?.name || 'ERP Cmr ConectaAI'}
              </p>
              <p style={{ fontSize: 10, color: '#484f58', marginTop: 1, whiteSpace: 'nowrap' }}>
                ConectaAI Suite
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} title={collapsed ? label : undefined}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 0' : '9px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 8,
                marginBottom: 2,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : '#6e7681',
                background: isActive ? `${accentColor}22` : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                position: 'relative',
              })}
              onMouseEnter={e => {
                const el = e.currentTarget;
                if (!el.style.background.includes('22')) el.style.background = 'rgba(255,255,255,0.04)';
                el.style.color = '#cdd9e5';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                // restore via re-render triggered by NavLink, just reset hover bg
                if (!el.getAttribute('aria-current')) {
                  el.style.background = 'transparent';
                  el.style.color = '#6e7681';
                }
              }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span style={{
                      position: 'absolute', left: 0, top: '20%', bottom: '20%',
                      width: 3, borderRadius: '0 3px 3px 0',
                      background: accentColor,
                    }} />
                  )}
                  <Icon size={17} style={{ flexShrink: 0, color: isActive ? accentColor : undefined }} />
                  {!collapsed && <span>{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        {!collapsed && user && (
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: `${accentColor}33`,
              border: `1px solid ${accentColor}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: accentColor, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#cdd9e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.firstName} {user.lastName}
              </p>
              <p style={{ fontSize: 10, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {user.role}
              </p>
            </div>
            <button onClick={() => logout()} title="Cerrar sesión"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#484f58', padding: 4, display: 'flex', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f85149')}
              onMouseLeave={e => (e.currentTarget.style.color = '#484f58')}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
        {collapsed && user && (
          <div style={{ padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: `${accentColor}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: accentColor,
            }}>
              {initials}
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{
          height: 52, flexShrink: 0,
          background: '#010409',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 24px', gap: 8,
        }}>
          {/* Notif bell */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowNotif(!showNotif)}
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: showNotif ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: '1px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#6e7681', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#cdd9e5'; }}
              onMouseLeave={e => { if (!showNotif) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6e7681'; } }}
            >
              <Bell size={16} />
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#f85149',
                  border: '1.5px solid #010409',
                }} />
              )}
            </button>

            {showNotif && (
              <div style={{
                position: 'absolute', right: 0, top: 42,
                width: 320,
                background: '#161b22',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                zIndex: 100,
              }}>
                <div style={{
                  padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f6fc' }}>Notificaciones</span>
                  <button onClick={markAllRead} style={{ fontSize: 11, color: accentColor, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Marcar leídas
                  </button>
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {!notifList?.length ? (
                    <p style={{ fontSize: 13, color: '#484f58', textAlign: 'center', padding: '24px 0' }}>Sin notificaciones</p>
                  ) : notifList.map((n: any) => (
                    <div key={n.id} style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: !n.isRead ? 'rgba(59,130,246,0.05)' : 'transparent',
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#cdd9e5' }}>{n.title}</p>
                      <p style={{ fontSize: 11, color: '#6e7681', marginTop: 2 }}>{n.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User chip */}
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 10px', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                background: `${accentColor}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: accentColor,
              }}>
                {initials}
              </div>
              <span style={{ fontSize: 12, color: '#8b949e', fontWeight: 500 }}>{user.firstName}</span>
            </div>
          )}
        </header>

        {/* Page content */}
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: '28px 32px',
          background: '#0d1117',
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>

      {showNotif && (
        <div onClick={() => setShowNotif(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
      )}
    </div>
  );
}
