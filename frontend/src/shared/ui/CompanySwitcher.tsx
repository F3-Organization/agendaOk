import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronsUpDown, Check, Plus, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../features/auth/auth.store';
import { cn } from '../utils/cn';


export const CompanySwitcher = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const companies = useAuthStore((state) => state.companies);
  const maxCompanies = useAuthStore((state) => state.maxCompanies);
  const selectedCompany = useAuthStore((state) => state.selectedCompany);
  const selectCompany = useAuthStore((state) => state.selectCompany);
  const isProfessional = user?.role === 'PROFESSIONAL';

  const [isOpen, setIsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCompany = async (id: string) => {
    if (id === selectedCompany?.id) {
      setIsOpen(false);
      return;
    }
    setLoadingId(id);
    try {
      await selectCompany(id);
      setIsOpen(false);
      navigate(isProfessional ? '/appointments' : '/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  if (!selectedCompany) return null;

  const initials = selectedCompany.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 text-left group',
          'hover:bg-surface-container',
          isOpen && 'bg-surface-container'
        )}
      >
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-primary/90">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold truncate text-foreground/90">{selectedCompany.name}</p>
        </div>
        <ChevronsUpDown className={cn(
          'w-3.5 h-3.5 text-muted-foreground/50 shrink-0 transition-colors',
          'group-hover:text-muted-foreground/80'
        )} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 z-50 rounded-lg border border-outline-variant/25 bg-surface shadow-card-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
          <div className="px-2 pt-1.5 pb-1">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
              {t('company.switcher.label', 'Empresas')}
            </p>
          </div>

          <div className="px-1.5 pb-1 space-y-px">
            {companies.map((company) => {
              const isSelected = company.id === selectedCompany.id;
              const companyInitials = company.name
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0])
                .join('')
                .toUpperCase();

              return (
                <button
                  key={company.id}
                  onClick={() => handleSelectCompany(company.id)}
                  disabled={loadingId !== null}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-all duration-150',
                    isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-surface-container hover:text-foreground'
                  )}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[9px] font-bold border',
                    isSelected
                      ? 'bg-primary/15 border-primary/20 text-primary'
                      : 'bg-surface-container border-outline-variant/20 text-muted-foreground/60'
                  )}>
                    {loadingId === company.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      companyInitials
                    )}
                  </div>
                  <span className="text-[13px] font-medium truncate flex-1">{company.name}</span>
                  {isSelected && !loadingId && (
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {!isProfessional && companies.length < maxCompanies && (
            <div className="border-t border-outline-variant/20 px-1.5 py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/create-company');
                }}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] font-medium text-muted-foreground/60 hover:bg-surface-container hover:text-foreground transition-all"
              >
                <div className="w-6 h-6 rounded-md border border-dashed border-outline-variant/20 flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </div>
                {t('company.switcher.newCompany', 'Nova Empresa')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
