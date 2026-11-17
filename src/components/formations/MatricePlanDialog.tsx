import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { MatriceModule, matriceFormationService } from '@/services/matriceFormationService';

const categories = [
  { value: 'administration', label: 'Administration' },
  { value: 'mecaniciens', label: 'Mécaniciens' },
  { value: 'conducteurs', label: 'Conducteurs' },
];

export function MatricePlanDialog({ open, onOpenChange, annee, modules, categorie }: {
  open: boolean; onOpenChange: (open: boolean) => void; annee: number;
  modules: MatriceModule[]; categorie: string;
}) {
  const [nom, setNom] = useState('');
  const [selected, setSelected] = useState<string[]>([categorie]);
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['matrice-modules', annee] });
  const create = useMutation({
    mutationFn: () => matriceFormationService.createModule(annee, selected, nom, Math.max(0, ...modules.map(m => m.position)) + 1),
    onSuccess: () => { refresh(); setNom(''); toast({ title: 'Formation ajoutée au plan annuel' }); },
    onError: (error: { code?: string }) => toast({ title: 'Ajout impossible', description: error.code === '23505' ? 'Cette formation existe déjà dans une catégorie sélectionnée.' : 'Impossible d’enregistrer la formation.', variant: 'destructive' }),
  });
  const toggle = useMutation({
    mutationFn: ({ id, actif }: { id: string; actif: boolean }) => matriceFormationService.setModuleActive(id, actif),
    onSuccess: refresh,
    onError: () => toast({ title: 'Modification impossible', variant: 'destructive' }),
  });
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Plan de formation {annee}</DialogTitle></DialogHeader>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (nom.trim() && selected.length) create.mutate(); }}>
        <div className="space-y-2"><Label htmlFor="matrice-formation-nom">Intitulé de la formation</Label>
          <Input id="matrice-formation-nom" value={nom} onChange={e => setNom(e.target.value)} required maxLength={250} />
        </div>
        <div className="flex flex-wrap gap-4">{categories.map(c => <label key={c.value} className="flex items-center gap-2 text-sm">
          <Checkbox checked={selected.includes(c.value)} onCheckedChange={checked => setSelected(prev => checked ? [...prev, c.value] : prev.filter(v => v !== c.value))} />{c.label}
        </label>)}</div>
        <Button type="submit" disabled={create.isPending || !nom.trim() || !selected.length}>Ajouter la formation</Button>
      </form>
      <div className="space-y-4 border-t pt-4">{categories.map(c => <section key={c.value} className="space-y-2">
        <h3 className="font-medium text-sm">{c.label}</h3>
        {modules.filter(m => m.categorie === c.value).map(m => <label key={m.id} className="flex items-start gap-2 text-sm py-1">
          <Checkbox className="mt-0.5" checked={m.actif} disabled={toggle.isPending} onCheckedChange={checked => toggle.mutate({ id: m.id, actif: checked === true })} />
          <span className={m.actif ? '' : 'text-muted-foreground line-through'}>{m.module_nom}</span>
        </label>)}
      </section>)}</div>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}