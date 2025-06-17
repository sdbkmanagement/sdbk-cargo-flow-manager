
import React, { useState } from 'react';
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

interface InvoiceFormProps {
  onClose: () => void;
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
  observations: string;
}

interface InvoiceLine {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
}

export const InvoiceForm = ({ onClose }: InvoiceFormProps) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>();
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([
    { id: '1', description: '', quantite: 1, prixUnitaire: 0, total: 0 }
  ]);

  const TVA_RATE = 0.18; // 18% TVA en Guinée

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

  const onSubmit = (data: InvoiceFormData) => {
    const { sousTotal, tva, total } = calculateTotals();
    
    const invoiceData = {
      ...data,
      lignes: invoiceLines,
      montantHT: sousTotal,
      montantTVA: tva,
      montantTTC: total,
      statut: 'en_attente',
      numero: `F${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`
    };

    console.log('Données de la facture:', invoiceData);
    
    toast({
      title: "Facture créée avec succès",
      description: `La facture ${invoiceData.numero} a été créée et est en attente de paiement.`,
    });

    onClose();
  };

  const { sousTotal, tva, total } = calculateTotals();

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
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="missionNumero">N° Mission</Label>
            <Input
              id="missionNumero"
              {...register('missionNumero')}
              placeholder="M2024-001"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="typeTransport">Type de transport</Label>
            <Select onValueChange={(value) => setValue('typeTransport', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
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
            <div key={line.id} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <Label>Description</Label>
                <Input
                  value={line.description}
                  onChange={(e) => updateInvoiceLine(line.id, 'description', e.target.value)}
                  placeholder="Description du service/produit"
                />
              </div>
              <div className="col-span-2">
                <Label>Quantité</Label>
                <Input
                  type="number"
                  value={line.quantite}
                  onChange={(e) => updateInvoiceLine(line.id, 'quantite', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-span-2">
                <Label>Prix unitaire</Label>
                <Input
                  type="number"
                  value={line.prixUnitaire}
                  onChange={(e) => updateInvoiceLine(line.id, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-span-2">
                <Label>Total</Label>
                <Input
                  value={line.total.toFixed(2)}
                  readOnly
                  className="bg-gray-50"
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
              <span className="font-medium">{sousTotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span>TVA (18%):</span>
              <span className="font-medium">{tva.toFixed(2)} €</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total TTC:</span>
              <span>{total.toFixed(2)} €</span>
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
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit">
          Créer la facture
        </Button>
      </div>
    </form>
  );
};
