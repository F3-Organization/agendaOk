import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Plus, Loader2, Zap, Lock } from 'lucide-react';
import { useAuthStore } from '../features/auth/auth.store';
import { companyService } from '../features/company/company.service';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';

export const SelectCompanyPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const companies = useAuthStore((state) => state.companies);
  const maxCompanies = useAuthStore((state) => state.maxCompanies);
  const setCompanies = useAuthStore((state) => state.setCompanies);
  const selectCompany = useAuthStore((state) => state.selectCompany);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch companies from API to get the latest maxCompanies
    companyService.list().then(({ data }) => {
      setCompanies(data.companies, data.maxCompanies);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (companies.length === 0) {
      navigate('/create-company');
    }
  }, [companies, navigate]);

  const handleSelect = async (id: string) => {
    setLoadingId(id);
    try {
      await selectCompany(id);
      navigate('/dashboard');
    } catch (err) {
      console.error('[SelectCompanyPage] Failed to select company', err);
    } finally {
      setLoadingId(null);
    }
  };

  const canCreateMore = companies.length < maxCompanies;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-pulse-gradient flex items-center justify-center shadow-2xl shadow-primary-dim/40 mb-2">
            <Zap className="w-7 h-7 text-primary-foreground fill-current" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
            {t('company.select.title', 'Selecione sua Empresa')}
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {t('company.select.subtitle', 'Escolha a empresa que deseja acessar')}
          </p>
        </div>

        {/* Company list */}
        <div className="space-y-3">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => handleSelect(company.id)}
              disabled={loadingId !== null}
              className="w-full text-left group"
            >
              <Card
                variant="glass"
                className="p-5 border-outline-variant/50 hover:border-primary/40 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/10 group-hover:bg-surface-bright/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{company.name}</p>
                    {company.subscription && (
                      <span className={`inline-block mt-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        company.subscription.plan === 'PRO'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-surface-high text-muted-foreground'
                      }`}>
                        {company.subscription.plan}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0">
                    {loadingId === company.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                    )}
                  </div>
                </div>
              </Card>
            </button>
          ))}
        </div>

        {/* New company button */}
        {canCreateMore ? (
          <Button
            variant="ghost"
            onClick={() => navigate('/create-company')}
            disabled={loadingId !== null}
            className="w-full h-12 border border-outline-variant/50 hover:border-primary/30 hover:bg-primary/5 font-bold text-sm gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('company.select.newCompany', 'Nova Empresa')}
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-surface-high/30 text-muted-foreground/50 text-xs font-medium">
            <Lock className="w-3.5 h-3.5" />
            {t('company.select.limitReached', `Limite de ${maxCompanies} empresa(s) no plano atual`)}
          </div>
        )}
      </div>
    </div>
  );
};
