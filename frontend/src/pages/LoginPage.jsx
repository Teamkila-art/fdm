import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../store/authStore';

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email requis.' })
    .min(1, 'Email requis.')
    .email('Adresse email invalide.'),
  password: z.string({ required_error: 'Mot de passe requis.' }).min(1, 'Mot de passe requis.'),
});

const roleRedirectMap = {
  gestionnaire_magasin: '/gestionnaire/dashboard',
  service_financiere: '/financiere/marches',
  chef_service: '/chef/demandes',
  fournisseur: '/fournisseur/marches',
  admin: '/admin/utilisateurs',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const cardStyle = useMemo(
    () => ({
      width: '100%',
      maxWidth: 420,
      background: '#ffffff',
      borderRadius: 16,
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)',
      padding: 32,
    }),
    []
  );

  const onSubmit = async (values) => {
    setAuthError('');
    try {
      await login(values.email, values.password);
      const user = useAuthStore.getState().user;
      const role = user?.id_role?.nom_role || user?.role;
      navigate(roleRedirectMap[role] || '/login', { replace: true });
    } catch (error) {
      if (error?.response?.status === 401) {
        setAuthError('Identifiants invalides. Veuillez réessayer.');
        return;
      }
      setAuthError('Une erreur est survenue. Veuillez réessayer plus tard.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: 16,
      }}
    >
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img
            src="/logo.png"
            alt="Logo FMPDF"
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 16px',
              display: 'block',
              objectFit: 'contain',
            }}
          />
          <h1 style={{ margin: 0, fontSize: 24, color: '#0f172a', fontWeight: 700 }}>FMPDF</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#334155' }}>
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              placeholder="nom@universite.sn"
              {...register('email')}
              style={{
                width: '100%',
                border: `1px solid ${errors.email ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 14,
                outline: 'none',
                background: '#f8fafc',
              }}
            />
            {errors.email && (
              <p style={{ margin: '6px 0 0', color: '#ef4444', fontSize: 12 }}>{errors.email.message}</p>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#334155' }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                style={{
                  width: '100%',
                  border: `1px solid ${errors.password ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: 10,
                  padding: '12px 40px 12px 14px',
                  fontSize: 14,
                  outline: 'none',
                  background: '#f8fafc',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p style={{ margin: '6px 0 0', color: '#ef4444', fontSize: 12 }}>{errors.password.message}</p>
            )}
          </div>

          {authError && (
            <div
              style={{
                marginBottom: 16,
                background: '#fee2e2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 13,
              }}
            >
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#ffffff',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 15,
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.8 : 1,
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              marginTop: 4,
            }}
          >
            {isSubmitting ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
