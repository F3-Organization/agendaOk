import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  User,
  Phone,
  Clock,
  Loader2,
  Trash2,
  Edit2,
  CalendarDays,
  Bell,
  BellOff,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { PageLayout } from '../shared/ui/PageLayout';
import { Modal } from '../shared/ui/Modal';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import { DatePicker } from '../shared/ui/DatePicker';
import { DateInput } from '../shared/ui/DateInput';
import { Select } from '../shared/ui/Select';
import { useAuthStore } from '../features/auth/auth.store';
import {
  appointmentService,
  type Appointment,
  type AppointmentInput,
  type AppointmentStatus,
} from '../features/appointment/appointment.service';
import { professionalService } from '../features/company/professional.service';
import { formatDate, formatTime, isValidPhone, isEndAfterStart, isNotInPast } from '../shared/utils/formatters';

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600',
  CONFIRMED: 'bg-green-500/10 border-green-500/20 text-green-600',
  CANCELLED: 'bg-red-500/10 border-red-500/20 text-red-500',
};
const STATUS_DOT: Record<AppointmentStatus, string> = {
  PENDING: 'bg-yellow-500',
  CONFIRMED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
};

interface FormState {
  clientName: string;
  clientPhone: string;
  title: string;
  startAt: string;
  endAt: string;
  notes: string;
  professionalId: string;
}

interface FormErrors {
  clientName?: string;
  clientPhone?: string;
  title?: string;
  startAt?: string;
  endAt?: string;
  professionalId?: string;
}

const emptyForm: FormState = {
  clientName: '',
  clientPhone: '',
  title: '',
  startAt: '',
  endAt: '',
  notes: '',
  professionalId: '',
};

