import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { cn } from '@/utils/cn'
import { authService } from '@/services/authService'

const navItems = [
  { to: '/dashboard', label: 'Tableau', icon: 'dashboard' },
  { to: '/reservations', label: 'Réservations', icon: 'event' },
  { to: '/events', label: 'Événements', icon: 'calendar_today' },
  { to: '/programs', label: 'Formations', icon: 'school' },
  { to: '/spaces', label: 'Espaces', icon: 'business_center' },
  { to: '/participants', label: 'Inscrits', icon: 'group' },
]

function AdminTopBar() {
  const navigate = useNavigate()
  return (
    <header className="fixed top-0 w-full z-50 bg-[#fcf9f8]/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 h-16 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-on-surface font-headline tracking-tight">
            Ingenious City
          </span>
          <span className="hidden md:inline text-[10px] font-medium tracking-wider uppercase text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded">
            ADMIN
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="text-primary font-semibold text-sm hover:opacity-80 transition-opacity"
            onClick={() => {
              authService.logout()
              navigate('/login', { replace: true })
            }}
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  )
}

function Sidebar() {
  return (
    <aside className="hidden md:block w-64 shrink-0 px-4 py-6 sticky top-20 self-start">
      <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/20 p-4">
        <p className="text-[10px] font-medium tracking-wider uppercase text-on-surface-variant">
          Console admin
        </p>
        <nav className="mt-4 flex flex-col gap-1">
          {navItems.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-surface-container-high text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                )
              }
            >
              <Icon name={it.icon} />
              {it.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

function MobileBottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-outline-variant/20 bg-[#fcf9f8]/95 backdrop-blur-lg pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(28,27,27,0.06)]"
      aria-label="Navigation admin"
    >
      <div className="mx-auto grid h-[3.75rem] max-w-xl grid-cols-6">
        {navItems.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              cn(
                'flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1 transition-colors active:scale-[0.97] duration-150',
                isActive ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-primary',
              )
            }
          >
            <Icon name={it.icon} className="text-[22px] leading-none shrink-0" />
            <span className="w-full text-center font-body text-[8px] font-semibold uppercase leading-tight tracking-tight">
              {it.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <AdminTopBar />
      {/* Scroll normal navigateur; sidebar sticky uniquement */}
      <div className="pt-20 pb-24 max-w-7xl mx-auto flex gap-6 px-4 md:px-6">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
      <MobileBottomNav />
    </div>
  )
}
