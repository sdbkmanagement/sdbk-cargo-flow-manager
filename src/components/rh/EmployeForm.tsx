
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Save, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmployeFormProps {
  onClose: () => void;
  onSuccess: () => void;
  employe?: any;
}

export const EmployeForm = ({ onClose, onSuccess, employe }: EmployeFormProps) => {
  const [formData, setFormData] = useState({
    nom: employe?.nom || '',
    prenom: employe?.prenom || '',
    poste: employe?.poste || '',
    service: employe?.service || 'Transport',
    date_embauche: employe?.date_embauche || '',
    date_fin_contrat: employe?.date_fin_contrat || '',
    statut: employe?.statut || 'actif',
    type_contrat: employe?.type_contrat || 'CDI',
    telephone: employe?.telephone || '',
    email: employe?.email || '',
    remarques: employe?.remarques || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('employes')
        .insert([formData]);

      if (error) throw error;

      toast.success('Personnel ajouté avec succès');
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      toast.error('Erreur lors de l\'ajout du personnel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = ['Transport', 'Maintenance', 'HSECQ', 'Administration', 'Direction'];
  const typesContrat = ['CDI', 'CDD', 'Stage', 'Interim'];
  const statuts = ['actif', 'inactif', 'en_arret'];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau Personnel</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({...formData, nom: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                value={formData.prenom}
                onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="poste">Poste *</Label>
              <Input
                id="poste"
                value={formData.poste}
                onChange={(e) => setFormData({...formData, poste: e.target.value})}
                placeholder="ex: Chauffeur, Mécanicien..."
                required
              />
            </div>
            <div>
              <Label htmlFor="service">Service *</Label>
              <select
                id="service"
                value={formData.service}
                onChange={(e) => setFormData({...formData, service: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                {services.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_embauche">Date d'embauche *</Label>
              <Input
                id="date_embauche"
                type="date"
                value={formData.date_embauche}
                onChange={(e) => setFormData({...formData, date_embauche: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="date_fin_contrat">Date de fin de contrat</Label>
              <Input
                id="date_fin_contrat"
                type="date"
                value={formData.date_fin_contrat}
                onChange={(e) => setFormData({...formData, date_fin_contrat: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type_contrat">Type de contrat *</Label>
              <select
                id="type_contrat"
                value={formData.type_contrat}
                onChange={(e) => setFormData({...formData, type_contrat: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                {typesContrat.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="statut">Statut *</Label>
              <select
                id="statut"
                value={formData.statut}
                onChange={(e) => setFormData({...formData, statut: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                {statuts.map(statut => (
                  <option key={statut} value={statut}>
                    {statut === 'actif' ? 'Actif' : 
                     statut === 'inactif' ? 'Inactif' : 'En arrêt'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                value={formData.telephone}
                onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                placeholder="ex: 0123456789"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="ex: nom@email.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="remarques">Remarques</Label>
            <Textarea
              id="remarques"
              value={formData.remarques}
              onChange={(e) => setFormData({...formData, remarques: e.target.value})}
              placeholder="Remarques ou notes particulières..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
