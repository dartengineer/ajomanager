import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, Bell,
  Settings, LogOut, ChevronRight, Layers,
} from 'lucide-react'
import { cn } from '../../utils/helpers'
import { Avatar } from '../ui'
import useAuthStore from '../../store/authStore'
import { toast } from 'sonner'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/groups',    icon: Layers,          label: 'My Groups'  },
  { to: '/payments',  icon: CreditCard,      label: 'Payments'   },
  { to: '/members',   icon: Users,           label: 'Members'    },
  { to: '/notifications', icon: Bell,        label: 'Notifications' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <aside className="w-[230px] min-h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <div className="font-display font-extrabold text-xl tracking-tight">
          <span className="text-gold">Ajo</span>
          <span className="text-text">Manager</span>
        </div>
        <p className="text-[9px] uppercase tracking-[2.5px] text-muted mt-0.5 font-body">
          Savings Circle Platform
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[9px] uppercase tracking-[2px] text-muted px-2 mb-3 font-body">
          Menu
        </p>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all duration-150 group',
              isActive
                ? 'bg-gold/10 text-gold'
                : 'text-muted hover:bg-surface2 hover:text-text'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={cn(
                  'transition-colors flex-shrink-0',
                  isActive ? 'text-gold' : 'text-muted group-hover:text-text'
                )} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={12} className="text-gold/50" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Settings + User */}
      <div className="border-t border-border px-3 py-3 space-y-0.5">
        <NavLink
          to="/settings"
          className={({ isActive }) => cn(
            'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all duration-150',
            isActive ? 'bg-gold/10 text-gold' : 'text-muted hover:bg-surface2 hover:text-text'
          )}
        >
          <Settings size={16} />
          Settings
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-body font-medium text-muted hover:bg-danger/10 hover:text-danger transition-all duration-150"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>

      {/* User pill */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2.5">
          <Avatar name={user?.name} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text truncate font-body leading-none mb-0.5">
              {user?.name}
            </p>
            <p className="text-[11px] text-muted truncate font-body">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
