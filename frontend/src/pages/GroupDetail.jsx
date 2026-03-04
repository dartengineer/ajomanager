import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { groupsAPI, membersAPI, paymentsAPI, notificationsAPI } from '../services/api'
import {
  Card, CardHeader, CardTitle, CardBody, Badge, Button,
  Modal, Input, Select, Avatar, Skeleton, EmptyState,
} from '../components/ui'
import {
  formatCurrency, formatDate, freqLabel, ordinal, getAvatarColor,
} from '../utils/helpers'
import {
  ArrowLeft, Plus, Play, Shuffle, ChevronRight, CheckCircle2,
  XCircle, Bell, CreditCard, RotateCcw, AlertTriangle,
  UserPlus, TrendingUp, Users,
} from 'lucide-react'

// ── Add Member Modal ───────────────────────────────────────────────────────
function AddMemberModal({ open, onClose, groupId, onSuccess }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })
  const mutation = useMutation({
    mutationFn: (d) => membersAPI.add(groupId, d),
    onSuccess: (res) => {
      toast.success(res.data.message)
      onSuccess()
      onClose()
      setForm({ name: '', phone: '', email: '', notes: '' })
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to add member'),
  })
  return (
    <Modal open={open} onClose={onClose} title="Add Member">
      <div className="space-y-4">
        <Input label="Full Name *" placeholder="Emeka Nwachukwu" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
        <Input label="Phone" placeholder="+234 800 000 0000" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} />
        <Input label="Email" type="email" placeholder="member@example.com" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
        <Input label="Notes" placeholder="Any notes about this member" value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={mutation.isPending} onClick={() => mutation.mutate(form)}>
            Add Member
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Record Payment Modal ───────────────────────────────────────────────────
function RecordPaymentModal({ open, onClose, group, onSuccess }) {
  const [form, setForm] = useState({ memberId: '', amount: group?.contributionAmount || '', method: 'cash', reference: '', type: 'contribution' })

  const mutation = useMutation({
    mutationFn: (d) => paymentsAPI.record({ ...d, groupId: group._id, cycle: group.currentCycle }),
    onSuccess: (res) => {
      toast.success(res.data.message)
      onSuccess()
      onClose()
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to record payment'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Record Payment">
      <div className="space-y-4">
        <Select label="Member *" value={form.memberId} onChange={e => setForm(p => ({...p, memberId: e.target.value}))}>
          <option value="">— Select member —</option>
          {group?.members?.sort((a,b) => a.turnOrder - b.turnOrder).map(m => (
            <option key={m._id} value={m._id}>
              {m.name} {m.hasPaid ? '✓ paid' : '· unpaid'}
            </option>
          ))}
        </Select>
        <Select label="Payment Type" value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}>
          <option value="contribution">Contribution (Cycle {group?.currentCycle})</option>
          <option value="adjustment">Adjustment (catch-up)</option>
        </Select>
        <Input
          label="Amount"
          type="number"
          value={form.amount}
          onChange={e => setForm(p => ({...p, amount: e.target.value}))}
        />
        <Select label="Method" value={form.method} onChange={e => setForm(p => ({...p, method: e.target.value}))}>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="other">Other</option>
        </Select>
        <Input
          label="Reference (optional)"
          placeholder="Bank ref, receipt number..."
          value={form.reference}
          onChange={e => setForm(p => ({...p, reference: e.target.value}))}
        />
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            loading={mutation.isPending}
            disabled={!form.memberId || !form.amount}
            onClick={() => mutation.mutate(form)}
          >
            Record Payment
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function GroupDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [showAddMember, setShowAddMember] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [activeTab, setActiveTab] = useState('members')

  const { data, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsAPI.get(id).then(r => r.data),
  })

  const { data: paymentsData } = useQuery({
    queryKey: ['payments', id],
    queryFn: () => paymentsAPI.listForGroup(id).then(r => r.data),
    enabled: !!id,
  })

  const refetch = () => queryClient.invalidateQueries(['group', id])

  const startMutation = useMutation({
    mutationFn: () => groupsAPI.start(id),
    onSuccess: () => { toast.success('Group started! Turn order is locked.'); refetch() },
    onError: (e) => toast.error(e.response?.data?.message),
  })

  const advanceMutation = useMutation({
    mutationFn: () => groupsAPI.advanceCycle(id),
    onSuccess: (res) => { toast.success(res.data.message); refetch() },
    onError: (e) => toast.error(e.response?.data?.message),
  })

  const shuffleMutation = useMutation({
    mutationFn: () => groupsAPI.shuffleTurns(id),
    onSuccess: () => { toast.success('Turns shuffled!'); refetch() },
    onError: (e) => toast.error(e.response?.data?.message),
  })

  const remindMutation = useMutation({
    mutationFn: (memberId) => notificationsAPI.remind({ groupId: id, memberId }),
    onSuccess: (res) => toast.success(res.data.message),
    onError: (e) => toast.error(e.response?.data?.message),
  })

  const markAdjMutation = useMutation({
    mutationFn: (memberId) => membersAPI.markAdjustmentPaid(id, memberId),
    onSuccess: () => { toast.success('Adjustment marked as paid'); refetch() },
    onError: (e) => toast.error(e.response?.data?.message),
  })

  const removeMutation = useMutation({
    mutationFn: (memberId) => membersAPI.remove(id, memberId),
    onSuccess: (res) => { toast.success(res.data.message); refetch() },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to remove member'),
  })

  if (isLoading) return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  const { group, summary } = data || {}
  if (!group) return null

  const members = [...(group.members || [])].sort((a, b) => a.turnOrder - b.turnOrder)
  const payments = paymentsData?.payments || []
  const collector = members.find(m => m.turnOrder === group.currentCycle)
  const nextCollector = members.find(m => m.turnOrder === group.currentCycle + 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fadeUp">
        <Link to="/groups" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gold transition-colors font-body mb-3">
          <ArrowLeft size={14} /> All groups
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display font-extrabold text-3xl tracking-tight">{group.name}</h1>
              <Badge variant={group.status === 'active' ? 'green' : group.status === 'completed' ? 'blue' : 'default'}>
                {group.status}
              </Badge>
            </div>
            <p className="text-sm text-muted font-body">
              {freqLabel(group.frequency)} · {formatCurrency(group.contributionAmount, group.currency)} per member · {members.length}/{group.totalMembers} members
            </p>
          </div>
          <div className="flex gap-2">
            {group.status === 'draft' && (
              <>
                <Button variant="outline" size="sm" onClick={() => shuffleMutation.mutate()} loading={shuffleMutation.isPending}>
                  <Shuffle size={13} />Shuffle
                </Button>
                <Button size="sm" onClick={() => startMutation.mutate()} loading={startMutation.isPending}>
                  <Play size={13} />Start Group
                </Button>
              </>
            )}
            {group.status === 'active' && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowPayment(true)}>
                  <CreditCard size={13} />Record Payment
                </Button>
                <Button size="sm" onClick={() => advanceMutation.mutate()} loading={advanceMutation.isPending}>
                  <RotateCcw size={13} />Next Cycle
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowAddMember(true)}>
              <UserPlus size={13} />Add Member
            </Button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3 stagger">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted font-body mb-1">Pot Total</p>
          <p className="font-display font-bold text-xl text-gold">{formatCurrency(group.potTotal, group.currency)}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted font-body mb-1">Cycle</p>
          <p className="font-display font-bold text-xl">{group.currentCycle}<span className="text-muted text-sm font-body font-normal">/{group.totalMembers}</span></p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted font-body mb-1">Paid This Cycle</p>
          <p className="font-display font-bold text-xl text-success">{members.filter(m => m.hasPaid).length}<span className="text-muted text-sm font-body font-normal">/{members.length}</span></p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted font-body mb-1">Collecting Now</p>
          <p className="font-display font-bold text-sm text-gold truncate">{collector?.name || '—'}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted font-body mb-1">Next Up</p>
          <p className="font-display font-bold text-sm text-muted truncate">{nextCollector?.name || '—'}</p>
        </div>
      </div>

      {/* Cycle progress bar */}
      {group.status === 'active' && (
        <div className="animate-fadeUp">
          <div className="flex justify-between text-xs text-muted font-body mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(((group.currentCycle - 1) / group.totalMembers) * 100)}% complete</span>
          </div>
          <div className="h-2 bg-surface2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all duration-700"
              style={{ width: `${((group.currentCycle - 1) / group.totalMembers) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted font-body mt-1">
            <span>Started {formatDate(group.startDate)}</span>
            <span>Ends {formatDate(group.endDate)}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-surface2 rounded-xl p-1 w-fit">
        {['members', 'payments'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-body font-medium transition-all ${
              activeTab === tab
                ? 'bg-surface text-text shadow'
                : 'text-muted hover:text-text'
            }`}
          >
            {tab === 'members' ? `Members (${members.length})` : `Payments (${payments.length})`}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <Card className="animate-fadeUp">
          {members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No members yet"
              description="Add members to your group."
              action={<Button size="sm" onClick={() => setShowAddMember(true)}><UserPlus size={13} />Add Member</Button>}
            />
          ) : (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-12 px-5 py-2.5 border-b border-border text-[10px] uppercase tracking-widest text-muted font-body">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Member</div>
                <div className="col-span-2">Phone</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Collected</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {members.map((member, i) => {
                const isCurrentCollector = member.turnOrder === group.currentCycle
                const isPastCollector = member.turnOrder < group.currentCycle
                return (
                  <div
                    key={member._id}
                    className={`grid grid-cols-12 px-5 py-3.5 border-b border-border last:border-0 items-center transition-colors hover:bg-surface2/40 ${
                      isCurrentCollector ? 'bg-gold/5' : ''
                    }`}
                  >
                    {/* Turn # */}
                    <div className="col-span-1">
                      <span className={`text-sm font-display font-bold ${
                        isCurrentCollector ? 'text-gold' : isPastCollector ? 'text-muted' : 'text-text'
                      }`}>
                        {member.turnOrder}
                      </span>
                    </div>

                    {/* Name */}
                    <div className="col-span-3 flex items-center gap-2.5">
                      <Avatar name={member.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate font-body">{member.name}</p>
                        {isCurrentCollector && (
                          <p className="text-[10px] text-gold font-body">Collecting now</p>
                        )}
                        {member.joinedMidCycle && (
                          <p className="text-[10px] text-muted font-body">Mid-cycle joiner</p>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="col-span-2 text-xs text-muted font-body truncate">
                      {member.phone || '—'}
                    </div>

                    {/* Paid status */}
                    <div className="col-span-2">
                      {member.hasPaid ? (
                        <span className="inline-flex items-center gap-1 text-xs text-success font-body">
                          <CheckCircle2 size={12} /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-danger font-body">
                          <XCircle size={12} /> Unpaid
                        </span>
                      )}
                      {member.joinedMidCycle && !member.adjustmentPaid && (
                        <p className="text-[10px] text-gold font-body mt-0.5">
                          +{formatCurrency(member.adjustmentOwed, group.currency)} adj.
                        </p>
                      )}
                    </div>

                    {/* Collected */}
                    <div className="col-span-2">
                      {member.hasCollected ? (
                        <span className="inline-flex items-center gap-1 text-xs text-info font-body">
                          <CheckCircle2 size={12} /> Collected
                        </span>
                      ) : isCurrentCollector ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gold font-body">
                          <TrendingUp size={12} /> Current
                        </span>
                      ) : (
                        <span className="text-xs text-muted font-body">Pending</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex justify-end gap-1.5">
                      {!member.hasPaid && group.status === 'active' && member.email && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Send reminder"
                          onClick={() => remindMutation.mutate(member._id)}
                          loading={remindMutation.isPending}
                        >
                          <Bell size={13} />
                        </Button>
                      )}
                      {member.joinedMidCycle && !member.adjustmentPaid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] text-gold hover:bg-gold/10"
                          onClick={() => markAdjMutation.mutate(member._id)}
                        >
                          Mark adj. paid
                        </Button>
                      )}
                      {group.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Remove member"
                          onClick={() => {
                            if (window.confirm(`Remove ${member.name} from group?`)) {
                              removeMutation.mutate(member._id)
                            }
                          }}
                          loading={removeMutation.isPending}
                        >
                          <XCircle size={13} />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <Card className="animate-fadeUp">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <Button size="sm" onClick={() => setShowPayment(true)}>
              <Plus size={13} />Record Payment
            </Button>
          </CardHeader>
          {payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments yet"
              description="Record contributions as members pay."
              action={<Button size="sm" onClick={() => setShowPayment(true)}><Plus size={13} />Record Payment</Button>}
            />
          ) : (
            <div>
              <div className="grid grid-cols-12 px-5 py-2.5 border-b border-border text-[10px] uppercase tracking-widest text-muted font-body">
                <div className="col-span-3">Member</div>
                <div className="col-span-2">Cycle</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Method</div>
                <div className="col-span-1">Date</div>
              </div>
              {payments.map(p => (
                <div key={p._id} className="grid grid-cols-12 px-5 py-3 border-b border-border last:border-0 items-center text-sm font-body hover:bg-surface2/40 transition-colors">
                  <div className="col-span-3 font-medium text-text">{p.memberName}</div>
                  <div className="col-span-2 text-muted">Cycle {p.cycle}</div>
                  <div className="col-span-2 text-success font-medium">{formatCurrency(p.amount, group.currency)}</div>
                  <div className="col-span-2">
                    <Badge variant={p.type === 'contribution' ? 'gold' : 'blue'}>
                      {p.type}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-muted capitalize">{p.method.replace('_', ' ')}</div>
                  <div className="col-span-1 text-muted text-xs">{formatDate(p.paidAt)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      <AddMemberModal
        open={showAddMember}
        onClose={() => setShowAddMember(false)}
        groupId={id}
        onSuccess={refetch}
      />
      <RecordPaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        group={group}
        onSuccess={refetch}
      />
    </div>
  )
}
