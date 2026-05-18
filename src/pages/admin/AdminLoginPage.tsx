import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '@/components/ui/Icon'
import { isApiConfiguredForProduction } from '@/config/apiBaseUrl'
import { authService } from '@/services/authService'

const schema = z.object({
  email: z.string().email('Courriel invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type Values = z.infer<typeof schema>

export function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl p-8 shadow-card-float border border-outline-variant/15">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
            <Icon name="admin_panel_settings" />
          </div>
          <div>
            <p className="font-headline font-bold tracking-tight text-xl">Connexion administrateur</p>
            <p className="text-sm text-on-surface-variant">Ingenious City</p>
          </div>
        </div>

        {!isApiConfiguredForProduction() ? (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            Déploiement : définissez <code className="text-xs">VITE_API_BASE_URL</code> sur Render (URL du backend +{' '}
            <code className="text-xs">/api</code>), puis redéployez.
          </p>
        ) : null}

        <form
          className="space-y-6"
          onSubmit={handleSubmit(async (values) => {
            try {
              await authService.login(values.email, values.password)
              navigate(from, { replace: true })
            } catch (e) {
              setError('root', { message: e instanceof Error ? e.message : 'Erreur' })
            }
          })}
        >
          <div className="group">
            <label className="block font-label text-[10px] font-medium tracking-wider uppercase text-outline mb-2">
              Identifiant ou courriel
            </label>
            <input
              className="w-full bg-surface-container-low border-b border-outline-variant/40 py-3 px-4 focus:outline-none focus:border-primary border-t-0 border-x-0 transition-all font-body text-on-surface placeholder:text-outline/50"
              placeholder="admin@ingenious.city"
              type="email"
              {...register('email')}
            />
            {errors.email && <p className="mt-2 text-xs text-error">{errors.email.message}</p>}
          </div>

          <div className="group">
            <label className="block font-label text-[10px] font-medium tracking-wider uppercase text-outline mb-2">
              Mot de passe
            </label>
            <input
              className="w-full bg-surface-container-low border-b border-outline-variant/40 py-3 px-4 focus:outline-none focus:border-primary border-t-0 border-x-0 transition-all font-body text-on-surface placeholder:text-outline/50"
              placeholder="••••••••"
              type="password"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-2 text-xs text-error">{errors.password.message}</p>
            )}
          </div>

          {errors.root && <p className="text-sm text-error">{errors.root.message}</p>}

          <button
            className="w-full py-4 rounded-lg bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold shadow-lg active:scale-[0.98] transition-transform disabled:opacity-70"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </button>

          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest text-center">
            Accès réservé aux administrateurs
          </p>
        </form>
      </div>
    </div>
  )
}

