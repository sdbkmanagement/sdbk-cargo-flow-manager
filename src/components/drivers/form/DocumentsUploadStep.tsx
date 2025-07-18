
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Upload, Trash2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentUpload {
  id: string;
  titre: string;
  dateEmission: string;
  dateExpiration: string;
  file?: File;
  url?: string;
}

interface DocumentsUploadStepProps {
  documents: DocumentUpload[];
  onDocumentsChange: (documents: DocumentUpload[]) => void;
}

export const DocumentsUploadStep = ({ documents, onDocumentsChange }: DocumentsUploadStepProps) => {
  const { toast } = useToast();

  const addDocument = () => {
    const newDocument: DocumentUpload = {
      id: Date.now().toString(),
      titre: '',
      dateEmission: '',
      dateExpiration: ''
    };
    onDocumentsChange([...documents, newDocument]);
  };

  const updateDocument = (id: string, field: keyof DocumentUpload, value: any) => {
    const updatedDocuments = documents.map(doc => 
      doc.id === id ? { ...doc, [field]: value } : doc
    );
    onDocumentsChange(updatedDocuments);
  };

  const removeDocument = (id: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== id);
    onDocumentsChange(updatedDocuments);
  };

  const handleFileUpload = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      updateDocument(id, 'file', file);
      toast({
        title: "Fichier sélectionné",
        description: `${file.name} a été sélectionné pour upload`,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Autres documents
          </div>
          <Button onClick={addDocument} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un document
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucun document ajouté</p>
            <p className="text-sm">Cliquez sur "Ajouter un document" pour commencer</p>
          </div>
        ) : (
          documents.map((document) => (
            <Card key={document.id} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`titre-${document.id}`}>Titre du document *</Label>
                  <Input
                    id={`titre-${document.id}`}
                    value={document.titre}
                    onChange={(e) => updateDocument(document.id, 'titre', e.target.value)}
                    placeholder="Ex: Attestation de formation ADR"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`emission-${document.id}`}>Date d'émission</Label>
                  <Input
                    id={`emission-${document.id}`}
                    type="date"
                    value={document.dateEmission}
                    onChange={(e) => updateDocument(document.id, 'dateEmission', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`expiration-${document.id}`}>Date d'expiration</Label>
                  <Input
                    id={`expiration-${document.id}`}
                    type="date"
                    value={document.dateExpiration}
                    onChange={(e) => updateDocument(document.id, 'dateExpiration', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <Label htmlFor={`file-${document.id}`}>Fichier</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`file-${document.id}`}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => handleFileUpload(document.id, e)}
                    className="flex-1"
                  />
                  {document.file && (
                    <div className="flex items-center text-sm text-green-600">
                      <Upload className="w-4 h-4 mr-1" />
                      {document.file.name}
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeDocument(document.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};
