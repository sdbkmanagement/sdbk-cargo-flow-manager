import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { gmaoService, GmaoPiece } from '@/services/gmao';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

export const GmaoPieces: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<GmaoPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({
    reference: '', designation: '', categorie: '', unite: 'unite',
    quantite_stock: 0, seuil_mini: 0, prix_unitaire: 0, emplacement: '',
  });

  const charger = async () => {
    try { setItems(await gmaoService.getPieces()); }
    catch (e: any) { toast({ title: 'Erreur', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, []);

  const enregistrer = async () => {
    if (!form.reference || !form.designation) {
      toast({ title: 'Champs requis', description: 'Référence et désignation obligatoires', variant: 'destructive' });
      return;
    }
    try {
      await gmaoService.createPiece({
        ...form,
        quantite_stock: Number(form.quantite_stock) || 0,
        seuil_mini: Number(form.seuil_mini) || 0,
        prix_unitaire: Number(form.prix_unitaire) || 0,
      });
      toast({ title: 'Pièce enregistrée' });
      setOpen(false);
      setForm({ ...form, reference: '', designation: '' });
      charger();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pièces détachées & stock</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Nouvelle pièce</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Nouvelle pièce</DialogTitle></DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Référence *</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
              <div><Label>Désignation *</Label><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
              <div><Label>Catégorie</Label><Input value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} /></div>
              <div><Label>Emplacement</Label><Input value={form.emplacement} onChange={(e) => setForm({ ...form, emplacement: e.target.value })} /></div>
              <div><Label>Quantité en stock</Label><Input type="number" value={form.quantite_stock} onChange={(e) => setForm({ ...form, quantite_stock: e.target.value })} /></div>
              <div><Label>Seuil minimum</Label><Input type="number" value={form.seuil_mini} onChange={(e) => setForm({ ...form, seuil_mini: e.target.value })} /></div>
              <div><Label>Prix unitaire (GNF)</Label><Input type="number" value={form.prix_unitaire} onChange={(e) => setForm({ ...form, prix_unitaire: e.target.value })} /></div>
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
              <TableHead>Référence</TableHead>
              <TableHead>Désignation</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Seuil</TableHead>
              <TableHead className="text-right">Prix unitaire</TableHead>
              <TableHead>État</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6}>Chargement…</TableCell></TableRow>}
            {!loading && items.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-muted-foreground">Aucune pièce enregistrée.</TableCell></TableRow>
            )}
            {items.map((p) => {
              const alerte = Number(p.quantite_stock) <= Number(p.seuil_mini);
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.reference}</TableCell>
                  <TableCell>{p.designation}</TableCell>
                  <TableCell className="text-right">{p.quantite_stock}</TableCell>
                  <TableCell className="text-right">{p.seuil_mini}</TableCell>
                  <TableCell className="text-right">{Number(p.prix_unitaire).toLocaleString('fr-FR')} GNF</TableCell>
                  <TableCell><Badge variant={alerte ? 'destructive' : 'default'}>{alerte ? 'Sous seuil' : 'OK'}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
