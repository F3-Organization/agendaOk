import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, CreditCard, MessageSquare, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Card } from '../../../shared/ui/Card';
import { useTranslation } from 'react-i18next';

interface BillingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  isLoading: boolean;
  initialData?: {
    taxId?: string;
    whatsappNumber?: string;
  };
}

export const BillingInfoModal: React.FC<BillingInfoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
  initialData
}) => {
  const { t } = useTranslation();

  const billingSchema = z.object({
    taxId: z.string()
      .min(11, t('subscription.billingModal.taxIdError'))
      .max(14, t('subscription.billingModal.taxIdError'))
      .regex(/^\d+$/, t('subscription.billingModal.taxIdNumbersOnly')),
    whatsappNumber: z.string()
      .min(10, t('subscription.billingModal.whatsappError'))
      .max(11, t('subscription.billingModal.whatsappError'))
      .regex(/^\d+$/, t('subscription.billingModal.taxIdNumbersOnly')),
  });

  type BillingFormData = z.infer<typeof billingSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BillingFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      taxId: initialData?.taxId || '',
      whatsappNumber: initialData?.whatsappNumber || '',
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-xl animate-in fade-in duration-700">
      <Card variant="glass" className="w-full max-w-xl p-8 relative shadow-[0_0_150px_rgba(0,0,0,0.9)] border-primary/30 animate-in zoom-in-95 duration-500 rounded-3xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 p-3 rounded-xl hover:bg-white/10 text-muted-foreground/40 hover:text-foreground transition-all active:scale-90"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center space-y-6 mb-8">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary mx-auto ring-1 ring-primary/30">
            <CreditCard className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-white">
              {t('subscription.billingModal.title')}
            </h3>
            <p className="text-sm text-muted-foreground/60 leading-relaxed font-medium max-w-sm mx-auto">
              {t('subscription.billingModal.description')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-8">
          <div className="space-y-5">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-1">
                {t('subscription.billingModal.taxId')}
              </label>
              <div className="relative group/input">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 group-focus-within/input:text-primary transition-colors" />
                <Input
                  {...register('taxId')}
                  placeholder={t('subscription.billingModal.taxIdPlaceholder')}
                  error={errors.taxId?.message}
                  className="pl-12 h-12 bg-black/40 border-white/5 focus:bg-black/60 focus:border-primary/30 transition-all rounded-lg font-medium text-white placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-1">
                {t('subscription.billingModal.whatsapp')}
              </label>
              <div className="relative group/input">
                <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 group-focus-within/input:text-primary transition-colors" />
                <Input
                  {...register('whatsappNumber')}
                  placeholder={t('subscription.billingModal.whatsappPlaceholder')}
                  error={errors.whatsappNumber?.message}
                  className="pl-12 h-12 bg-black/40 border-white/5 focus:bg-black/60 focus:border-primary/30 transition-all rounded-lg font-medium text-white placeholder:text-white/20"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 h-14 text-xs font-black uppercase tracking-[0.3em] border-white/10 text-white hover:bg-white/5 rounded-xl transition-all"
            >
              {t('subscription.billingModal.cancelButton')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-14 text-xs font-black uppercase tracking-[0.3em] bg-primary text-primary-dim rounded-xl shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                t('subscription.billingModal.saveButton')
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
