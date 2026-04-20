import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, ArrowLeft, Loader2, Zap } from 'lucide-react';
import { useAuthStore } from '../features/auth/auth.store';
import { companyService } from '../features/company/company.service';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';

export const CreateCompanyPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const companies = useAuthStore((state) => state.companies);
  const addCompany = useAuthStore((state) => state.addCompany);
  const selectCompany = useAuthStore((state) => state.selectCompany);

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError(t('company.create.nameMinLength', 'O nome deve ter pelo menos 2 caracteres'));
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data: company } = await companyService.create(trimmed);
      addCompany(company);
      await selectCompany(company.id);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || t('company.create.error', 'Erro ao criar empresa. Tente novamente.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-pulse-gradient flex items-center justify-center shadow-2xl shadow-primary-dim/40 mb-2">
            <Zap className="w-7 h-7 text-primary-foreground fill-current" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
            {t('company.create.title', 'Criar Empresa')}
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {t('company.create.subtitle', 'Crie sua empresa para começar a usar o ConfirmaZap')}
          </p>
        </div>

        {/* Form */}
        <Card variant="glass" className="p-8 border-outline-variant/50">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-1">
                {t('company.create.nameLabel', 'Nome da Empresa')}
              </label>
              <div className="relative group/input">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/input:text-primary transition-colors" />
                <Input
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-12 h-12 bg-black/40 border-white/5 focus:bg-black/60 focus:border-primary/30 transition-all rounded-lg font-medium"
                  placeholder={t('company.create.namePlaceholder', 'Ex: Clínica Dr. Silva')}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || name.trim().length < 2}
              className="w-full h-12 text-sm font-bold tracking-wide uppercase gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('company.create.submitButton', 'Criar Empresa')
              )}
            </Button>
          </form>
        </Card>

        {/* Back button — only shown when user already has companies */}
        {companies.length > 0 && (
          <button
            onClick={() => navigate('/select-company')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('company.create.back', 'Voltar para seleção de empresa')}
          </button>
        )}
      </div>
    </div>
  );
};
