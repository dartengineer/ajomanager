import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { groupsAPI, membersAPI } from '../services/api'
import { Card, CardHeader, CardTitle, Avatar, Badge, Skeleton, EmptyState, Button } from '../components/ui'
import { formatCurrency } from '../utils/helpers'
import { Users, ArrowRight, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function Members() {
  const { data, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsAPI.list().then(r => r.data),
  })

  const groups = data?.groups || []

  const queryClient = useQueryClient()
  const removeMutation = useMutation({
    mutationFn: ({ groupId, memberId }) => membersAPI.remove(groupId, memberId),
    onSuccess: (res) => {
      toast.success(res.data.message)
      queryClient.invalidateQueries(['groups'])
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to remove member'),
  })

  // Flatten all members across groups
  const allMembers = groups.flatMap(g =>
    (g.members || []).map(m => ({
      ...m,
      groupName: g.name,
      groupId: g._id,
      currency: g.currency,
      contributionAmount: g.contributionAmount,
      groupStatus: g.status,
    }))
  )

  return (
    <div className="space-y-6">
      <div className="animate-fadeUp">
        <h1 className="font-display font-extrabold text-3xl tracking-tight">Members</h1>
        <p className="text-sm text-muted font-body mt-1">{allMembers.length} members across all groups</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : allMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Create a group and add members to see them here."
        />
      ) : (
        <Card className="animate-fadeUp">
          <CardHeader>
            <CardTitle>All Members</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-12 px-5 py-2.5 border-b border-border text-[10px] uppercase tracking-widest text-muted font-body">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Group</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-2">Turn</div>
            <div className="col-span-2 text-right">Status</div>
          </div>
          {allMembers.map(m => (
            <div key={`${m._id}-${m.groupId}`} className="grid grid-cols-12 px-5 py-3.5 border-b border-border last:border-0 items-center hover:bg-surface2/40 transition-colors">
              <div className="col-span-3 flex items-center gap-2.5">
                <Avatar name={m.name} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate font-body">{m.name}</p>
                  {m.email && <p className="text-[11px] text-muted truncate font-body">{m.email}</p>}
                </div>
              </div>
              <div className="col-span-3">
                <Link to={`/groups/${m.groupId}`} className="text-sm text-muted hover:text-gold transition-colors font-body inline-flex items-center gap-1">
                  {m.groupName} <ArrowRight size={10} />
                </Link>
              </div>
              <div className="col-span-2 text-sm text-muted font-body">{m.phone || '—'}</div>
              <div className="col-span-2 text-sm font-body">
                <span className="text-gold font-display font-bold">#{m.turnOrder}</span>
                {m.hasCollected && <span className="text-xs text-info ml-1.5 font-body">collected</span>}
              </div>
              <div className="col-span-2 flex justify-end gap-1.5">
                {m.hasPaid ? (
                  <Badge variant="green">Paid</Badge>
                ) : (
                  <Badge variant="red">Unpaid</Badge>
                )}
                {m.joinedMidCycle && !m.adjustmentPaid && (
                  <Badge variant="gold">Adj. owed</Badge>
                )}
                {m.groupStatus === 'draft' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Remove member"
                    onClick={() => {
                      if (window.confirm(`Remove ${m.name} from ${m.groupName}?`)) {
                        removeMutation.mutate({ groupId: m.groupId, memberId: m._id })
                      }
                    }}
                    loading={removeMutation.isPending}
                  >
                    <XCircle size={13} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
