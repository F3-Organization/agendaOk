import { useTranslation } from 'react-i18next';
import { X, Calendar as CalendarIcon, Phone, User, Users, CheckCircle, XCircle, HelpCircle, Clock } from 'lucide-react';
import type { Appointment } from '../calendar.service';
import { Button } from '../../../shared/ui/Button';

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export const AppointmentDetailsModal = ({ isOpen, onClose, appointment }: AppointmentDetailsModalProps) => {
  const { t } = useTranslation();

  if (!isOpen || !appointment) return null;

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  const renderStatusIcon = (status?: string) => {
    switch(status) {
      case 'accepted': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'declined': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'tentative': return <HelpCircle className="w-4 h-4 text-amber-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch(status) {
      case 'accepted': return t('dashboard.appointmentDetails.status.accepted');
      case 'declined': return t('dashboard.appointmentDetails.status.declined');
      case 'tentative': return t('dashboard.appointmentDetails.status.tentative');
      default: return t('dashboard.appointmentDetails.status.needsAction');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-surface border border-outline-variant rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-high">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              {t('dashboard.appointmentDetails.title')}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-low text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          <div className="space-y-1">
            <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {appointment.title}
            </h3>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-2">
               <span className="flex items-center gap-2">
                 <CalendarIcon className="w-4 h-4" /> 
                 {t('dashboard.appointmentDetails.startAt')}: <strong className="text-foreground font-medium">{formatDate(appointment.startAt)}</strong>
               </span>
               <span className="flex items-center gap-2">
                 <Clock className="w-4 h-4" /> 
                 {t('dashboard.appointmentDetails.endAt')}: <strong className="text-foreground font-medium">{formatDate(appointment.endAt)}</strong>
               </span>
            </div>
          </div>

          <div className="h-px bg-outline-variant/50 w-full" />

          {/* Client Info */}
          {(appointment.clientName || appointment.clientPhone) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <User className="w-4 h-4" />
                {t('dashboard.appointmentDetails.clientName')} / {t('dashboard.appointmentDetails.clientPhone')}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {appointment.clientName && (
                  <div className="bg-surface-high p-3 rounded-xl border border-outline-variant/50">
                    <p className="text-xs text-muted-foreground mb-1">Nome</p>
                    <p className="font-medium text-sm truncate">{appointment.clientName}</p>
                  </div>
                )}
                {appointment.clientPhone && (
                  <div className="bg-surface-high p-3 rounded-xl border border-outline-variant/50 flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Telefone</p>
                      <p className="font-medium text-sm truncate">{appointment.clientPhone}</p>
                    </div>
                    <Phone className="w-4 h-4 text-emerald-500/70" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attendees */}
          {appointment.attendees && appointment.attendees.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <Users className="w-4 h-4" />
                {t('dashboard.appointmentDetails.participants')} ({appointment.attendees.length})
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {appointment.attendees.map((attendee, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-surface-low border border-outline-variant/30 hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 border border-primary/20">
                        <span className="text-xs font-bold text-primary">
                          {attendee.displayName ? attendee.displayName.charAt(0).toUpperCase() : attendee.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-foreground truncate">{attendee.displayName || attendee.email}</p>
                        {attendee.displayName && <p className="text-xs text-muted-foreground truncate">{attendee.email}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 bg-surface px-2 py-1 rounded-full border border-outline-variant/50">
                      {renderStatusIcon(attendee.responseStatus)}
                      <span className="text-xs font-medium">{getStatusLabel(attendee.responseStatus)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/30 bg-surface-high flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            {t('dashboard.appointmentDetails.close')}
          </Button>
        </div>
      </div>
    </div>
  );
};
