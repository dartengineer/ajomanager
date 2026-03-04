import { forwardRef } from 'react'
import { cn, getInitials, getAvatarColor } from '../../utils/helpers'
import { Loader2 } from 'lucide-react'

// ── Button ────────────────────────────────────────────────────────────────
export const Button = forwardRef(({
  children, variant = 'primary', size = 'md',
  loading, disabled, className, ...props
}, ref) => {
  const base = 'inline-flex items-center justify-center gap-2 font-body font-medium rounded-lg transition-all duration-150 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary:  'bg-gold text-bg hover:bg-gold-light active:scale-[0.98]',
    outline:  'border border-border text-text hover:border-gold hover:text-gold bg-transparent',
    ghost:    'text-muted hover:text-text hover:bg-surface2 bg-transparent',
    danger:   'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20',
    success:  'bg-success/10 text-success hover:bg-success/20 border border-success/20',
  }
  const sizes = {
    sm:  'text-xs px-3 py-1.5',
    md:  'text-sm px-4 py-2.5',
    lg:  'text-base px-6 py-3',
    icon:'p-2',
  }
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
})
Button.displayName = 'Button'

// ── Input ─────────────────────────────────────────────────────────────────
export const Input = forwardRef(({ label, error, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-xs uppercase tracking-widest text-muted font-body">
        {label}
      </label>
    )}
    <input
      ref={ref}
      className={cn(
        'w-full bg-bg border border-border rounded-lg px-3.5 py-2.5 text-sm text-text',
        'placeholder:text-muted/50 font-body',
        'focus:border-gold focus:outline-none transition-colors',
        error && 'border-danger focus:border-danger',
        className
      )}
      {...props}
    />
    {error && <span className="text-xs text-danger">{error}</span>}
  </div>
))
Input.displayName = 'Input'

// ── Select ────────────────────────────────────────────────────────────────
export const Select = forwardRef(({ label, error, children, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-xs uppercase tracking-widest text-muted font-body">
        {label}
      </label>
    )}
    <select
      ref={ref}
      className={cn(
        'w-full bg-bg border border-border rounded-lg px-3.5 py-2.5 text-sm text-text',
        'font-body focus:border-gold focus:outline-none transition-colors cursor-pointer',
        error && 'border-danger',
        className
      )}
      {...props}
    >
      {children}
    </select>
    {error && <span className="text-xs text-danger">{error}</span>}
  </div>
))
Select.displayName = 'Select'

// ── Badge ─────────────────────────────────────────────────────────────────
export const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default:  'bg-surface2 text-muted',
    gold:     'bg-gold/10 text-gold',
    green:    'bg-success/10 text-success',
    red:      'bg-danger/10 text-danger',
    blue:     'bg-info/10 text-info',
    outline:  'border border-border text-muted',
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full font-body',
      variants[variant], className
    )}>
      {children}
    </span>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────
export const Avatar = ({ name = '', size = 'md', className }) => {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }
  const color = getAvatarColor(name)
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-display font-bold flex-shrink-0',
        sizes[size], className
      )}
      style={{ background: color, color: '#0D0D0D' }}
    >
      {getInitials(name)}
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────
export const Card = ({ children, className, accent }) => (
  <div className={cn(
    'bg-surface border border-border rounded-2xl overflow-hidden',
    'transition-colors duration-200',
    className
  )}>
    {accent && (
      <div className={cn('h-[3px]', {
        'bg-gradient-to-r from-gold to-gold-light': accent === 'gold',
        'bg-gradient-to-r from-success to-emerald-500': accent === 'green',
        'bg-gradient-to-r from-danger to-red-400': accent === 'red',
        'bg-gradient-to-r from-info to-blue-300': accent === 'blue',
      })} />
    )}
    {children}
  </div>
)

export const CardHeader = ({ children, className }) => (
  <div className={cn('px-5 py-4 border-b border-border flex items-center justify-between', className)}>
    {children}
  </div>
)

export const CardTitle = ({ children, className }) => (
  <h3 className={cn('font-display font-bold text-sm tracking-wide text-text', className)}>
    {children}
  </h3>
)

export const CardBody = ({ children, className }) => (
  <div className={cn('p-5', className)}>{children}</div>
)

// ── Modal ─────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn(
        'bg-surface border border-border rounded-2xl w-full max-h-[85vh] overflow-y-auto',
        'animate-fadeUp',
        sizes[size]
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-bold text-base text-text">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-surface2 text-muted hover:text-text transition-colors flex items-center justify-center text-lg leading-none"
          >×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────
export const Skeleton = ({ className }) => (
  <div className={cn('skeleton', className)} />
)

// ── Stat Card ─────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, sub, accent = 'gold', icon: Icon }) => {
  const accents = {
    gold:  'from-gold to-gold-light',
    green: 'from-success to-emerald-500',
    red:   'from-danger to-red-400',
    blue:  'from-info to-blue-300',
  }
  return (
    <Card className="hover:border-gold/20 group" accent={accent}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[10px] uppercase tracking-[2px] text-muted font-body">{label}</p>
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-surface2 flex items-center justify-center text-muted group-hover:text-gold transition-colors">
              <Icon size={15} />
            </div>
          )}
        </div>
        <p className="font-display font-bold text-2xl tracking-tight text-text">{value}</p>
        {sub && <p className="text-xs text-muted mt-1 font-body">{sub}</p>}
      </div>
    </Card>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
    {Icon && (
      <div className="w-14 h-14 rounded-2xl bg-surface2 border border-border flex items-center justify-center mb-4 text-muted">
        <Icon size={24} />
      </div>
    )}
    <h3 className="font-display font-bold text-base text-text mb-1">{title}</h3>
    {description && <p className="text-sm text-muted max-w-xs mb-5">{description}</p>}
    {action}
  </div>
)

// ── Spinner ───────────────────────────────────────────────────────────────
export const Spinner = ({ size = 20 }) => (
  <Loader2 size={size} className="animate-spin text-gold" />
)

export const FullPageSpinner = () => (
  <div className="flex-1 flex items-center justify-center min-h-screen bg-bg">
    <div className="flex flex-col items-center gap-3">
      <Spinner size={32} />
      <p className="text-sm text-muted font-body">Loading…</p>
    </div>
  </div>
)
