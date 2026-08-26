import React, { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Paperclip, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { sirhService, TYPES_DOCUMENTS_RH } from '@/services/sirhService';
import { rhService } from '@/services/rh';

const statutBadge = (statut: string) => {
  if (statut === 'expire') return <Badge variant="destructive">Expiré</Badge>;
  if (statut === 'a_renouveler') return <Badge className="bg-amber-500 text-white hover:bg-amber-500">À renouveler</Badge>;
  return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Valide</Badge>;
};

interface Props {
  employeId?: string;
  compact?: boolean;
}

export const DocumentsRHList: React.FC<Props> = ({ employeId, compact }) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<any>({
    employe_id: employeId || '',
    type_document: TYPES_DOCUMENTS_RH[0],
    numero_document: '',
    date_emission: '',
    date_expiration: '',
    fichier_url: '',
    fichier_nom: '',
    commentaire: '',
  });

  const { data: documents, isLoading, error, refetch } = useQuery({
    queryKey: ['documents-rh', employeId || 'all'],
    queryFn: () => sirhService.getDocuments(employeId),
    refetchOnWindowFocus: true,
  });

  const { data: employes } = useQuery({
    queryKey: ['employes'],
    queryFn: () => rhService.getEmployes(),
    enabled: !employeId,
  });

  const reset = () => setForm({
    employe_id: employeId || '', type_document: TYPES_DOCUMENTS_RH[0], numero_document: '',
    date_emission: '', date_expiration: '', fichier_url: '', fichier_nom: '', commentaire: '',
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Fichier trop volumineux (max 10 Mo)'); return; }
    setUploading(true);
    try {
      const { url, nom } = await sirhService.uploadFichier(file);
      setForm((f: any) => ({ ...f, fichier_url: url, fichier_nom: nom }));
      toast.success('Fichier joint');
    } catch (err: any) {
      toast.error(err.message || 'Erreur de téléversement');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.employe_id) { toast.error('Sélectionnez un collaborateur'); return; }
    setSaving(true);
    try {
      await sirhService.createDocument({
        ...form,
        date_emission: form.date_emission || null,
        date_expiration: form.date_expiration || null,
      });
      toast.success('Document enregistré');
      await qc.invalidateQueries({ queryKey: ['documents-rh'] });
      qc.invalidateQueries({ queryKey: ['rh-alertes'] });
      await refetch();
      setOpen(false);
      reset();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await sirhService.deleteDocument(id);
      await qc.invalidateQueries({ queryKey: ['documents-rh'] });
      await refetch();
      toast.success('Document supprimé');
    } catch (e: any) {
      toast.error(e.message || 'Erreur de suppression');
    }
  };

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Documents RH</h2>
            <p className="text-sm text-muted-foreground">Contrats, permis, pièces d'identité, diplômes, certifications</p>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouveau document</Button>
        </div>
      )}
      {compact && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Ajouter</Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Chargement...</p>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-destructive font-medium">
                Impossible de charger les documents : {(error as any)?.message || 'erreur inconnue'}
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Réessayer</Button>
            </div>
          ) : (documents || []).length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucun document enregistré</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {!employeId && <TableHead>Collaborateur</TableHead>}
                  <TableHead>Type</TableHead>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Émission</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Fichier</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(documents || []).map((d: any) => (
                  <TableRow key={d.id}>
                    {!employeId && (
                      <TableCell className="font-medium">
                        {d.employes ? `${d.employes.nom} ${d.employes.prenom}` : '—'}
                      </TableCell>
                    )}
                    <TableCell>{d.type_document}</TableCell>
                    <TableCell>{d.numero_document || '—'}</TableCell>
                    <TableCell>{d.date_emission ? new Date(d.date_emission).toLocaleDateString('fr-FR') : '—'}</TableCell>
                    <TableCell>{d.date_expiration ? new Date(d.date_expiration).toLocaleDateString('fr-FR') : '—'}</TableCell>
                    <TableCell>{statutBadge(d.statut)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {d.fichier_nom || (d.fichier_url ? 'Document' : '—')}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {d.fichier_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mr-1"
                          onClick={() => window.open(d.fichier_url, '_blank', 'noopener,noreferrer')}
                        >
                          <Eye className="w-4 h-4 mr-1" />Consulter
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => remove(d.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nouveau document RH</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {!employeId && (
              <div>
                <Label>Collaborateur *</Label>
                <select
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                  value={form.employe_id}
                  onChange={(e) => setForm({ ...form, employe_id: e.target.value })}
                >
                  <option value="">-- Sélectionner --</option>
                  {((employes || []) as any[]).map((e) => (
                    <option key={e.id} value={e.id}>{e.nom} {e.prenom}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label>Type de document *</Label>
              <select
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm"
                value={form.type_document}
                onChange={(e) => setForm({ ...form, type_document: e.target.value })}
              >
                {TYPES_DOCUMENTS_RH.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label>Numéro</Label>
              <Input value={form.numero_document} onChange={(e) => setForm({ ...form, numero_document: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date d'émission</Label>
                <Input type="date" value={form.date_emission} onChange={(e) => setForm({ ...form, date_emission: e.target.value })} />
              </div>
              <div>
                <Label>Date d'expiration</Label>
                <Input type="date" value={form.date_expiration} onChange={(e) => setForm({ ...form, date_expiration: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Pièce jointe</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Paperclip className="w-4 h-4 mr-2" />}
                  {form.fichier_nom || 'Joindre un fichier'}
                </Button>
                <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
              </div>
            </div>
            <div>
              <Label>Commentaire</Label>
              <Input value={form.commentaire} onChange={(e) => setForm({ ...form, commentaire: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={save} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
