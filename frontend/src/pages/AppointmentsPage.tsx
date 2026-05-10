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
} from 'lucide-react';
import { PageLayout } from '../shared/ui/PageLayout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { Input } from '../shared/ui/Input';
import {
  appointmentService,
  type Appointment,
  type AppointmentInput,
  type AppointmentStatus,
} from '../features/appointment/appointment.service';

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
const STATUS_LABEL: Record<AppointmentStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
};

interface FormState {
  clientName: string;
  clientPhone: string;
  title: string;
  startAt: string;
  endAt: string;
  notes: string;
}

const emptyForm: FormState = {
  clientName: '',
  clientPhone: '',
  title: '',
  startAt: '',
  endAt: '',
  notes: '',
};

function toLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const AppointmentsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AppointmentStatus>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: appointmentService.getAll,
  });

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const matchSearch =
        a.clientName.toLowerCase().includes(search.toLowerCase()) ||
        a.clientPhone.includes(search) ||
        a.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [appointments, search, statusFilter]);

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
    setIsModalOpen(true);
  };

  const openEdit = (apt: Appointment) => {
    setEditingId(apt.id);
    setForm({
      clientName: apt.clientName,
      clientPhone: apt.clientPhone,
      title: apt.title,
      startAt: toLocalInput(apt.startAt),
      endAt: apt.endAt ? toLocalInput(apt.endAt) : '',
      notes: apt.notes ?? '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: AppointmentInput = {
      clientName: form.clientName,
      clientPhone: form.clientPhone,
      title: form.title,
      startAt: new Date(form.startAt).toISOString(),
      endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
      notes: form.notes || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <PageLayout title="Agendamentos" subtitle="Gerencie os agendamentos da sua empresa">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Buscar por nome, telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <select
              className="w-full pl-9 pr-4 py-2 h-10 bg-white border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendente</option>
              <option value="CONFIRMED">Confirmado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2 whitespace-nowrap">
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </Button>
      </div>

      <Card variant="base" className="overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-muted-foreground">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nenhum agendamento encontrado.</p>
            <p className="text-sm mt-1 opacity-60">
              {search || statusFilter !== 'ALL'
                ? 'Tente ajustar os filtros.'
                : 'Clique em "Novo Agendamento" para começar.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead className="bg-surface-high/50 border-b border-outline-variant/20">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cliente</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Serviço</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Data / Hora</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Notif.</th>
                  <th className="px-6 py-4" />
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
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          {new Date(apt.startAt).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(apt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[apt.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[apt.status]}`} />
                        {STATUS_LABEL[apt.status]}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {apt.isNotified ? (
                        <Bell className="w-4 h-4 text-primary" title="Notificado" />
                      ) : (
                        <BellOff className="w-4 h-4 text-muted-foreground/40" title="Não notificado" />
                      )}
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-white border border-outline-variant rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant/30">
              <h2 className="text-lg font-bold tracking-tight">
                {editingId ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Serviço / Título</label>
                  <Input
                    required
                    value={form.title}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Ex: Consulta, Corte, Treino..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nome do Cliente</label>
                  <Input
                    required
                    value={form.clientName}
                    onChange={(e) => setForm(f => ({ ...f, clientName: e.target.value }))}
                    placeholder="João Silva"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">WhatsApp do Cliente</label>
                  <Input
                    required
                    value={form.clientPhone}
                    onChange={(e) => setForm(f => ({ ...f, clientPhone: e.target.value }))}
                    placeholder="11999999999"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Início</label>
                  <Input
                    required
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) => setForm(f => ({ ...f, startAt: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fim (opcional)</label>
                  <Input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) => setForm(f => ({ ...f, endAt: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Observações</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2 text-sm bg-white border border-outline-variant rounded-xl resize-none focus:outline-none focus:border-primary/50"
                    placeholder="Informações adicionais..."
                    value={form.notes}
                    onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={closeModal} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm bg-white border border-outline-variant rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-lg font-bold mb-2">Excluir agendamento?</h2>
              <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="p-4 border-t border-outline-variant/30 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setDeleteId(null)} disabled={deleteMutation.isPending}>
                Cancelar
              </Button>
              <Button
                onClick={() => deleteMutation.mutate(deleteId!)}
                disabled={deleteMutation.isPending}
                className="bg-red-500 hover:bg-red-600 text-white shadow-none"
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
