import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { groupsAPI } from '../services/api'
import { Button, Input, Select, Card, CardHeader, CardTitle, CardBody } from '../components/ui'
import { formatCurrency } from '../utils/helpers'
import { ArrowLeft, Calculator } from 'lucide-react'
import { useWatch } from 'react-hook-form'

const schema = z.object({
  name:               z.string().min(2, 'Name is required'),
  description:        z.string().optional(),
  contributionAmount: z.coerce.number().positive('Must be a positive amount'),
  currency:           z.string().default('NGN'),
  frequency:          z.enum(['weekly', 'biweekly', 'monthly']),
  totalMembers:       z.coerce.number().int().min(2, 'Minimum 2 members').max(100),
  startDate:          z.string().min(1, 'Start date is required'),
})

export default function CreateGroup() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { register, handleSubmit, control, formState: { errors }, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: 'NGN', frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
    },
  })

  const watchedAmount = watch('contributionAmount') || 0
  const watchedMembers = watch('totalMembers') || 0
  const potTotal = watchedAmount * watchedMembers

  const mutation = useMutation({
    mutationFn: (data) => groupsAPI.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['groups'])
      toast.success('Group created! Add members next.')
      navigate(`/groups/${res.data.group._id}`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create group'),
  })

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div className="animate-fadeUp">
        <Link to="/groups" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-gold transition-colors font-body mb-4">
          <ArrowLeft size={14} /> Back to groups
        </Link>
        <h1 className="font-display font-extrabold text-3xl tracking-tight">Create Group</h1>
        <p className="text-sm text-muted font-body mt-1">Set up your new Ajo savings circle</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5 animate-fadeUp">
        <Card>
          <CardHeader><CardTitle>Group Details</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Group Name"
              placeholder="e.g. Lagos Friends Ajo 2025"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Description (optional)"
              placeholder="Brief description of the group"
              error={errors.description?.message}
              {...register('description')}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contribution Settings</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select label="Currency" error={errors.currency?.message} {...register('currency')}>
                <option value="NGN">NGN — ₦ Naira</option>
                <option value="GBP">GBP — £ Pound</option>
                <option value="USD">USD — $ Dollar</option>
                <option value="EUR">EUR — € Euro</option>
                <option value="GHS">GHS — ₵ Cedi</option>
                <option value="KES">KES — KSh Shilling</option>
              </Select>
              <Select label="Frequency" error={errors.frequency?.message} {...register('frequency')}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Contribution Amount"
                type="number"
                placeholder="50000"
                error={errors.contributionAmount?.message}
                {...register('contributionAmount')}
              />
              <Input
                label="Number of Members"
                type="number"
                placeholder="12"
                min={2}
                max={100}
                error={errors.totalMembers?.message}
                {...register('totalMembers')}
              />
            </div>
            <Input
              label="Start Date"
              type="date"
              error={errors.startDate?.message}
              {...register('startDate')}
            />

            {/* Live calc preview */}
            {potTotal > 0 && (
              <div className="bg-gold/5 border border-gold/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator size={13} className="text-gold" />
                  <span className="text-xs uppercase tracking-widest text-gold font-body font-medium">
                    Auto Calculation
                  </span>
                </div>
                <div className="space-y-2 text-sm font-body">
                  <div className="flex justify-between">
                    <span className="text-muted">Contribution × Members</span>
                    <span className="text-text">{formatCurrency(watchedAmount, watch('currency'))} × {watchedMembers}</span>
                  </div>
                  <div className="flex justify-between border-t border-gold/10 pt-2">
                    <span className="text-muted font-medium">Each member receives</span>
                    <span className="text-gold font-display font-bold text-base">
                      {formatCurrency(potTotal, watch('currency'))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <div className="flex gap-3 pb-8">
          <Link to="/groups" className="flex-1">
            <Button variant="outline" className="w-full">Cancel</Button>
          </Link>
          <Button
            type="submit"
            loading={mutation.isPending}
            className="flex-1"
          >
            Create Group
          </Button>
        </div>
      </form>
    </div>
  )
}
