
import React from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VehicleDocumentsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch: UseFormWatch<any>;
}

export const VehicleDocuments = ({ register, errors, watch }: VehicleDocumentsProps) => {
  const typeVehicule = watch('type_vehicule');

  const documentsRequis = [
    {
      name: 'autorisation_transport',
      label: 'Autorisation transport (carte rouge ou bleue)',
      hasExpiration: true
    },
    {
      name: 'conformite',
      label: 'Conformité',
      hasExpiration: true
    },
    {
      name: 'controle_technique',
      label: 'Contrôle technique annuel',
      hasExpiration: true
    },
    {
      name: 'controle_socotac',
      label: 'Contrôle SOCOTAC',
      hasExpiration: true
    },
    {
      name: 'certificat_jaugeage',
      label: 'Certificat de jaugeage / Baremage',
      hasExpiration: true
    },
    {
      name: 'attestation_extincteurs',
      label: 'Attestation contrôle extincteurs',
      hasExpiration: true
    },
    {
      name: 'numero_police',
      label: 'Numéro de police',
      hasExpiration: false
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents du véhicule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Tous les documents et dates sont optionnels. Les documents avec dates d'expiration généreront des alertes automatiques 1 mois avant échéance.
            Documents sans alerte : Carte grise et Numéro de police.
          </AlertDescription>
        </Alert>

        {/* Section Carte Grise - Différenciée selon le type de véhicule */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">Carte grise</h4>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          
          {typeVehicule === 'tracteur_remorque' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">2 cartes grises (tracteur + remorque) - Optionnel</p>
              
              {/* Carte grise tracteur */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carte_grise_tracteur_file" className="text-sm">
                    Carte grise tracteur
                  </Label>
                  <Input
                    id="carte_grise_tracteur_file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    {...register('carte_grise_tracteur_file')}
                  />
                </div>
              </div>
              
              {/* Carte grise remorque */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carte_grise_remorque_file" className="text-sm">
                    Carte grise remorque
                  </Label>
                  <Input
                    id="carte_grise_remorque_file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    {...register('carte_grise_remorque_file')}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">1 carte grise - Optionnel</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carte_grise_file" className="text-sm">
                    Fichier carte grise
                  </Label>
                  <Input
                    id="carte_grise_file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    {...register('carte_grise_file')}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section Assurance - Différenciée selon le type de véhicule */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">Assurance</h4>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          
          {typeVehicule === 'tracteur_remorque' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">2 assurances (tracteur + remorque) - Optionnel</p>
              
              {/* Assurance tracteur */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assurance_tracteur_file" className="text-sm">
                    Assurance tracteur
                  </Label>
                  <Input
                    id="assurance_tracteur_file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    {...register('assurance_tracteur_file')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assurance_tracteur_expiration" className="text-sm">
                    Date d'expiration assurance tracteur
                  </Label>
                  <Input
                    id="assurance_tracteur_expiration"
                    type="date"
                    {...register('assurance_tracteur_expiration')}
                  />
                </div>
              </div>
              
              {/* Assurance remorque */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assurance_remorque_file" className="text-sm">
                    Assurance remorque
                  </Label>
                  <Input
                    id="assurance_remorque_file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    {...register('assurance_remorque_file')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assurance_remorque_expiration" className="text-sm">
                    Date d'expiration assurance remorque
                  </Label>
                  <Input
                    id="assurance_remorque_expiration"
                    type="date"
                    {...register('assurance_remorque_expiration')}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">1 assurance - Optionnel</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assurance_file" className="text-sm">
                    Fichier assurance
                  </Label>
                  <Input
                    id="assurance_file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    {...register('assurance_file')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assurance_expiration" className="text-sm">
                    Date d'expiration assurance
                  </Label>
                  <Input
                    id="assurance_expiration"
                    type="date"
                    {...register('assurance_expiration')}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Autres documents */}
        <div className="space-y-6">
          {documentsRequis.map((doc) => (
            <div key={doc.name} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{doc.label}</h4>
                {doc.hasExpiration && <AlertCircle className="h-4 w-4 text-amber-500" />}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload du document */}
                <div className="space-y-2">
                  <Label htmlFor={`${doc.name}_file`} className="text-sm">
                    Fichier document
                  </Label>
                  <Input
                    id={`${doc.name}_file`}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    {...register(`${doc.name}_file`)}
                  />
                </div>

                {/* Date d'expiration si applicable */}
                {doc.hasExpiration && (
                  <div className="space-y-2">
                    <Label htmlFor={`${doc.name}_expiration`} className="text-sm">
                      Date d'expiration
                    </Label>
                    <Input
                      id={`${doc.name}_expiration`}
                      type="date"
                      {...register(`${doc.name}_expiration`)}
                    />
                  </div>
                )}

                {/* Numéro de police - champ texte spécial */}
                {doc.name === 'numero_police' && (
                  <div className="space-y-2">
                    <Label htmlFor="numero_police_value" className="text-sm">
                      Numéro de police
                    </Label>
                    <Input
                      id="numero_police_value"
                      {...register('numero_police_value')}
                      placeholder="Saisir le numéro de police"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
