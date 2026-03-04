import { useQuery } from '@tanstack/react-query'
import { groupsAPI, notificationsAPI } from '../services/api'
import { Card, CardHeader, CardTitle, Badge, Skeleton, EmptyState } from '../components/ui'
import { formatRelative } from '../utils/helpers'
import { Bell, CheckCircle2, XCircle, Clock } from 'lucide-react'

const typeLabel = {
  payment_reminder: 'Payment Reminder',
  turn_upcoming:    'Turn Notice',
  payment_received: 'Payment Confirmed',
  group_started:    'Group Started',
  cycle_advanced:   'Cycle Advanced',
  turn_collected:   'Collection Done',
}

const typeIcon = (t) => ({
  payment_reminder: Bell,
  turn_upcoming:    Clock,
  payment_received: CheckCircle2,
}[t] || Bell)

export default function Notifications() {
  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsAPI.list().then(r => r.data),
  })
  const groups = groupsData?.groups || []
  const firstGroup = groups[0]

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', firstGroup?._id],
    queryFn: () => notificationsAPI.listForGroup(firstGroup._id).then(r => r.data),
    enabled: !!firstGroup,
  })

  const notifications = data?.notifications || []

  return (
    <div className="space-y-6">
      <div className="animate-fadeUp">
        <h1 className="font-display font-extrabold text-3xl tracking-tight">Notifications</h1>
        <p className="text-sm text-muted font-body mt-1">Email reminders and alerts sent to members</p>
      </div>

      <Card className="animate-fadeUp">
        <CardHeader>
          <CardTitle>Notification History</CardTitle>
          <span className="text-xs text-muted font-body">{notifications.length} sent</span>
        </CardHeader>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="Send payment reminders from the group detail page."
          />
        ) : (
          <div>
            {notifications.map(n => {
              const Icon = typeIcon(n.type)
              return (
                <div key={n._id} className="flex items-start gap-4 px-5 py-4 border-b border-border last:border-0 hover:bg-surface2/40 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    n.status === 'sent' ? 'bg-success/10 text-success' :
                    n.status === 'failed' ? 'bg-danger/10 text-danger' :
                    'bg-surface2 text-muted'
                  }`}>
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-text font-body">
                        {typeLabel[n.type] || n.type}
                      </p>
                      <Badge variant={n.status === 'sent' ? 'green' : n.status === 'failed' ? 'red' : 'default'}>
                        {n.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted font-body">To: {n.recipientName || n.recipientEmail}</p>
                  </div>
                  <span className="text-xs text-muted font-body flex-shrink-0">
                    {formatRelative(n.createdAt)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
