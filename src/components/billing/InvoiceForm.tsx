import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calculator, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { billingService } from '@/services/billing';
import { tarifsHydrocarburesService, TarifHydrocarbure } from '@/services/tarifsHydrocarburesService';

interface InvoiceFormProps {
  onClose: () => void;
  onInvoiceCreated?: () => void;
}

interface InvoiceFormData {
  clientNom: string;
  clientSociete: string;
  clientContact: string;
  clientEmail: string;
  missionNumero: string;
  dateEmission: string;
  dateEcheance: string;
  chauffeur: string;
  vehicule: string;
  typeTransport: string;
  lieuDepart?: string;
  destination?: string;
  observations: string;
}

interface InvoiceLine {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
}

export const InvoiceForm = ({ onClose, onInvoiceCreated }: InvoiceFormProps) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>();
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([
    { id: '1', description: '', quantite: 1, prixUnitaire: 0, total: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lieuxDepart, setLieuxDepart] = useState<string[]>([]);
  const [tarifsDisponibles, setTarifsDisponibles] = useState<TarifHydrocarbure[]>([]);
  
  // Observer les valeurs importantes
  const typeTransport = watch('typeTransport');
  const lieuDepart = watch('lieuDepart');
  const destination = watch('destination');

  const TVA_RATE = 0.18;

  useEffect(() => {
    const loadTarifsData = async () => {
      console.log('Chargement des lieux de départ...');
      const lieux = await tarifsHydrocarburesService.getLieuxDepart();
      console.log('Lieux de départ chargés:', lieux);
      setLieuxDepart(lieux);
    };
    loadTarifsData();
  }, []);

  // Charger les destinations quand le lieu de départ change
  useEffect(() => {
    const loadDestinations = async () => {
      if (typeTransport === 'hydrocarbures' && lieuDepart) {
        console.log('Chargement destinations pour:', lieuDepart);
        const tarifs = await tarifsHydrocarburesService.getDestinations(lieuDepart);
        console.log('Destinations chargées:', tarifs);
        setTarifsDisponibles(tarifs);
        // Reset destination si elle n'est plus valide
        setValue('destination', '');
      }
    };
    loadDestinations();
  }, [lieuDepart, typeTransport, setValue]);

  // Mettre à jour automatiquement la ligne de facture quand destination change
  useEffect(() => {
    const updateInvoiceLineForHydrocarbures = async () => {
      if (typeTransport === 'hydrocarbures' && lieuDepart && destination) {
        console.log('Mise à jour ligne pour:', lieuDepart, '→', destination);
        const tarif = await tarifsHydrocarburesService.getTarif(lieuDepart, destination);
        if (tarif) {
          console.log('Tarif trouvé:', tarif);
          // Mettre à jour la première ligne avec les données hydrocarbures
          setInvoiceLines(lines => lines.map((line, index) => {
            if (index === 0) { // Première ligne
              return {
                ...line,
                description: `Transport hydrocarbures ${lieuDepart} → ${destination}`,
                prixUnitaire: tarif.tarif_au_litre,
                total: line.quantite * tarif.tarif_au_litre
              };
            }
            return line;
          }));
        }
      }
    };
    updateInvoiceLineForHydrocarbures();
  }, [typeTransport, lieuDepart, destination]);

  // Reset des champs hydrocarbures quand on change de type de transport
  useEffect(() => {
    if (typeTransport !== 'hydrocarbures') {
      setValue('lieuDepart', '');
      setValue('destination', '');
      setTarifsDisponibles([]);
      // Reset première ligne si c'était hydrocarbures
      setInvoiceLines(lines => lines.map((line, index) => {
        if (index === 0 && line.description.includes('Transport hydrocarbures')) {
          return {
            ...line,
            description: '',
            prixUnitaire: 0,
            total: 0
          };
        }
        return line;
      }));
    }
  }, [typeTransport, setValue]);

  const addInvoiceLine = () => {
    const newLine: InvoiceLine = {
      id: Date.now().toString(),
      description: '',
      quantite: 1,
      prixUnitaire: 0,
      total: 0
    };
    setInvoiceLines([...invoiceLines, newLine]);
  };

  const removeInvoiceLine = (id: string) => {
    setInvoiceLines(invoiceLines.filter(line => line.id !== id));
  };

  const updateInvoiceLine = (id: string, field: keyof InvoiceLine, value: string | number) => {
    setInvoiceLines(invoiceLines.map(line => {
      if (line.id === id) {
        const updatedLine = { ...line, [field]: value };
        if (field === 'quantite' || field === 'prixUnitaire') {
          updatedLine.total = updatedLine.quantite * updatedLine.prixUnitaire;
        }
        return updatedLine;
      }
      return line;
    }));
  };

  const calculateTotals = () => {
    const sousTotal = invoiceLines.reduce((sum, line) => sum + line.total, 0);
    const tva = sousTotal * TVA_RATE;
    const total = sousTotal + tva;
    return { sousTotal, tva, total };
  };

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      const { sousTotal, tva, total } = calculateTotals();
      
      const factureData = {
        numero: `F${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
        client_nom: data.clientNom,
        client_societe: data.clientSociete || null,
        client_contact: data.clientContact || null,
        client_email: data.clientEmail || null,
        mission_numero: data.missionNumero || null,
        date_emission: data.dateEmission,
        date_echeance: data.dateEcheance,
        chauffeur: data.chauffeur || null,
        vehicule: data.vehicule || null,
        type_transport: data.typeTransport || null,
        montant_ht: sousTotal,
        montant_tva: tva,
        montant_ttc: total,
        statut: 'en_attente',
        observations: data.observations || null
      };

      const lignes = invoiceLines.map(line => ({
        description: line.description,
        quantite: line.quantite,
        prix_unitaire: line.prixUnitaire,
        total: line.total
      }));

      const facture = await billingService.createFacture(factureData, lignes);
      
      toast({
        title: "Facture créée avec succès",
        description: `La facture ${facture.numero} a été créée et est en attente de paiement.`,
      });

      onInvoiceCreated?.();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la création de la facture.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { sousTotal, tva, total } = calculateTotals();

  const isHydrocarburesSelected = typeTransport === 'hydrocarbures';
  const isFirstLineHydrocarbures = isHydrocarburesSelected && invoiceLines[0]?.description.includes('Transport hydrocarbures');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informations client */}
      <Card>
        <CardHeader>
          <CardTitle>Informations client</CardTitle>
          <CardDescription>Détails du client pour cette facture</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientNom">Nom du client *</Label>
            <Input
              id="clientNom"
              {...register('clientNom', { required: 'Le nom du client est requis' })}
              placeholder="Nom du client"
            />
            {errors.clientNom && (
              <p className="text-sm text-red-600">{errors.clientNom.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientSociete">Société</Label>
            <Input
              id="clientSociete"
              {...register('clientSociete')}
              placeholder="Nom de la société"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientContact">Contact</Label>
            <Input
              id="clientContact"
              {...register('clientContact')}
              placeholder="Téléphone / Personne de contact"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clientEmail">Email</Label>
            <Input
              id="clientEmail"
              type="email"
              {...register('clientEmail')}
              placeholder="email@client.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Informations mission */}
      <Card>
        <CardHeader>
          <CardTitle>Détails de la mission</CardTitle>
          <CardDescription>Informations sur la mission à facturer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="missionNumero">N° Mission</Label>
              <Input
                id="missionNumero"
                {...register('missionNumero')}
                placeholder="M2024-001"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="typeTransport">Type de transport *</Label>
              <Select onValueChange={(value) => setValue('typeTransport', value)}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white shadow-lg border">
                  <SelectItem value="hydrocarbures">Hydrocarbures</SelectItem>
                  <SelectItem value="bauxite">Bauxite</SelectItem>
                  <SelectItem value="marchandises_generales">Marchandises générales</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="chauffeur">Chauffeur</Label>
              <Input
                id="chauffeur"
                {...register('chauffeur')}
                placeholder="Nom du chauffeur"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicule">Véhicule</Label>
              <Input
                id="vehicule"
                {...register('vehicule')}
                placeholder="Immatriculation véhicule"
              />
            </div>
          </div>

          {/* Champs spécifiques aux hydrocarbures */}
          {isHydrocarburesSelected && (
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
                🛢️ Configuration transport hydrocarbures
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lieuDepart">Lieu de départ *</Label>
                  <Select onValueChange={(value) => setValue('lieuDepart', value)} value={lieuDepart || ''}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionner le lieu de départ" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white shadow-lg border">
                      {lieuxDepart.map(lieu => (
                        <SelectItem key={lieu} value={lieu} className="hover:bg-gray-100">
                          {lieu}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination *</Label>
                  <Select 
                    onValueChange={(value) => setValue('destination', value)} 
                    value={destination || ''}
                    disabled={!lieuDepart}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Sélectionner la destination" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white shadow-lg border">
                      {tarifsDisponibles.map(tarif => (
                        <SelectItem key={tarif.destination} value={tarif.destination} className="hover:bg-gray-100">
                          {tarif.destination} ({tarif.tarif_au_litre.toLocaleString('fr-FR')} GNF/L)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {lieuDepart && destination && (
                <div className="mt-3 p-2 bg-white rounded border">
                  <p className="text-sm text-gray-600">
                    ✅ Tarif automatiquement appliqué pour {lieuDepart} → {destination}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Dates</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateEmission">Date d'émission *</Label>
            <Input
              id="dateEmission"
              type="date"
              {...register('dateEmission', { required: 'La date d\'émission est requise' })}
              defaultValue={new Date().toISOString().split('T')[0]}
            />
            {errors.dateEmission && (
              <p className="text-sm text-red-600">{errors.dateEmission.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dateEcheance">Date d'échéance *</Label>
            <Input
              id="dateEcheance"
              type="date"
              {...register('dateEcheance', { required: 'La date d\'échéance est requise' })}
            />
            {errors.dateEcheance && (
              <p className="text-sm text-red-600">{errors.dateEcheance.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lignes de facturation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lignes de facturation</span>
            <Button type="button" onClick={addInvoiceLine} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une ligne
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoiceLines.map((line, index) => (
            <div key={line.id} className="border rounded-lg p-4">
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <Label>Description</Label>
                  <Input
                    value={line.description}
                    onChange={(e) => updateInvoiceLine(line.id, 'description', e.target.value)}
                    placeholder={
                      index === 0 && isHydrocarburesSelected 
                        ? "Auto-généré selon sélection hydrocarbures" 
                        : "Description du service/produit"
                    }
                    disabled={index === 0 && isFirstLineHydrocarbures}
                    className={index === 0 && isFirstLineHydrocarbures ? "bg-blue-50" : ""}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Quantité (Litres)</Label>
                  <Input
                    type="number"
                    value={line.quantite}
                    onChange={(e) => updateInvoiceLine(line.id, 'quantite', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Prix unitaire (GNF/L)</Label>
                  <Input
                    type="number"
                    value={line.prixUnitaire}
                    onChange={(e) => updateInvoiceLine(line.id, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="1"
                    disabled={index === 0 && isFirstLineHydrocarbures}
                    className={index === 0 && isFirstLineHydrocarbures ? "bg-blue-50" : ""}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Total (GNF)</Label>
                  <Input
                    value={line.total.toLocaleString('fr-FR')}
                    readOnly
                    className="bg-gray-50 font-medium"
                  />
                </div>
                <div className="col-span-1">
                  {invoiceLines.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInvoiceLine(line.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Calculs totaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Totaux
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md ml-auto">
            <div className="flex justify-between">
              <span>Sous-total HT:</span>
              <span className="font-medium">{sousTotal.toLocaleString('fr-FR')} GNF</span>
            </div>
            <div className="flex justify-between">
              <span>TVA (18%):</span>
              <span className="font-medium">{tva.toLocaleString('fr-FR')} GNF</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total TTC:</span>
              <span>{total.toLocaleString('fr-FR')} GNF</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observations */}
      <Card>
        <CardHeader>
          <CardTitle>Observations</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('observations')}
            placeholder="Observations ou notes particulières..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Création...' : 'Créer la facture'}
        </Button>
      </div>
    </form>
  );
};