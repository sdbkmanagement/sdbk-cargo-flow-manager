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
import { useAuth } from '@/contexts/AuthContext';
import { Plus, PackagePlus } from 'lucide-react';
import { useGmao } from './GmaoContext';

export const GmaoPieces: React.FC = () => {
  const { toast } = useToast();
  const { rafraichir } = useGmao();
  const { user } = useAuth() as any;
  const [items, setItems] = useState<GmaoPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [reappro, setReappro] = useState<GmaoPiece | null>(null);
  const [reapproForm, setReapproForm] = useState({ quantite: '', prix_unitaire: '', motif: '' });
  const [saving, setSaving] = useState(false);
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

  const ouvrirReappro = (p: GmaoPiece) => {
    setReappro(p);
    setReapproForm({ quantite: '', prix_unitaire: String(p.prix_unitaire ?? ''), motif: '' });
  };

  const validerReappro = async () => {
    if (!reappro) return;
    const qte = Number(reapproForm.quantite);
    if (!qte || qte <= 0) {
      toast({ title: 'Quantité invalide', description: 'Saisir une quantité supérieure à 0', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const nouveau = await gmaoService.entreeStock({
        pieceId: reappro.id,
        quantite: qte,
        prixUnitaire: Number(reapproForm.prix_unitaire) || undefined,
        motif: reapproForm.motif || 'Réapprovisionnement',
        utilisateur: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : undefined,
      });
      toast({ title: 'Stock réapprovisionné', description: `${reappro.reference} : nouveau stock ${nouveau}` });
      setReappro(null);
      charger();
      rafraichir();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };


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
      rafraichir();
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={7}>Chargement…</TableCell></TableRow>}
            {!loading && items.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-muted-foreground">Aucune pièce enregistrée.</TableCell></TableRow>
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
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => ouvrirReappro(p)}>
                      <PackagePlus className="w-4 h-4 mr-2" /> Réapprovisionner
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <Dialog open={!!reappro} onOpenChange={(o) => !o && setReappro(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Réapprovisionner — {reappro?.reference}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="text-sm text-muted-foreground">
                {reappro?.designation} • stock actuel : <strong>{reappro?.quantite_stock}</strong>
              </div>
              <div>
                <Label>Quantité reçue *</Label>
                <Input type="number" min={1} value={reapproForm.quantite}
                  onChange={(e) => setReapproForm({ ...reapproForm, quantite: e.target.value })} />
              </div>
              <div>
                <Label>Prix unitaire (GNF)</Label>
                <Input type="number" value={reapproForm.prix_unitaire}
                  onChange={(e) => setReapproForm({ ...reapproForm, prix_unitaire: e.target.value })} />
              </div>
              <div>
                <Label>Motif / fournisseur</Label>
                <Input value={reapproForm.motif} placeholder="Achat, retour, inventaire…"
                  onChange={(e) => setReapproForm({ ...reapproForm, motif: e.target.value })} />
              </div>
              {reapproForm.quantite && Number(reapproForm.quantite) > 0 && (
                <div className="text-sm">
                  Nouveau stock : <strong>{Number(reappro?.quantite_stock || 0) + Number(reapproForm.quantite)}</strong>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReappro(null)}>Annuler</Button>
              <Button onClick={validerReappro} disabled={saving}>{saving ? 'Enregistrement…' : 'Valider l\'entrée'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>

    </Card>
  );
};
