
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, FileText, CheckCircle, X } from 'lucide-react';
import { vehiculesService } from '@/services/vehicules';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
}

interface VehicleImportProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export const VehicleImport: React.FC<VehicleImportProps> = ({ onSuccess, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.roles?.includes('admin') || user?.role === 'admin';

  // Si pas admin, ne pas afficher le composant
  if (!isAdmin) {
    return null;
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await vehiculesService.importVehicles(file);
      setImportResult(result);
      
      if (result.success) {
        toast({
          title: "Import réussi",
          description: `${result.imported} véhicules importés avec succès`,
        });
        onSuccess?.();
      } else {
        toast({
          title: "Erreur d'import",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur import:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'import",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateUrl = '/templates/template-vehicules.xlsx';
    const link = document.createElement('a');
    link.href = templateUrl;
    link.download = 'template-vehicules.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Véhicules
        </CardTitle>
        <CardDescription>
          Importez vos véhicules depuis un fichier Excel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Télécharger le modèle
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Sélectionner le fichier Excel
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {file && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Fichier sélectionné: {file.name}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleImport}
          disabled={!file || isImporting}
          className="w-full"
        >
          {isImporting ? 'Import en cours...' : 'Importer les véhicules'}
        </Button>

        {importResult && (
          <Alert className={importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {importResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <X className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={importResult.success ? 'text-green-700' : 'text-red-700'}>
              {importResult.message}
              {importResult.errors.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {importResult.errors.map((error, index) => (
                    <li key={index} className="text-sm">• {error}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
