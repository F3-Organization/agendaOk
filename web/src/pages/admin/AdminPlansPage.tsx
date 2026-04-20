import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, Check, X, ShieldCheck, DollarSign } from 'lucide-react';
import { AdminLayout } from '../../shared/ui/AdminLayout';
import { Card } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';
import { adminService } from '../../features/admin/admin.service';
import type { Plan } from '../../features/subscription/subscription.service';
import toast from 'react-hot-toast';

const EMPTY_PLAN: Omit<Plan, 'id'> = {
  slug: '',
  name: '',
  description: '',
  priceInCents: 0,
  messageLimit: 50,
  maxDevices: 1,
  features: [],
  isActive: true,
  isPurchasable: false,
  sortOrder: 0,
};

const PlanModal = ({
  plan,
  onClose,
  onSave,
  isSaving,
}: {
  plan: Omit<Plan, 'id'> & { id?: string };
  onClose: () => void;
  onSave: (data: Omit<Plan, 'id'> & { id?: string }) => void;
  isSaving: boolean;
}) => {
  const [form, setForm] = useState(plan);
  const [featuresText, setFeaturesText] = useState(plan.features.join('\n'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, features: featuresText.split('\n').map(f => f.trim()).filter(Boolean) });
  };

  const field = (label: string, key: keyof typeof form, type = 'text') => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</label>
      <input
        type={type}
        value={form[key] as string | number}
        onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        className="w-full bg-surface-high border border-outline-variant/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card variant="glass" className="w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-6">{form.id ? 'Editar Plano' : 'Novo Plano'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {!form.id && field('Slug (ex: PRO)', 'slug')}
            {field('Nome', 'name')}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Descrição</label>
            <textarea
              value={form.description ?? ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full bg-surface-high border border-outline-variant/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('Preço (centavos)', 'priceInCents', 'number')}
            {field('Máx. Dispositivos', 'maxDevices', 'number')}
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Limite de Mensagens (vazio = ilimitado)
            </label>
            <input
              type="number"
              value={form.messageLimit ?? ''}
              placeholder="Ilimitado"
              onChange={e => setForm(f => ({ ...f, messageLimit: e.target.value === '' ? null : Number(e.target.value) }))}
              className="w-full bg-surface-high border border-outline-variant/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
          {field('Ordem (sortOrder)', 'sortOrder', 'number')}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Features (uma por linha)
            </label>
            <textarea
              value={featuresText}
              onChange={e => setFeaturesText(e.target.value)}
              rows={4}
              className="w-full bg-surface-high border border-outline-variant/50 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary/50 resize-none"
            />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-primary" />
              <span className="text-sm font-medium">Ativo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPurchasable} onChange={e => setForm(f => ({ ...f, isPurchasable: e.target.checked }))} className="accent-primary" />
              <span className="text-sm font-medium">Comprável (gera checkout)</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" className="flex-1" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              <X className="w-4 h-4 mr-2" /> Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export const AdminPlansPage = () => {
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<(Omit<Plan, 'id'> & { id?: string }) | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: adminService.listPlans,
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Plan, 'id'>) => adminService.createPlan(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-plans'] }); toast.success('Plano criado!'); setEditingPlan(null); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao criar plano'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Plan) => adminService.updatePlan(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-plans'] }); toast.success('Plano atualizado!'); setEditingPlan(null); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao atualizar plano'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deletePlan,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-plans'] }); toast.success('Plano removido!'); setConfirmDelete(null); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao remover plano'),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = (data: Omit<Plan, 'id'> & { id?: string }) => {
    if (data.id) {
      updateMutation.mutate(data as Plan);
    } else {
      createMutation.mutate(data as Omit<Plan, 'id'>);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Planos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os planos de assinatura disponíveis.</p>
        </div>
        <Button variant="primary" onClick={() => setEditingPlan(EMPTY_PLAN)}>
          <Plus className="w-4 h-4 mr-2" /> Novo Plano
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary/50" /></div>
      ) : (
        <div className="grid gap-6">
          {plans.map(plan => (
            <Card key={plan.id} variant="glass" className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-lg font-bold">{plan.name}</span>
                    <span className="text-xs font-mono bg-surface-high px-2 py-0.5 rounded border border-outline-variant/50 text-muted-foreground">{plan.slug}</span>
                    {!plan.isActive && <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest">Inativo</span>}
                    {plan.isPurchasable && <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Comprável</span>}
                  </div>
                  {plan.description && <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1 font-bold">
                      <DollarSign className="w-4 h-4 text-primary" />
                      {plan.priceInCents === 0 ? 'Gratuito' : `R$ ${(plan.priceInCents / 100).toFixed(2)}/mês`}
                    </span>
                    <span className="text-muted-foreground">
                      {plan.messageLimit === null ? '∞ mensagens' : `${plan.messageLimit} msg/mês`}
                    </span>
                    <span className="text-muted-foreground">{plan.maxDevices} dispositivo(s)</span>
                  </div>
                  {plan.features.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {plan.features.map((f, i) => (
                        <span key={i} className="text-xs bg-surface-low px-2 py-1 rounded border border-outline-variant/30 text-muted-foreground flex items-center gap-1">
                          <Check className="w-3 h-3 text-primary shrink-0" /> {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setEditingPlan(plan)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {confirmDelete === plan.id ? (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteMutation.mutate(plan.id)} disabled={deleteMutation.isPending}>
                        {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}><X className="w-4 h-4" /></Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-red-400/60 hover:text-red-400" onClick={() => setConfirmDelete(plan.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editingPlan !== null && (
        <PlanModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </AdminLayout>
  );
};
