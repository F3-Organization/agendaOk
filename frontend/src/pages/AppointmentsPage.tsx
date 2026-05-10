import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  User,
  Phone,
  Loader2,
  RefreshCw,
  Edit2,
  Trash2,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PageLayout } from '../shared/ui/PageLayout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { calendarService, type Appointment } from '../features/calendar/calendar.service';
import { NewAppointmentModal } from '../features/calendar/components/NewAppointmentModal';
import { AppointmentDetailsModal } from '../features/calendar/components/AppointmentDetailsModal';

const ITEMS_PER_PAGE = 10;

export const AppointmentsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsAppointment, setDetailsAppointment] = useState<Appointment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: appointments, isLoading, isError } = useQuery({
    queryKey: ['appointments'],
    queryFn: calendarService.getAppointments,
  });

  const syncMutation = useMutation({
    mutationFn: calendarService.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: calendarService.acceptInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: calendarService.deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setDeleteId(null);
    },
  });

  const filteredAppointments = useMemo(() => {
    if (!appointments) return [];

    return appointments.filter(apt => {
      const matchesSearch =
        (apt.clientName || apt.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (apt.clientPhone || '').includes(searchTerm);

      const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAppointments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAppointments, currentPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!appointments) return { total: 0, confirmed: 0, pending: 0, cancelled: 0 };
    return {
      total: appointments.length,
      confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
      pending: appointments.filter(a => a.status === 'PENDING').length,
      cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
    };
  }, [appointments]);

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
    }
  };

  const statCards = [
    {
      label: t('dashboard.stats.confirmations', 'Total'),
      value: stats.total,
      icon: CalendarDays,
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20',
    },
    {
      label: t('common.confirmed', 'Confirmados'),
      value: stats.confirmed,
      icon: CheckCircle2,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
    },
    {
      label: t('common.pending', 'Pendentes'),
      value: stats.pending,
      icon: AlertCircle,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
    },
    {
      label: t('common.cancelled', 'Cancelados'),
      value: stats.cancelled,
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
  ];

  return (
    <PageLayout
      title={t('common.appointments')}
      subtitle={t('appointments.subtitle', 'Visualize e gerencie todos os seus agendamentos em um só lugar.')}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <Card key={i} variant="glass" className="p-5 group hover:scale-[1.02] transition-all cursor-default">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tighter">{stat.value}</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Main Table Card */}
      <Card variant="base" className="min-w-0 overflow-hidden bg-surface-dim/30">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-outline-variant/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">{t('common.appointments')}</h2>
            <span className="text-xs font-bold text-muted-foreground bg-surface-high px-2 py-0.5 rounded-full">
              {filteredAppointments.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              className="gap-2 border border-outline-variant/30"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {t('dashboard.syncCalendar.connectedButton', 'Sincronizar')}
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={() => { setSelectedAppointment(null); setIsModalOpen(true); }}
            >
              <Plus className="w-4 h-4" />
              {t('dashboard.newAppointment.button')}
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 sm:px-8 py-4 bg-surface-high/20 border-b border-outline-variant/10 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full sm:w-auto sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('dashboard.filters.search')}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-low border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <select
              className="w-full pl-9 pr-4 py-2.5 bg-surface-low border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">{t('dashboard.filters.status')}</option>
              <option value="CONFIRMED">{t('dashboard.filters.confirmed')}</option>
              <option value="PENDING">{t('dashboard.filters.pending')}</option>
              <option value="CANCELLED">{t('dashboard.filters.cancelled')}</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Table */}
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
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-surface-high/50 border-b border-outline-variant/20">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('dashboard.table.patient')}</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('dashboard.table.schedule')}</th>
                  <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('dashboard.table.status')}</th>
                  <th className="px-8 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {paginatedAppointments.map((apt: Appointment) => (
                  <tr
                    key={apt.id}
                    className="group hover:bg-surface-high/30 transition-all cursor-pointer"
                    onClick={() => setDetailsAppointment(apt)}
                  >
                    <td className="px-8 py-5">
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
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          {new Date(apt.startAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(apt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' — '}
                          {new Date(apt.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col items-start gap-2">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide border
                          ${apt.status === 'CONFIRMED' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                            apt.status === 'PENDING' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                            'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${apt.status === 'CONFIRMED' ? 'bg-green-400' : apt.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-400'}`} />
                          {t(`common.${apt.status.toLowerCase()}`)}
                        </div>

                        {apt.status === 'PENDING' && apt.isOwner === false && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[10px] py-0 h-6 border border-green-500/30 text-green-500 hover:bg-green-500/20"
                            onClick={(e) => { e.stopPropagation(); acceptMutation.mutate(apt.id); }}
                            disabled={acceptMutation.isPending}
                          >
                            {acceptMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Aceitar'}
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {apt.isOwner !== false && (
                          <>
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
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(filteredAppointments.length === 0) && !isLoading && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-muted-foreground">
                        <div className="w-16 h-16 rounded-2xl bg-surface-high/50 flex items-center justify-center border border-outline-variant/30">
                          <CalendarDays className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium">
                          {searchTerm || statusFilter !== 'ALL'
                            ? t('appointments.noResults', 'Nenhum agendamento corresponde aos filtros.')
                            : t('dashboard.noAppointments')}
                        </p>
                        {!searchTerm && statusFilter === 'ALL' && (
                          <Button
                            size="sm"
                            onClick={() => { setSelectedAppointment(null); setIsModalOpen(true); }}
                            className="gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            {t('dashboard.newAppointment.button')}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-8 py-4 border-t border-outline-variant/20 flex items-center justify-between bg-surface-high/20">
            <p className="text-xs text-muted-foreground font-medium">
              {t('appointments.showing', 'Mostrando')} {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredAppointments.length)} {t('appointments.of', 'de')} {filteredAppointments.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-surface-high transition-colors text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    page === currentPage
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'hover:bg-surface-high text-muted-foreground'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-surface-high transition-colors text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
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

      {/* Delete Confirmation Modal */}
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
