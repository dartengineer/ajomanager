import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button, Input } from '../components/ui'
import useAuthStore from '../store/authStore'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const navigate = useNavigate()
  const { login, loading } = useAuthStore()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    const result = await login(data)
    if (result.success) {
      toast.success('Welcome back!')
      navigate('/dashboard')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      {/* Background texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative animate-fadeUp">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-display font-extrabold text-3xl tracking-tight mb-1">
            <span className="text-gold">Ajo</span><span className="text-text">Manager</span>
          </div>
          <p className="text-sm text-muted font-body">Sign in to your account</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2"
              size="lg"
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-muted mt-5 font-body">
            Don't have an account?{' '}
            <Link to="/register" className="text-gold hover:text-gold-light transition-colors">
              Create one
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted mt-4 font-body">
          Ajo Manager — Savings Circle Platform
        </p>
      </div>
    </div>
  )
}
