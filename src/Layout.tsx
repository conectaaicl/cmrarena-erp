import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, FileText, ShoppingCart,
  Settings as SettingsIcon, Landmark, ChevronLeft, ChevronRight,
  Bell, LogOut,
} from 'lucide-react';
import { useAuthStore } from './store/authStore';
import api from './api/axios';
import { useQuery } from '@tanstack/react-query';

function Layout() {
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const primaryColor = user?.tenant?.primaryColor || '#0f172a';

  // Apply tenant branding on mount
  useEffect(() => {
    if (primaryColor) {
      document.documentElement.style.setProperty('--primary', primaryColor);
    }
  }, [primaryColor]);

  // Unread notifications count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.get('/notifications/unread-count').then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data.data),
    enabled: showNotifications,
  });

  const unreadCount = typeof unreadData === 'number' ? unreadData : 0;

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
    { to: '/crm', icon: <Users size={22} />, label: 'CRM / Clientes' },
    { to: '/inventory', icon: <Package size={22} />, label: 'Inventario' },
    { to: '/quotations', icon: <FileText size={22} />, label: 'Cotizaciones' },
    { to: '/sales', icon: <ShoppingCart size={22} />, label: 'Ventas' },
    { to: '/sii', icon: <Landmark size={22} />, label: 'SII Chile / DTEs' },
    { to: '/settings', icon: <SettingsIcon size={22} />, label: 'Configuración' },
  ];

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    refetchNotifications();
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-100">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'w-72' : 'w-20'
        } bg-white border-r border-slate-200 flex flex-col transition-all duration-300 relative shadow-sm z-20`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-8 bg-white border border-slate-200 text-slate-400 rounded-full p-1 hover:text-slate-600 hover:shadow-md transition-all shadow-sm z-30"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Logo / Brand */}
        <div className={`p-6 border-b border-slate-100 flex flex-col justify-center ${isSidebarOpen ? 'items-start' : 'items-center'} transition-all min-h-[96px]`}>
          {user?.tenant?.logoUrl ? (
            <div className={`flex items-center justify-center overflow-hidden mb-2 ${isSidebarOpen ? 'h-10' : 'h-8 w-8'}`}>
              <img
                src={user.tenant.logoUrl}
                alt={user.tenant.name}
                className="h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          ) : null}
          <h1
            className={`font-bold tracking-tight whitespace-nowrap transition-all ${isSidebarOpen ? 'text-2xl' : 'text-xl'}`}
            style={{ color: primaryColor }}
          >
            {isSidebarOpen ? (user?.tenant?.name || 'CmrArena ERP') : (user?.tenant?.name?.charAt(0) || 'C')}
          </h1>
          {isSidebarOpen && (
            <p className="text-xs text-slate-400 mt-1 truncate max-w-full">
              CmrArena ERP Pro
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto space-y-2 py-6 ${isSidebarOpen ? 'px-4' : 'px-3'}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={!isSidebarOpen ? item.label : undefined}
              className={({ isActive }) =>
                `group flex items-center rounded-xl transition-all duration-200 ${
                  isSidebarOpen ? 'px-4 py-3 space-x-4' : 'px-0 py-3 justify-center'
                } ${
                  isActive
                    ? 'font-semibold shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: `${primaryColor}18`, color: primaryColor }
                  : {}
              }
            >
              <div className={`${!isSidebarOpen ? 'group-hover:scale-110 transition-transform' : ''}`}>
                {item.icon}
              </div>
              {isSidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info at bottom */}
        {isSidebarOpen && user && (
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: primaryColor }}>
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-slate-400 truncate">{user.role}</p>
              </div>
              <button
                onClick={() => logout()}
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-end px-6 gap-3 flex-shrink-0">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <h3 className="font-semibold text-sm">Notificaciones</h3>
                  <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                    Marcar todas como leídas
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {!notificationsData || notificationsData.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">Sin notificaciones</p>
                  ) : (
                    notificationsData.map((n: any) => (
                      <div
                        key={n.id}
                        className={`p-3 border-b border-slate-50 ${!n.isRead ? 'bg-blue-50' : ''}`}
                      >
                        <p className="text-sm font-medium text-slate-800">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                        <p className="text-xs text-slate-300 mt-1">
                          {new Date(n.createdAt).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User badge */}
          {user && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: primaryColor }}>
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </div>
              <span className="hidden sm:block">{user.firstName}</span>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Overlay for notifications panel */}
      {showNotifications && (
        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
      )}
    </div>
  );
}

export default Layout;
