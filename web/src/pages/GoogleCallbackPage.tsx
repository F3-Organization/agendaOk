import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../features/auth/auth.store';
import { authService } from '../features/auth/auth.service';
import { Zap } from 'lucide-react';

export const GoogleCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      authService.exchangeCode(code)
        .then((data) => {
          setAuth(data.user, data.token);
          navigate('/dashboard');
        })
        .catch((err) => {
          console.error('Authentication failed', err);
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen bg-surface-dim flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-pulse-gradient flex items-center justify-center shadow-2xl shadow-primary-dim/40 mb-8 animate-bounce">
        <Zap className="w-8 h-8 text-primary-foreground fill-current" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Authenticating...</h1>
      <p className="text-muted-foreground animate-pulse">Please wait while we set up your session.</p>
    </div>
  );
};
