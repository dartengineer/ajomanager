import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { groupsAPI } from '../services/api'
import {
  Card, Badge, Button, EmptyState, Skeleton,
} from '../components/ui'
import { formatCurrency, formatDate, freqLabel, ordinal } from '../utils/helpers'
import { Plus, Layers, Users, ArrowRight, Calendar, TrendingUp } from 'lucide-react'

export default function Groups() {
  const { data, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsAPI.list().then(r => r.data),
  })

  const groups = data?.groups || []

  const statusVariant = (s) => ({
    active: 'green', draft: 'default', completed: 'blue', paused: 'gold',
  }[s] || 'default')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fadeUp">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight">My Groups</h1>
          <p className="text-sm text-muted font-body mt-1">
            {groups.length} group{groups.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link to="/groups/new">
          <Button><Plus size={15} />New Group</Button>
        </Link>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No groups yet"
          description="Create your first Ajo savings group."
          action={<Link to="/groups/new"><Button><Plus size={13} />Create Group</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 stagger">
          {groups.map(group => {
            const paid = group.members?.filter(m => m.hasPaid).length || 0
            const total = group.members?.length || 0
            const pct = total > 0 ? Math.round((paid / total) * 100) : 0
            const collector = group.members?.find(m => m.turnOrder === group.currentCycle)

            return (
              <Link
                key={group._id}
                to={`/groups/${group._id}`}
                className="group"
              >
                <Card className="hover:border-gold/30 transition-all duration-200 hover:shadow-[0_0_30px_rgba(232,168,56,0.06)]" accent={group.status === 'active' ? 'gold' : undefined}>
                  <div className="p-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                        <Layers size={17} className="text-gold" />
                      </div>
                      <Badge variant={statusVariant(group.status)}>
                        {group.status}
                      </Badge>
                    </div>

                    {/* Name */}
                    <h3 className="font-display font-bold text-base text-text mb-1 group-hover:text-gold transition-colors">
                      {group.name}
                    </h3>

                    {/* Pot amount */}
                    <p className="font-display font-bold text-xl text-gold mb-3">
                      {formatCurrency(group.potTotal, group.currency)}
                      <span className="text-xs text-muted font-body font-normal ml-1">pot</span>
                    </p>

                    {/* Meta */}
                    <div className="space-y-1.5 text-xs text-muted font-body mb-4">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp size={11} />
                        {formatCurrency(group.contributionAmount, group.currency)} / {group.frequency}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users size={11} />
                        {total}/{group.totalMembers} members
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={11} />
                        Started {formatDate(group.startDate)}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {group.status === 'active' && (
                      <div>
                        <div className="flex justify-between text-[10px] text-muted font-body mb-1.5">
                          <span>Cycle {group.currentCycle}/{group.totalMembers}</span>
                          <span>{pct}% paid this cycle</span>
                        </div>
                        <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {collector && (
                          <p className="text-[11px] text-muted font-body mt-2">
                            Collecting: <span className="text-gold">{collector.name}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
