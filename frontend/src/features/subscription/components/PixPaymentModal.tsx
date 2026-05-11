import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Copy, Loader2, QrCode, Timer } from 'lucide-react';
import { Modal } from '../../../shared/ui/Modal';
import { Button } from '../../../shared/ui/Button';
import { formatCurrency } from '../../../shared/utils/formatters';
import type { PixPaymentResponse } from '../subscription.service';

interface PixPaymentModalProps {
  pix: PixPaymentResponse;
  onClose: () => void;
  onPaid: () => void;
  onCheckStatus: (id: string) => Promise<{ status: string }>;
}

const POLL_INTERVAL_MS = 5000;
const EXPIRE_MINUTES = 30;

export const PixPaymentModal = ({ pix, onClose, onPaid, onCheckStatus }: PixPaymentModalProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(EXPIRE_MINUTES * 60);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pix.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Countdown timer
  useEffect(() => {
    if (paid) return;
    const tick = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(tick);
  }, [paid]);

  // Poll for payment status
  useEffect(() => {
    if (paid) return;
    const poll = setInterval(async () => {
      try {
        const result = await onCheckStatus(pix.id);
        if (result.status === 'PAID' || result.status === 'COMPLETED') {
          setPaid(true);
          clearInterval(poll);
          setTimeout(() => onPaid(), 2500);
        }
      } catch {
        // ignore transient errors
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(poll);
  }, [pix.id, paid, onCheckStatus, onPaid]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <Modal onClose={paid ? undefined : onClose} maxWidth="max-w-sm">
      <div className="p-6 border-b border-outline-variant/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
          <QrCode className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <h2 className="text-base font-bold">{t('subscription.pix.title')}</h2>
          <p className="text-xs text-muted-foreground">{pix.planName} · {formatCurrency(pix.amount)}</p>
        </div>
      </div>

      <div className="p-6 flex flex-col items-center gap-5">
        {paid ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-9 h-9 text-green-500" />
            </div>
            <p className="text-lg font-bold text-green-500">{t('subscription.pix.paid')}</p>
            <p className="text-xs text-muted-foreground text-center">{t('subscription.pix.paidDescription')}</p>
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mt-1" />
          </div>
        ) : (
          <>
            {/* QR Code */}
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-outline-variant/10">
              <img
                src={`data:image/png;base64,${pix.brCodeBase64}`}
                alt="PIX QR Code"
                className="w-44 h-44 block"
              />
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 text-sm">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <span className={`font-mono font-bold tabular-nums ${secondsLeft < 120 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {mins}:{secs}
              </span>
            </div>

            {/* Copy & Paste */}
            <div className="w-full">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {t('subscription.pix.copyLabel')}
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={pix.brCode}
                  className="flex-1 text-xs bg-surface-low border border-outline-variant/20 rounded-lg px-3 py-2 font-mono text-muted-foreground truncate"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className={`shrink-0 gap-1.5 ${copied ? 'text-green-500' : ''}`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? t('subscription.pix.copied') : t('subscription.pix.copy')}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {t('subscription.pix.instructions')}
            </p>
          </>
        )}
      </div>

      {!paid && (
        <div className="p-4 border-t border-outline-variant/30 flex justify-end">
          <Button variant="ghost" onClick={onClose}>{t('common.close')}</Button>
        </div>
      )}
    </Modal>
  );
};
