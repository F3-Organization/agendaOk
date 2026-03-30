import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowUpRight, 
  CheckCircle2, 
  MessageCircle, 
  Clock, 
  CalendarDays,
  User,
  Phone,
  Loader2,
  RefreshCw,
  Edit2,
  Trash2
} from 'lucide-react';
import { PageLayout } from '../shared/ui/PageLayout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { calendarService, type Appointment } from '../features/calendar/calendar.service';
import { dashboardService } from '../features/dashboard/dashboard.service';
import { NewAppointmentModal } from '../features/calendar/components/NewAppointmentModal';
import { AppointmentDetailsModal } from '../features/calendar/components/AppointmentDetailsModal';
import { Plus } from 'lucide-react';


export const DashboardPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsAppointment, setDetailsAppointment] = useState<Appointment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: appointments, isLoading, isError } = useQuery({
    queryKey: ['appointments'],
    queryFn: calendarService.getAppointments,
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  });

  const syncMutation = useMutation({
    mutationFn: calendarService.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: calendarService.deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const handleEdit = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const statsList = [
    { 
      label: t('dashboard.stats.confirmations'), 
      value: dashboardStats?.totalConfirmations.toString() || '0', 
      icon: CheckCircle2, 
      change: dashboardStats?.confirmationsChange || '+0%', 
      color: 'text-green-400' 
    },
    { 
      label: t('dashboard.stats.conversionRate'), 
      value: dashboardStats?.conversionRate || '0%', 
      icon: ArrowUpRight, 
      change: dashboardStats?.conversionRateChange || '+0%', 
      color: 'text-primary' 
    },
    { 
      label: t('dashboard.stats.replies'), 
      value: dashboardStats?.managedReplies.toString() || '0', 
      icon: MessageCircle, 
      change: dashboardStats?.repliesChange || '+0%', 
      color: 'text-secondary' 
    },


  ];


  return (
    <PageLayout 
      title={t('dashboard.title')} 
      subtitle={t('dashboard.subtitle')}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {statsList.map((stat, i) => (

          <Card key={i} variant="glass" className="p-8 group hover:scale-[1.02] transition-all cursor-default">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-xl bg-surface-low border border-outline-variant/50 flex items-center justify-center group-hover:border-primary/30 transition-colors">
                <stat.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              {stat.change && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-surface-low border border-outline-variant/30 ${stat.color}`}>
                  {stat.change}
                </span>
              )}
            </div>

            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{stat.label}</h3>
            <p className="text-4xl font-extrabold tracking-tighter">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main List */}
        <Card variant="base" className="lg:col-span-2 overflow-hidden bg-surface-dim/30">
          <div className="p-8 border-b border-outline-variant/30 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">{t('dashboard.recentAppointments')}</h2>
            </div>
            <Button size="sm" className="hidden sm:flex group justify-center gap-2" onClick={() => { setSelectedAppointment(null); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4" />
              {t('dashboard.newAppointment.button')}
            </Button>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            {isLoading ? (
              <div className="p-20 flex flex-col items-center justify-center text-muted-foreground gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-medium">{t('dashboard.loadingSchedule')}</p>
              </div>
            ) : isError ? (
              <div className="p-20 flex flex-col items-center justify-center text-red-400 gap-4">
                <p className="text-sm font-medium">{t('dashboard.failedToLoad')}</p>
                <Button variant="ghost" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['appointments'] })}>
                  {t('common.retry')}
                </Button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-high/50 border-b border-outline-variant/20">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('dashboard.table.patient')}</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('dashboard.table.schedule')}</th>
                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('dashboard.table.status')}</th>
                    <th className="px-8 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {appointments?.map((apt: Appointment) => (
                    <tr 
                      key={apt.id} 
                      className="group hover:bg-surface-high/30 transition-all cursor-pointer"
                      onClick={() => setDetailsAppointment(apt)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-surface-low flex items-center justify-center border border-outline-variant/50">
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm group-hover:text-primary transition-colors">{apt.clientName || apt.title}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 scale-90 translate-x-[-5%]">
                              <Phone className="w-3 h-3" />
                              {apt.clientPhone || 'No phone'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">
                            {new Date(apt.startAt).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(apt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide border
                          ${apt.status === 'CONFIRMED' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 
                            apt.status === 'PENDING' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' : 
                            'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${apt.status === 'CONFIRMED' ? 'bg-green-400' : apt.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-400'}`} />
                          {t(`common.${apt.status.toLowerCase()}`)}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(apt); }}
                            className="p-2 rounded-lg hover:bg-surface-high transition-colors text-muted-foreground hover:text-primary"
                            title={t('common.edit')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(apt.id); }}
                            className="p-2 rounded-lg hover:bg-surface-high transition-colors text-muted-foreground hover:text-red-500"
                            title={t('common.delete')}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(appointments?.length === 0 || !appointments) && !isLoading && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-muted-foreground text-sm italic">
                        {t('dashboard.noAppointments')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Quick Actions / Integration */}
        <div className="space-y-6">
          <Card variant="accent" className="p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-0 translate-x-1/2 -translate-y-1/2" />
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-primary-dim flex items-center justify-center mb-6 shadow-xl shadow-primary-dim/40">
                <CalendarDays className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-3">{t('dashboard.syncCalendar.title')}</h3>
              <p className="text-sm text-foreground/80 leading-relaxed mb-8">
                {t('dashboard.syncCalendar.description')}
              </p>
              <Button 
                className="w-full text-xs font-bold tracking-widest uppercase py-3 group-hover:scale-[1.02] transition-transform"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {t('dashboard.syncCalendar.button')}
              </Button>
            </div>
          </Card>

          <Card variant="base" className="p-8 bg-surface-low border-dashed border-2">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-10 h-10 rounded-full bg-surface-high flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-tight mb-1">{t('dashboard.newConnection.title')}</h4>
                <p className="text-xs text-muted-foreground">{t('dashboard.newConnection.subtitle')}</p>
              </div>
              <Button variant="ghost" size="sm" className="w-full font-bold uppercase text-[10px] tracking-widest border border-outline-variant/30">
                {t('dashboard.newConnection.button')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
      
      <NewAppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAppointment(null);
        }} 
        initialData={selectedAppointment}
      />

      <AppointmentDetailsModal
        isOpen={!!detailsAppointment}
        onClose={() => setDetailsAppointment(null)}
        appointment={detailsAppointment}
      />

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          />
          <div className="relative w-full max-w-sm bg-surface-high border border-outline-variant rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-2">Atenção</h2>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {t('dashboard.deleteConfirmation')}
              </p>
            </div>
            <div className="p-4 border-t border-outline-variant/30 flex items-center justify-end gap-3 bg-surface-low/50">
              <Button 
                variant="ghost" 
                onClick={() => setDeleteId(null)}
                disabled={deleteMutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="bg-red-500 hover:bg-red-600 text-white shadow-none min-w-[100px]"
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
