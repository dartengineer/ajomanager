import { useQuery } from '@tanstack/react-query'
import { groupsAPI, paymentsAPI } from '../services/api'
import { Card, CardHeader, CardTitle, Badge, Skeleton, EmptyState } from '../components/ui'
import { formatCurrency, formatDate } from '../utils/helpers'
import { CreditCard } from 'lucide-react'

export default function Payments() {
  const { data: groupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsAPI.list().then(r => r.data),
  })

  const groups = groupsData?.groups || []
  const firstGroup = groups[0]

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payments', 'all', firstGroup?._id],
    queryFn: () => paymentsAPI.listForGroup(firstGroup._id).then(r => r.data),
    enabled: !!firstGroup,
  })

  const payments = paymentsData?.payments || []

  return (
    <div className="space-y-6">
      <div className="animate-fadeUp">
        <h1 className="font-display font-extrabold text-3xl tracking-tight">Payments</h1>
        <p className="text-sm text-muted font-body mt-1">Track all recorded contributions</p>
      </div>

      <Card className="animate-fadeUp">
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <span className="text-xs text-muted font-body">{payments.length} total</span>
        </CardHeader>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payments recorded"
            description="Open a group and record payments as members contribute."
          />
        ) : (
          <div>
            <div className="grid grid-cols-12 px-5 py-2.5 border-b border-border text-[10px] uppercase tracking-widest text-muted font-body">
              <div className="col-span-3">Member</div>
              <div className="col-span-2">Cycle</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Method</div>
              <div className="col-span-1 text-right">Date</div>
            </div>
            {payments.map(p => (
              <div key={p._id} className="grid grid-cols-12 px-5 py-3.5 border-b border-border last:border-0 items-center hover:bg-surface2/40 transition-colors">
                <div className="col-span-3 text-sm font-medium text-text font-body">{p.memberName}</div>
                <div className="col-span-2 text-sm text-muted font-body">Cycle {p.cycle}</div>
                <div className="col-span-2 text-sm text-success font-medium font-body">{formatCurrency(p.amount)}</div>
                <div className="col-span-2">
                  <Badge variant={p.type === 'contribution' ? 'gold' : 'blue'}>{p.type}</Badge>
                </div>
                <div className="col-span-2 text-sm text-muted capitalize font-body">{p.method?.replace('_', ' ')}</div>
                <div className="col-span-1 text-xs text-muted text-right font-body">{formatDate(p.paidAt)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
