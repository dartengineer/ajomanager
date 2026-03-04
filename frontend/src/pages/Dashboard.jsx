import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { groupsAPI } from '../services/api'
import {
  StatCard, Card, CardHeader, CardTitle, CardBody,
  Badge, Avatar, Skeleton, EmptyState, Button,
} from '../components/ui'
import { formatCurrency, formatDate, statusColor, freqLabel, ordinal } from '../utils/helpers'
import {
  Layers, Users, TrendingUp, Clock, Plus,
  ArrowRight, CheckCircle2, AlertCircle,
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

export default function Dashboard() {
  const { user } = useAuthStore()

  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsAPI.list().then(r => r.data),
  })

  const groups = groupsData?.groups || []
  const activeGroups = groups.filter(g => g.status === 'active')
  const totalPot = groups.reduce((s, g) => s + (g.potTotal || 0), 0)
  const totalMembers = groups.reduce((s, g) => s + (g.members?.length || 0), 0)

  // Chart data — contributions over cycles (mock progression from real data)
  const chartData = activeGroups.slice(0, 1).flatMap(g =>
    Array.from({ length: g.totalMembers }, (_, i) => ({
      cycle: `C${i + 1}`,
      collected: i < g.currentCycle ? g.contributionAmount * g.members.length : 0,
    }))
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between animate-fadeUp">
        <div>
          <p className="text-sm text-muted font-body mb-0.5">{greeting},</p>
          <h1 className="font-display font-extrabold text-3xl tracking-tight">
            {user?.name?.split(' ')[0]} <span className="text-gold">👋</span>
          </h1>
        </div>
        <Link to="/groups/new">
          <Button>
            <Plus size={15} />
            New Group
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 stagger">
        <StatCard
          label="Total Groups"
          value={groups.length}
          sub={`${activeGroups.length} active`}
          accent="gold"
          icon={Layers}
        />
        <StatCard
          label="Total Members"
          value={totalMembers}
          sub="across all groups"
          accent="blue"
          icon={Users}
        />
        <StatCard
          label="Combined Pot"
          value={formatCurrency(totalPot)}
          sub="across all groups"
          accent="green"
          icon={TrendingUp}
        />
        <StatCard
          label="Active Cycles"
          value={activeGroups.length}
          sub="groups in progress"
          accent="gold"
          icon={Clock}
        />
      </div>

      {/* Two column */}
      <div className="grid grid-cols-5 gap-5">
        {/* Groups list */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>My Groups</CardTitle>
              <Link to="/groups" className="text-xs text-muted hover:text-gold transition-colors flex items-center gap-1 font-body">
                View all <ArrowRight size={12} />
              </Link>
            </CardHeader>

            {isLoading ? (
              <div className="p-5 space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : groups.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No groups yet"
                description="Create your first Ajo group to get started."
                action={
                  <Link to="/groups/new">
                    <Button size="sm"><Plus size={13} />Create Group</Button>
                  </Link>
                }
              />
            ) : (
              <div>
                {groups.slice(0, 5).map((group, i) => (
                  <Link
                    key={group._id}
                    to={`/groups/${group._id}`}
                    className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-surface2/50 transition-colors group"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Layers size={16} className="text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-text truncate font-body">{group.name}</p>
                      <p className="text-xs text-muted font-body">
                        {group.members?.length}/{group.totalMembers} members · {freqLabel(group.frequency)} · {formatCurrency(group.contributionAmount, group.currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant={
                        group.status === 'active' ? 'green' :
                        group.status === 'completed' ? 'blue' : 'default'
                      }>
                        {group.status}
                      </Badge>
                      {group.status === 'active' && (
                        <span className="text-xs text-muted font-body">
                          Cycle {group.currentCycle}/{group.totalMembers}
                        </span>
                      )}
                    </div>
                    <ArrowRight size={14} className="text-muted group-hover:text-gold transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right panel */}
        <div className="col-span-2 space-y-4">
          {/* Active alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Needs Attention</CardTitle>
              <Badge variant="red">{activeGroups.reduce((s,g) => s + g.members.filter(m => !m.hasPaid).length, 0)} unpaid</Badge>
            </CardHeader>
            <div>
              {activeGroups.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-muted font-body">
                  No active groups
                </div>
              ) : (
                activeGroups.slice(0, 3).map(group => {
                  const unpaid = group.members.filter(m => !m.hasPaid)
                  const collector = group.members.find(m => m.turnOrder === group.currentCycle)
                  return (
                    <Link
                      key={group._id}
                      to={`/groups/${group._id}`}
                      className="flex items-start gap-3 px-5 py-3 border-b border-border last:border-0 hover:bg-surface2/50 transition-colors"
                    >
                      <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${unpaid.length > 0 ? 'bg-danger' : 'bg-success'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate font-body">{group.name}</p>
                        <p className="text-xs text-muted font-body">
                          {unpaid.length > 0
                            ? `${unpaid.length} member${unpaid.length > 1 ? 's' : ''} haven't paid`
                            : 'All paid ✓'}
                        </p>
                        {collector && (
                          <p className="text-xs text-gold/70 font-body mt-0.5">
                            Collecting: {collector.name}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </Card>

          {/* Trend chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Collection Progress</CardTitle>
                <span className="text-xs text-muted font-body">{activeGroups[0]?.name}</span>
              </CardHeader>
              <div className="px-2 pb-4 pt-2">
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E8A838" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#E8A838" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="cycle" tick={{ fontSize: 10, fill: '#7A7670' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1E1E1E', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [formatCurrency(v), 'Collected']}
                    />
                    <Area type="monotone" dataKey="collected" stroke="#E8A838" strokeWidth={2} fill="url(#goldGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
