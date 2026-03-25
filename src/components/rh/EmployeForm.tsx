
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmployeFormProps {
  onClose: () => void;
  onSuccess: () => void;
  employe?: any;
}

export const EmployeForm = ({ onClose, onSuccess, employe }: EmployeFormProps) => {
  const [formData, setFormData] = useState({
    // 1. Informations Administratives
    matricule: employe?.matricule || '',
    immatricule_cnss: employe?.immatricule_cnss || '',
    nom: employe?.nom || '',
    prenom: employe?.prenom || '',
    genre: employe?.genre || '',
    date_naissance: employe?.date_naissance || '',
    lieu_naissance: employe?.lieu_naissance || '',
    age: employe?.age || '',
    // 2. Informations Professionnelles
    fonction: employe?.fonction || employe?.poste || '',
    date_embauche: employe?.date_embauche || '',
    anciennete_transporteur: employe?.anciennete_transporteur || '',
    type_contrat: employe?.type_contrat || 'CDI',
    service: employe?.service || 'Transport',
    // 3. Informations Médicales
    groupe_sanguin: employe?.groupe_sanguin || '',
    date_derniere_visite_medicale: employe?.date_derniere_visite_medicale || '',
    statut_visite_medicale: employe?.statut_visite_medicale || 'a_faire',
    date_prochaine_visite: employe?.date_prochaine_visite || '',
    // 4. Coordonnées
    telephone: employe?.telephone || '',
    email: employe?.email || '',
    // 5. Situation Familiale
    nom_mere: employe?.nom_mere || '',
    nom_pere: employe?.nom_pere || '',
    // 6. Formation & Qualification
    diplome: employe?.diplome || '',
    // 7. Contact d'Urgence
    personne_urgence: employe?.personne_urgence || '',
    telephone_urgence: employe?.telephone_urgence || '',
    // 8. Statut
    statut: employe?.statut || 'actif',
    remarques: employe?.remarques || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate age from date_naissance
      if (field === 'date_naissance' && value) {
        const birth = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        updated.age = String(age);
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        poste: formData.fonction, // keep poste in sync
        age: formData.age ? parseInt(formData.age) : null,
      };

      if (employe?.id) {
        const { error } = await supabase
          .from('employes')
          .update(payload as any)
          .eq('id', employe.id);
        if (error) throw error;
        toast.success('Personnel modifié avec succès');
      } else {
        const { error } = await supabase
          .from('employes')
          .insert([payload] as any);
        if (error) throw error;
        toast.success('Personnel ajouté avec succès');
      }
      onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typesContrat = ['CDI', 'CDD', 'Stage', 'Interim'];
  const services = ['Transport', 'Maintenance', 'HSEQ', 'Administration', 'Direction'];
  const genres = ['Masculin', 'Féminin'];
  const groupesSanguins = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const statutsVisite = [
    { value: 'a_jour', label: 'À jour' },
    { value: 'expiree', label: 'Expirée' },
    { value: 'a_faire', label: 'À faire' },
  ];
  const statuts = [
    { value: 'actif', label: 'Actif' },
    { value: 'inactif', label: 'Inactif' },
    { value: 'suspendu', label: 'Suspendu' },
    { value: 'en_arret', label: 'En arrêt' },
  ];

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-primary border-b border-border pb-1 mb-3">{children}</h3>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employe ? 'Modifier le Personnel' : 'Nouveau Personnel'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Informations Administratives */}
          <div>
            <SectionTitle>🔹 1. Informations Administratives</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="matricule">Matricule (MAT)</Label>
                <Input id="matricule" value={formData.matricule} onChange={e => handleChange('matricule', e.target.value)} placeholder="MAT-001" />
              </div>
              <div>
                <Label htmlFor="immatricule_cnss">Immatricule CNSS</Label>
                <Input id="immatricule_cnss" value={formData.immatricule_cnss} onChange={e => handleChange('immatricule_cnss', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="nom">Nom *</Label>
                <Input id="nom" value={formData.nom} onChange={e => handleChange('nom', e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="prenom">Prénom *</Label>
                <Input id="prenom" value={formData.prenom} onChange={e => handleChange('prenom', e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="genre">Genre</Label>
                <select id="genre" value={formData.genre} onChange={e => handleChange('genre', e.target.value)} className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm">
                  <option value="">-- Sélectionner --</option>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="date_naissance">Date de naissance</Label>
                <Input id="date_naissance" type="date" value={formData.date_naissance} onChange={e => handleChange('date_naissance', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="lieu_naissance">Lieu de naissance</Label>
                <Input id="lieu_naissance" value={formData.lieu_naissance} onChange={e => handleChange('lieu_naissance', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="age">Âge</Label>
                <Input id="age" value={formData.age} readOnly className="bg-muted" />
              </div>
            </div>
          </div>

          {/* 2. Informations Professionnelles */}
          <div>
            <SectionTitle>🔹 2. Informations Professionnelles</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="fonction">Fonction *</Label>
                <Input id="fonction" value={formData.fonction} onChange={e => handleChange('fonction', e.target.value)} placeholder="ex: Chauffeur, Mécanicien..." required />
              </div>
              <div>
                <Label htmlFor="service">Service *</Label>
                <select id="service" value={formData.service} onChange={e => handleChange('service', e.target.value)} className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm" required>
                  {services.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="date_embauche">Date d'embauche *</Label>
                <Input id="date_embauche" type="date" value={formData.date_embauche} onChange={e => handleChange('date_embauche', e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="anciennete_transporteur">Ancienneté transporteur</Label>
                <Input id="anciennete_transporteur" value={formData.anciennete_transporteur} onChange={e => handleChange('anciennete_transporteur', e.target.value)} placeholder="ex: 5 ans" />
              </div>
              <div>
                <Label htmlFor="type_contrat">Type de contrat *</Label>
                <select id="type_contrat" value={formData.type_contrat} onChange={e => handleChange('type_contrat', e.target.value)} className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm" required>
                  {typesContrat.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Informations Médicales */}
          <div>
            <SectionTitle>🔹 3. Informations Médicales</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="groupe_sanguin">Groupe sanguin</Label>
                <select id="groupe_sanguin" value={formData.groupe_sanguin} onChange={e => handleChange('groupe_sanguin', e.target.value)} className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm">
                  <option value="">-- Sélectionner --</option>
                  {groupesSanguins.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="date_derniere_visite_medicale">Dernière visite médicale</Label>
                <Input id="date_derniere_visite_medicale" type="date" value={formData.date_derniere_visite_medicale} onChange={e => handleChange('date_derniere_visite_medicale', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="statut_visite_medicale">Statut visite médicale</Label>
                <select id="statut_visite_medicale" value={formData.statut_visite_medicale} onChange={e => handleChange('statut_visite_medicale', e.target.value)} className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm">
                  {statutsVisite.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="date_prochaine_visite">Prochaine visite</Label>
                <Input id="date_prochaine_visite" type="date" value={formData.date_prochaine_visite} onChange={e => handleChange('date_prochaine_visite', e.target.value)} />
              </div>
            </div>
          </div>

          {/* 4. Coordonnées */}
          <div>
            <SectionTitle>🔹 4. Coordonnées</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                <Input id="telephone" value={formData.telephone} onChange={e => handleChange('telephone', e.target.value)} placeholder="ex: 0123456789" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="ex: nom@email.com" />
              </div>
            </div>
          </div>

          {/* 5. Situation Familiale */}
          <div>
            <SectionTitle>🔹 5. Situation Familiale</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="nom_pere">Nom du père</Label>
                <Input id="nom_pere" value={formData.nom_pere} onChange={e => handleChange('nom_pere', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="nom_mere">Nom de la mère</Label>
                <Input id="nom_mere" value={formData.nom_mere} onChange={e => handleChange('nom_mere', e.target.value)} />
              </div>
            </div>
          </div>

          {/* 6. Formation & Qualification */}
          <div>
            <SectionTitle>🔹 6. Formation & Qualification</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="diplome">Diplôme</Label>
                <Input id="diplome" value={formData.diplome} onChange={e => handleChange('diplome', e.target.value)} placeholder="ex: Bac, BTS, Licence..." />
              </div>
            </div>
          </div>

          {/* 7. Contact d'Urgence */}
          <div>
            <SectionTitle>🔹 7. Contact d'Urgence</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="personne_urgence">Personne à contacter</Label>
                <Input id="personne_urgence" value={formData.personne_urgence} onChange={e => handleChange('personne_urgence', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="telephone_urgence">Téléphone du contact</Label>
                <Input id="telephone_urgence" value={formData.telephone_urgence} onChange={e => handleChange('telephone_urgence', e.target.value)} />
              </div>
            </div>
          </div>

          {/* 8. Statut Global */}
          <div>
            <SectionTitle>🔹 8. Statut Global</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="statut">Statut *</Label>
                <select id="statut" value={formData.statut} onChange={e => handleChange('statut', e.target.value)} className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm" required>
                  {statuts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
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
