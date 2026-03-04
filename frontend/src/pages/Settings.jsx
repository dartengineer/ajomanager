import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import { Card, CardHeader, CardTitle, CardBody, Button, Input, Avatar } from '../components/ui'
import { User, Lock } from 'lucide-react'

export default function Settings() {
  const { user, updateUser } = useAuthStore()
  const [tab, setTab] = useState('profile')

  const profileForm = useForm({ defaultValues: { name: user?.name, phone: user?.phone } })
  const passForm = useForm()

  const profileMutation = useMutation({
    mutationFn: (d) => authAPI.updateProfile(d),
    onSuccess: (res) => { updateUser(res.data.user); toast.success('Profile updated') },
    onError: (e) => toast.error(e.response?.data?.message),
  })

  const passMutation = useMutation({
    mutationFn: (d) => authAPI.changePassword(d),
    onSuccess: () => { toast.success('Password changed'); passForm.reset() },
    onError: (e) => toast.error(e.response?.data?.message),
  })

  return (
    <div className="max-w-xl space-y-6">
      <div className="animate-fadeUp">
        <h1 className="font-display font-extrabold text-3xl tracking-tight">Settings</h1>
        <p className="text-sm text-muted font-body mt-1">Manage your account</p>
      </div>

      {/* User card */}
      <Card className="animate-fadeUp">
        <CardBody>
          <div className="flex items-center gap-4">
            <Avatar name={user?.name} size="lg" />
            <div>
              <p className="font-display font-bold text-lg">{user?.name}</p>
              <p className="text-sm text-muted font-body">{user?.email}</p>
              <p className="text-xs text-gold font-body mt-0.5 capitalize">{user?.role}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface2 rounded-xl p-1 w-fit">
        {[{ id: 'profile', label: 'Profile', icon: User }, { id: 'password', label: 'Password', icon: Lock }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-body font-medium transition-all flex items-center gap-1.5 ${
              tab === t.id ? 'bg-surface text-text shadow' : 'text-muted hover:text-text'
            }`}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <Card className="animate-fadeUp">
          <CardHeader><CardTitle>Profile Details</CardTitle></CardHeader>
          <CardBody>
            <form onSubmit={profileForm.handleSubmit(d => profileMutation.mutate(d))} className="space-y-4">
              <Input
                label="Full Name"
                error={profileForm.formState.errors.name?.message}
                {...profileForm.register('name', { required: 'Name is required' })}
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="+234 800 000 0000"
                {...profileForm.register('phone')}
              />
              <div className="pt-2">
                <Button type="submit" loading={profileMutation.isPending}>
                  Save Changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {tab === 'password' && (
        <Card className="animate-fadeUp">
          <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
          <CardBody>
            <form onSubmit={passForm.handleSubmit(d => passMutation.mutate(d))} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                {...passForm.register('currentPassword', { required: true })}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Min. 6 characters"
                {...passForm.register('newPassword', { required: true, minLength: 6 })}
              />
              <div className="pt-2">
                <Button type="submit" loading={passMutation.isPending}>
                  Update Password
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
