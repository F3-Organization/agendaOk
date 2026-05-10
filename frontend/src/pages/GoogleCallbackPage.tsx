import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../features/auth/auth.store';
import { authService } from '../features/auth/auth.service';
import { Zap } from 'lucide-react';

export const GoogleCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setCompanies = useAuthStore((state) => state.setCompanies);
  const isExchanging = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');

    if (code && !isExchanging.current) {
      isExchanging.current = true;
      console.log('[GoogleCallbackPage] Starting code exchange...', code.substring(0, 10) + '...');

      authService.exchangeCode(code)
        .then((data) => {
          console.log('[GoogleCallbackPage] Exchange successful', data.status);
          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'GOOGLE_AUTH_SUCCESS',
                payload: {
                  user: data.user,
                  token: data.token,
                  status: data.status,
                  tempToken: data.tempToken,
                  companies: data.companies,
                }
              },
              window.location.origin
            );
            window.close();
          } else {
            if (data.status === '2FA_REQUIRED' || !data.token) {
              navigate('/auth/2fa', { state: { tempToken: data.tempToken } });
              return;
            }
            setAuth(data.user!, data.token!);
            navigate('/select-company');
          }
        })
        .catch((err) => {
          console.error('[GoogleCallbackPage] Authentication failed', err);
          isExchanging.current = false;

          if (window.opener) {
            window.close();
          } else {
            navigate('/login');
          }
        });
    } else if (!code) {
      if (window.opener) {
        window.close();
      } else {
        navigate('/login');
      }
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
