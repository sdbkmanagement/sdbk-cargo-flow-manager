
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Trash2, AlertTriangle } from 'lucide-react';
import { vehiculesService } from '@/services/vehicules';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadSectionProps {
  vehicleId: string;
}

export const DocumentUploadSection = ({ vehicleId }: DocumentUploadSectionProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['vehicle-documents', vehicleId],
    queryFn: () => vehiculesService.getDocuments(vehicleId),
  });

  const documentTypes = [
    'carte_grise',
    'assurance',
    'visite_technique',
    'vignette',
    'certificat_adr',
    'autre'
  ];

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'carte_grise': 'Carte grise',
      'assurance': 'Assurance',
      'visite_technique': 'Visite technique',
      'vignette': 'Vignette',
      'certificat_adr': 'Certificat ADR',
      'autre': 'Autre'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (document: any) => {
    if (!document.date_expiration) {
      return <Badge variant="secondary">Permanent</Badge>;
    }
    
    const expirationDate = new Date(document.date_expiration);
    const today = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    if (expirationDate < today) {
      return <Badge variant="destructive">Expiré</Badge>;
    } else if (expirationDate < thirtyDaysFromNow) {
      return <Badge className="bg-orange-100 text-orange-800">À renouveler</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800">Valide</Badge>;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Simulation d'upload - ici vous intégreriez avec Supabase Storage
      const mockUrl = `https://example.com/documents/${file.name}`;
      
      // Dans un vrai projet, vous uploaderiez le fichier vers Supabase Storage
      // et récupéreriez l'URL publique
      
      toast({
        title: 'Document uploadé',
        description: `Le document ${getDocumentTypeLabel(type)} a été uploadé avec succès.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['vehicle-documents', vehicleId] });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'uploader le document.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents du véhicule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documentTypes.map((type) => {
            const existingDoc = documents.find(doc => doc.type === type);
            
            return (
              <div key={type} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{getDocumentTypeLabel(type)}</h4>
                  {existingDoc && getStatusBadge(existingDoc)}
                </div>
                
                {existingDoc ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>{existingDoc.nom}</span>
                    </div>
                    {existingDoc.date_expiration && (
                      <div className="flex items-center gap-2 text-sm">
                        {new Date(existingDoc.date_expiration) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                        <span>Expire le {new Date(existingDoc.date_expiration).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={existingDoc.url} target="_blank" rel="noopener noreferrer">
                          Voir
                        </a>
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Aucun document uploadé</p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, type)}
                        className="hidden"
                        disabled={uploading}
                      />
                      <Button size="sm" variant="outline" disabled={uploading} asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {uploading ? 'Upload...' : 'Uploader'}
                        </span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Types de documents acceptés :</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Carte grise (obligatoire)</li>
            <li>• Certificat d'assurance (obligatoire)</li>
            <li>• Certificat de visite technique (obligatoire)</li>
            <li>• Vignette (si applicable)</li>
            <li>• Certificat ADR pour transport de matières dangereuses</li>
            <li>• Formats acceptés : PDF, JPG, PNG (max 10MB)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
