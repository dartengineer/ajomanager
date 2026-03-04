import { clsx } from 'clsx'
import { format, formatDistanceToNow } from 'date-fns'

// Merge class names
export const cn = (...args) => clsx(...args)

// Currency formatter
export const formatCurrency = (amount, currency = 'NGN') => {
  const symbols = { NGN: '₦', GBP: '£', USD: '$', EUR: '€', GHS: '₵', KES: 'KSh' }
  const sym = symbols[currency] || currency
  return `${sym}${Number(amount || 0).toLocaleString()}`
}

// Date formatters
export const formatDate = (date) => {
  if (!date) return '—'
  return format(new Date(date), 'dd MMM yyyy')
}

export const formatRelative = (date) => {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

// Get initials from name
export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

// Avatar background colours (deterministic from name)
const AVATAR_COLORS = [
  '#E8A838', '#3DD68C', '#4D9EFF', '#FF5C5C',
  '#A78BFA', '#F472B6', '#34D399', '#FBBF24',
]
export const getAvatarColor = (name = '') => {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// Frequency label
export const freqLabel = (freq) => ({
  weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly',
}[freq] || freq)

// Status colour map
export const statusColor = (status) => ({
  active:    'text-success bg-success/10',
  draft:     'text-muted bg-surface2',
  completed: 'text-info bg-info/10',
  paused:    'text-gold bg-gold-muted',
}[status] || 'text-muted bg-surface2')

// Ordinal suffix
export const ordinal = (n) => {
  const s = ['th','st','nd','rd'], v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