export const AppointmentsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isProfessional = user?.role === 'PROFESSIONAL';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AppointmentStatus>('ALL');
  const [professionalFilter, setProfessionalFilter] = useState('ALL');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const statusLabel: Record<AppointmentStatus, string> = {
    PENDING: t('appointmentsPage.statuses.pending'),
    CONFIRMED: t('appointmentsPage.statuses.confirmed'),
    CANCELLED: t('appointmentsPage.statuses.cancelled'),
  };

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: appointmentService.getAll,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals'],
    queryFn: professionalService.list,
    enabled: !isProfessional,
  });

  const professionalMap = useMemo(() => {
    return Object.fromEntries(professionals.map((p) => [p.id, p.name]));
  }, [professionals]);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const matchSearch =
        a.clientName.toLowerCase().includes(search.toLowerCase()) ||
        a.clientPhone.includes(search) ||
        a.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
      const matchProfessional =
        professionalFilter === 'ALL' || a.professionalId === professionalFilter;
      const aptDate = a.startAt.slice(0, 10);
      const matchDateFrom = !filterDateFrom || aptDate >= filterDateFrom;
      const matchDateTo = !filterDateTo || aptDate <= filterDateTo;
      return matchSearch && matchStatus && matchProfessional && matchDateFrom && matchDateTo;
    });
  }, [appointments, search, statusFilter, professionalFilter, filterDateFrom, filterDateTo]);

  const createMutation = useMutation({
    mutationFn: appointmentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AppointmentInput> }) =>
      appointmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: appointmentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setDeleteId(null);
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (apt: Appointment) => {
    setEditingId(apt.id);
    setForm({
      clientName: apt.clientName,
      clientPhone: apt.clientPhone,
      title: apt.title,
      startAt: apt.startAt,
      endAt: apt.endAt ?? '',
      notes: apt.notes ?? '',
      professionalId: apt.professionalId ?? '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!form.title.trim()) {
      errs.title = t('appointmentsPage.validation.titleRequired');
    }

    if (!form.clientName.trim()) {
      errs.clientName = t('appointmentsPage.validation.clientNameRequired');
    }

    if (!form.clientPhone.trim()) {
      errs.clientPhone = t('appointmentsPage.validation.phoneRequired');
    } else if (!isValidPhone(form.clientPhone)) {
      errs.clientPhone = t('appointmentsPage.validation.phoneInvalid');
    }

    if (!form.startAt) {
      errs.startAt = t('appointmentsPage.validation.startRequired');
    } else if (!editingId && !isNotInPast(form.startAt)) {
      errs.startAt = t('appointmentsPage.validation.startInPast');
    }

    if (form.endAt && !isEndAfterStart(form.startAt, form.endAt)) {
      errs.endAt = t('appointmentsPage.validation.endBeforeStart');
    }

    if (professionals.length > 0 && !form.professionalId) {
      errs.professionalId = t('appointmentsPage.validation.professionalRequired');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const payload: AppointmentInput = {
      clientName: form.clientName.trim(),
      clientPhone: form.clientPhone.replace(/\D/g, ''),
      title: form.title.trim(),
      startAt: new Date(form.startAt).toISOString(),
      endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
      notes: form.notes.trim() || undefined,
      professionalId: form.professionalId || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <PageLayout
      title={t('common.appointments')}
      subtitle={isProfessional ? t('appointmentsPage.subtitleProfessional') : t('appointmentsPage.subtitle')}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder={t('appointmentsPage.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            className="w-40"
            icon={<Filter className="w-3.5 h-3.5" />}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as typeof statusFilter)}
            options={[
              { value: 'ALL', label: t('appointmentsPage.filterAll') },
              { value: 'PENDING', label: statusLabel.PENDING },
              { value: 'CONFIRMED', label: statusLabel.CONFIRMED },
              { value: 'CANCELLED', label: statusLabel.CANCELLED },
            ]}
          />
          {!isProfessional && professionals.length > 0 && (
            <Select
              className="w-48"
              icon={<Briefcase className="w-3.5 h-3.5" />}
              value={professionalFilter}
              onChange={setProfessionalFilter}
              options={[
                { value: 'ALL', label: t('appointmentsPage.allProfessionals') },
                ...professionals.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          )}
          <DateInput
            value={filterDateFrom}
            onChange={setFilterDateFrom}
            placeholder={t('appointmentsPage.filterDateFrom')}
            align="left"
          />
          <DateInput
            value={filterDateTo}
            onChange={setFilterDateTo}
            placeholder={t('appointmentsPage.filterDateTo')}
            align="left"
          />
        </div>
        {!isProfessional && (
          <Button onClick={openCreate} className="flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" />
            {t('appointmentsPage.newAppointment')}
          </Button>
        )}
      </div>

      <Card variant="base" className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        {isLoading ? (
          <div className="p-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-muted-foreground">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">{t('appointmentsPage.emptyTitle')}</p>
            <p className="text-sm mt-1 opacity-60">
              {search || statusFilter !== 'ALL' || filterDateFrom || filterDateTo
                ? t('appointmentsPage.emptyFilters')
                : isProfessional
                ? t('appointmentsPage.emptyNone')
                : t('appointmentsPage.emptyHint')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead className="bg-surface-high/50 border-b border-outline-variant/20">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('appointmentsPage.table.client')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('appointmentsPage.table.service')}</th>
                  {!isProfessional && professionals.length > 0 && (
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('appointmentsPage.table.professional')}</th>
                  )}
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('appointmentsPage.table.dateTime')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('appointmentsPage.table.status')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('appointmentsPage.table.notification')}</th>
                  {!isProfessional && <th className="px-6 py-4" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((apt) => (
                  <tr key={apt.id} className="group hover:bg-surface-high/20 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-container border border-outline-variant/50 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{apt.clientName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {apt.clientPhone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-medium">{apt.title}</span>
                    </td>
                    {!isProfessional && professionals.length > 0 && (
                      <td className="px-6 py-5">
                        {apt.professionalId && professionalMap[apt.professionalId] ? (
                          <span className="text-sm text-muted-foreground">{professionalMap[apt.professionalId]}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          {formatDate(apt.startAt)}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(apt.startAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[apt.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[apt.status]}`} />
                        {statusLabel[apt.status]}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {apt.isNotified ? (
                        <Bell className="w-4 h-4 text-primary" title={t('appointmentsPage.notified')} />
                      ) : (
                        <BellOff className="w-4 h-4 text-muted-foreground/40" title={t('appointmentsPage.notNotified')} />
                      )}
                    </td>
                    {!isProfessional && (
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(apt)}
                            className="p-2 rounded-lg hover:bg-surface-container text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(apt.id)}
                            className="p-2 rounded-lg hover:bg-surface-container text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <Modal onClose={closeModal}>
            <div className="p-6 border-b border-outline-variant/30">
              <h2 className="text-lg font-bold tracking-tight">
                {editingId ? t('appointmentsPage.editAppointment') : t('appointmentsPage.newAppointment')}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('appointmentsPage.form.serviceTitle')}</label>
                  <Input
                    value={form.title}
                    onChange={(e) => { setForm(f => ({ ...f, title: e.target.value })); setErrors(e => ({ ...e, title: undefined })); }}
                    placeholder={t('appointmentsPage.form.servicePlaceholder')}
                    className={errors.title ? 'border-red-500/50' : ''}
                  />
                  {errors.title && <span className="text-[10px] text-red-400 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</span>}
                </div>
                {professionals.length > 0 && (
                  <div className="col-span-2">
                    <Select
                      label={`${t('appointmentsPage.table.professional')} *`}
                      icon={<Briefcase className="w-4 h-4" />}
                      value={form.professionalId || undefined}
                      placeholder={t('appointmentsPage.form.selectProfessional')}
                      onChange={(v) => { setForm(f => ({ ...f, professionalId: v })); setErrors(e => ({ ...e, professionalId: undefined })); }}
                      error={errors.professionalId}
                      options={professionals.map((p) => ({ value: p.id, label: p.name }))}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('appointmentsPage.form.clientName')}</label>
                  <Input
                    value={form.clientName}
                    onChange={(e) => { setForm(f => ({ ...f, clientName: e.target.value })); setErrors(e => ({ ...e, clientName: undefined })); }}
                    placeholder={t('appointmentsPage.form.clientNamePlaceholder')}
                    className={errors.clientName ? 'border-red-500/50' : ''}
                  />
                  {errors.clientName && <span className="text-[10px] text-red-400 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.clientName}</span>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('appointmentsPage.form.clientPhone')}</label>
                  <Input
                    value={form.clientPhone}
                    onChange={(e) => { setForm(f => ({ ...f, clientPhone: e.target.value })); setErrors(e => ({ ...e, clientPhone: undefined })); }}
                    placeholder="11999999999"
                    className={errors.clientPhone ? 'border-red-500/50' : ''}
                  />
                  {errors.clientPhone && <span className="text-[10px] text-red-400 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.clientPhone}</span>}
                </div>
                <div className="col-span-2">
                  <DatePicker
                    label={t('appointmentsPage.form.startAt')}
                    required
                    value={form.startAt || undefined}
                    onChange={(v) => { setForm(f => ({ ...f, startAt: v })); setErrors(e => ({ ...e, startAt: undefined })); }}
                    error={errors.startAt}
                    minDate={!editingId ? new Date() : undefined}
                  />
                </div>
                <div className="col-span-2">
                  <DatePicker
                    label={t('appointmentsPage.form.endAt')}
                    value={form.endAt || undefined}
                    onChange={(v) => { setForm(f => ({ ...f, endAt: v })); setErrors(e => ({ ...e, endAt: undefined })); }}
                    error={errors.endAt}
                    minDate={form.startAt ? new Date(form.startAt) : undefined}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('appointmentsPage.form.notes')}</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2 text-sm bg-surface border border-outline-variant/20 rounded-xl resize-none focus:outline-none focus:border-primary/50"
                    placeholder={t('appointmentsPage.form.notesPlaceholder')}
                    value={form.notes}
                    onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={closeModal} disabled={isPending}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? t('appointmentsPage.save') : t('appointmentsPage.create')}
                </Button>
              </div>
            </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <Modal onClose={() => setDeleteId(null)} maxWidth="max-w-sm">
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-lg font-bold mb-2">{t('appointmentsPage.deleteTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('appointmentsPage.deleteDescription')}</p>
            </div>
            <div className="p-4 border-t border-outline-variant/30 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteId(null)} disabled={deleteMutation.isPending}>
                {t('common.cancel')}
              </Button>
              <Button
                onClick={() => deleteMutation.mutate(deleteId!)}
                disabled={deleteMutation.isPending}
                className="bg-red-500 hover:bg-red-600 text-white shadow-none"
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('appointmentsPage.deleteConfirm')}
              </Button>
            </div>
        </Modal>
      )}
    </PageLayout>
  );
};
