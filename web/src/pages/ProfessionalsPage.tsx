import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Clock,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  UserCircle,
} from 'lucide-react';
import { PageLayout } from '../shared/ui/PageLayout';
import { Card } from '../shared/ui/Card';
import { Button } from '../shared/ui/Button';
import { professionalService, type Professional } from '../features/company/professional.service';

const DAYS = [
  { key: 'mon', label: 'Segunda' },
  { key: 'tue', label: 'Terça' },
  { key: 'wed', label: 'Quarta' },
  { key: 'thu', label: 'Quinta' },
  { key: 'fri', label: 'Sexta' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

interface ProfessionalFormData {
  name: string;
  specialty: string;
  appointmentDuration: number;
  workingHours: Record<string, Array<{ start: string; end: string }>>;
  active: boolean;
}

const emptyForm: ProfessionalFormData = {
  name: '',
  specialty: '',
  appointmentDuration: 60,
  workingHours: {},
  active: true,
};

export const ProfessionalsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfessionalFormData>(emptyForm);

  const { data: professionals, isLoading } = useQuery({
    queryKey: ['professionals'],
    queryFn: professionalService.list,
  });

  const createMutation = useMutation({
    mutationFn: professionalService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Professional> }) =>
      professionalService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: professionalService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      setDeleteId(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      professionalService.update(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    },
  });

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (p: Professional) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      specialty: p.specialty || '',
      appointmentDuration: p.appointmentDuration,
      workingHours: p.workingHours || {},
      active: p.active,
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
    const data = {
      name: form.name,
      specialty: form.specialty || undefined,
      appointmentDuration: form.appointmentDuration,
      workingHours: Object.keys(form.workingHours).length > 0 ? form.workingHours : undefined,
      active: form.active,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleDay = (dayKey: string) => {
    const current = { ...form.workingHours };
    if (current[dayKey]) {
      delete current[dayKey];
    } else {
      current[dayKey] = [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }];
    }
    setForm({ ...form, workingHours: current });
  };

  const updateSlot = (dayKey: string, index: number, field: 'start' | 'end', value: string) => {
    const current = { ...form.workingHours };
    if (current[dayKey]) {
      current[dayKey] = [...current[dayKey]];
      current[dayKey][index] = { ...current[dayKey][index], [field]: value };
    }
    setForm({ ...form, workingHours: current });
  };

  const addSlot = (dayKey: string) => {
    const current = { ...form.workingHours };
    if (current[dayKey]) {
      current[dayKey] = [...current[dayKey], { start: '08:00', end: '12:00' }];
    }
    setForm({ ...form, workingHours: current });
  };

  const removeSlot = (dayKey: string, index: number) => {
    const current = { ...form.workingHours };
    if (current[dayKey] && current[dayKey].length > 1) {
      current[dayKey] = current[dayKey].filter((_, i) => i !== index);
    }
    setForm({ ...form, workingHours: current });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <PageLayout
      title={t('professionals.title', 'Profissionais')}
      subtitle={t('professionals.subtitle', 'Gerencie os profissionais que atendem na sua empresa.')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{t('professionals.title', 'Profissionais')}</h2>
            <p className="text-xs text-muted-foreground">{professionals?.length || 0} cadastrados</p>
          </div>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('professionals.add', 'Novo Profissional')}
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !professionals?.length ? (
        <Card variant="glass" className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-high/50 flex items-center justify-center border border-outline-variant/30">
              <Users className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('professionals.empty', 'Nenhum profissional cadastrado ainda.')}
            </p>
            <Button onClick={openNew} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              {t('professionals.add', 'Novo Profissional')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {professionals.map((p) => (
            <Card
              key={p.id}
              variant="glass"
              className={`p-6 group hover:scale-[1.01] transition-all ${!p.active ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{p.name}</h3>
                    {p.specialty && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Briefcase className="w-3 h-3" /> {p.specialty}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleActiveMutation.mutate({ id: p.id, active: !p.active })}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title={p.active ? 'Desativar' : 'Ativar'}
                >
                  {p.active ? (
                    <ToggleRight className="w-6 h-6 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <Clock className="w-3.5 h-3.5" />
                <span>{p.appointmentDuration} min por consulta</span>
              </div>

              {p.workingHours && Object.keys(p.workingHours).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {DAYS.filter(d => p.workingHours?.[d.key]).map(d => (
                    <span
                      key={d.key}
                      className="text-[10px] font-bold uppercase py-0.5 px-2 rounded-md bg-primary/10 text-primary border border-primary/20"
                    >
                      {d.label.slice(0, 3)}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(p)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-surface-high"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => setDeleteId(p.id)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-surface-high"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg max-h-[90vh] bg-surface-high border border-outline-variant rounded-2xl shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 z-10 bg-surface-high border-b border-outline-variant/30 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">
                {editingId ? 'Editar Profissional' : 'Novo Profissional'}
              </h2>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-surface-low transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Nome *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Dr. João Silva"
                  className="w-full px-4 py-3 bg-surface-low border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Specialty */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Especialidade
                </label>
                <input
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  placeholder="Ex: Dentista, Barbeiro, Personal..."
                  className="w-full px-4 py-3 bg-surface-low border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Duração da Consulta (minutos)
                </label>
                <input
                  type="number"
                  value={form.appointmentDuration}
                  onChange={(e) => setForm({ ...form, appointmentDuration: parseInt(e.target.value) || 60 })}
                  min={5}
                  max={480}
                  className="w-full px-4 py-3 bg-surface-low border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Working Hours */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Horários de Trabalho
                </label>
                <div className="space-y-2">
                  {DAYS.map((day) => {
                    const isActive = !!form.workingHours[day.key];
                    return (
                      <div
                        key={day.key}
                        className={`rounded-md border transition-all duration-200 ${
                          isActive
                            ? 'bg-surface-low/80 border-primary/20'
                            : 'bg-surface-low/30 border-outline-variant/10'
                        }`}
                      >
                        <div className="flex items-center justify-between px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => toggleDay(day.key)}
                            className="flex items-center gap-2.5"
                          >
                            <div className={`w-8 h-5 rounded-full relative transition-colors duration-200 ${
                              isActive ? 'bg-green-500/80' : 'bg-white/10'
                            }`}>
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                isActive ? 'translate-x-3.5' : 'translate-x-0.5'
                              }`} />
                            </div>
                            <span className={`text-sm font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                              {day.label}
                            </span>
                          </button>
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => addSlot(day.key)}
                              className="flex items-center gap-1 text-[10px] font-bold text-primary/70 hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-primary/10"
                            >
                              <Plus className="w-3 h-3" /> Turno
                            </button>
                          )}
                        </div>
                        {isActive && (
                          <div className="px-4 pb-3 space-y-2">
                            {form.workingHours[day.key]?.map((slot, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="flex items-center gap-2 flex-1 bg-surface-high/60 rounded-md px-3 py-2 border border-outline-variant/15">
                                  <input
                                    type="text"
                                    value={slot.start}
                                    onChange={(e) => {
                                      let v = e.target.value.replace(/[^\d:]/g, '');
                                      if (v.length === 2 && !v.includes(':') && !slot.start.includes(':')) v += ':';
                                      if (v.length <= 5) updateSlot(day.key, i, 'start', v);
                                    }}
                                    onBlur={(e) => {
                                      const v = e.target.value;
                                      if (/^\d{2}:\d{2}$/.test(v)) return;
                                      if (/^\d{2}$/.test(v)) updateSlot(day.key, i, 'start', v + ':00');
                                      else if (/^\d{1}$/.test(v)) updateSlot(day.key, i, 'start', '0' + v + ':00');
                                    }}
                                    placeholder="08:00"
                                    maxLength={5}
                                    className="w-14 bg-transparent text-sm font-mono text-center focus:outline-none text-foreground placeholder:text-muted-foreground/30"
                                  />
                                  <span className="text-[10px] text-muted-foreground/40 font-bold uppercase">até</span>
                                  <input
                                    type="text"
                                    value={slot.end}
                                    onChange={(e) => {
                                      let v = e.target.value.replace(/[^\d:]/g, '');
                                      if (v.length === 2 && !v.includes(':') && !slot.end.includes(':')) v += ':';
                                      if (v.length <= 5) updateSlot(day.key, i, 'end', v);
                                    }}
                                    onBlur={(e) => {
                                      const v = e.target.value;
                                      if (/^\d{2}:\d{2}$/.test(v)) return;
                                      if (/^\d{2}$/.test(v)) updateSlot(day.key, i, 'end', v + ':00');
                                      else if (/^\d{1}$/.test(v)) updateSlot(day.key, i, 'end', '0' + v + ':00');
                                    }}
                                    placeholder="12:00"
                                    maxLength={5}
                                    className="w-14 bg-transparent text-sm font-mono text-center focus:outline-none text-foreground placeholder:text-muted-foreground/30"
                                  />
                                </div>
                                {form.workingHours[day.key]?.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeSlot(day.key, i)}
                                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground/30 hover:text-red-400 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30">
                <Button type="button" variant="ghost" onClick={closeModal} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving || !form.name.trim()} className="gap-2 min-w-[120px]">
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingId ? 'Salvar' : 'Criar'}
                    </>
                  )}
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
          <div className="relative w-full max-w-sm bg-surface-high border border-outline-variant rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-2">Excluir Profissional</h2>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Tem certeza que deseja excluir este profissional? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="p-4 border-t border-outline-variant/30 flex items-center justify-end gap-3 bg-surface-low/50">
              <Button variant="ghost" onClick={() => setDeleteId(null)} disabled={deleteMutation.isPending}>
                Cancelar
              </Button>
              <Button
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="bg-red-500 hover:bg-red-600 text-white shadow-none min-w-[100px]"
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
