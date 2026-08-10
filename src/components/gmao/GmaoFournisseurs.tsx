import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { gmaoService, GmaoFournisseur } from '@/services/gmao';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

export const GmaoFournisseurs: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<GmaoFournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({
    nom: '', type: 'prestataire', contact_nom: '', telephone: '', email: '', adresse: '',
  });

  const charger = async () => {
    try { setItems(await gmaoService.getFournisseurs()); }
    catch (e: any) { toast({ title: 'Erreur', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, []);

  const enregistrer = async () => {
    if (!form.nom) {
      toast({ title: 'Champ requis', description: 'Le nom est obligatoire', variant: 'destructive' });
      return;
    }
    try {
      await gmaoService.createFournisseur(form);
      toast({ title: 'Fournisseur enregistré' });
      setOpen(false);
      setForm({ ...form, nom: '', contact_nom: '', telephone: '', email: '' });
      charger();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Fournisseurs & prestataires</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Nouveau fournisseur</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Nouveau fournisseur</DialogTitle></DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Nom *</Label><Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
              <div><Label>Contact</Label><Input value={form.contact_nom} onChange={(e) => setForm({ ...form, contact_nom: e.target.value })} /></div>
              <div><Label>Téléphone</Label><Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Adresse</Label><Input value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={enregistrer}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={4}>Chargement…</TableCell></TableRow>}
            {!loading && items.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-muted-foreground">Aucun fournisseur enregistré.</TableCell></TableRow>
            )}
            {items.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.nom}</TableCell>
                <TableCell>{f.contact_nom || '—'}</TableCell>
                <TableCell>{f.telephone || '—'}</TableCell>
                <TableCell>{f.email || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
