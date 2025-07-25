import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface ExcelImportProps {
  title: string;
  description: string;
  templateColumns: string[];
  onImport: (data: any[]) => Promise<{ success: number; errors: string[] }>;
  onClose: () => void;
}

export const ExcelImport: React.FC<ExcelImportProps> = ({
  title,
  description,
  templateColumns,
  onImport,
  onClose
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fonction utilitaire pour parser les dates Excel (même logique que DriversImport)
  const parseExcelDate = (value: any): Date | null => {
    if (!value) return null;
    
    // Si c'est un nombre (format Excel), convertir depuis l'époque Excel
    if (typeof value === 'number') {
      // Excel compte les jours depuis le 1er janvier 1900
      // Attention : Excel considère à tort 1900 comme une année bissextile
      const excelEpoch = new Date(1899, 11, 30); // 30 décembre 1899
      return new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    }
    
    // Si c'est une chaîne, essayer de la parser
    if (typeof value === 'string') {
      // Essayer différents formats
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // Essayer le format DD/MM/YYYY
      const parts = value.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Les mois commencent à 0
        const year = parseInt(parts[2]);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    // Si c'est déjà un objet Date
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    
    return null;
  };

  // Fonction pour formater les valeurs pour l'affichage
  const formatValueForDisplay = (key: string, value: any): string => {
    if (!value && value !== 0) return '';
    
    // Liste des colonnes qui contiennent des dates
    const dateColumns = ['date_naissance', 'date_embauche', 'date_obtention_permis', 'date_expiration_permis'];
    
    if (dateColumns.includes(key.toLowerCase())) {
      const parsedDate = parseExcelDate(value);
      if (parsedDate) {
        return parsedDate.toLocaleDateString('fr-FR');
      }
    }
    
    return String(value);
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([templateColumns]);
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `template_${title.toLowerCase().replace(/\s+/g, '_')}.xlsx`);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
        toast({
          title: "Format invalide",
          description: "Veuillez sélectionner un fichier Excel (.xlsx ou .xls)",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir en JSON avec l'option header: 1 pour utiliser la première ligne comme en-têtes
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          throw new Error("Le fichier doit contenir au moins une ligne d'en-tête et une ligne de données");
        }
        
        // Extraire les en-têtes et les données
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        // Convertir en objets
        const processedData = rows
          .filter(row => row.some(cell => cell !== undefined && cell !== ''))
          .map((row, index) => {
            const obj: any = { _row: index + 2 }; // +2 car on compte la ligne d'en-tête
            headers.forEach((header, colIndex) => {
              obj[header] = row[colIndex] || '';
            });
            return obj;
          });
        
        setData(processedData);
        setStep('preview');
        toast({
          title: "Fichier traité",
          description: `${processedData.length} lignes détectées`
        });
      } catch (error) {
        console.error('Erreur lors du traitement du fichier:', error);
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Erreur lors du traitement du fichier",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (data.length === 0) return;
    
    setIsProcessing(true);
    try {
      const result = await onImport(data);
      setImportResult(result);
      setStep('result');
      
      if (result.success > 0) {
        toast({
          title: "Import réussi",
          description: `${result.success} enregistrement(s) importé(s)`
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      toast({
        title: "Erreur d'import",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setData([]);
    setImportResult(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Import Excel - {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {step === 'upload' && (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Télécharger le modèle Excel</Label>
                <Button variant="outline" onClick={downloadTemplate}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Télécharger le modèle
                </Button>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Assurez-vous que votre fichier Excel contient les colonnes suivantes : {templateColumns.join(', ')}
                </AlertDescription>
              </Alert>
            </div>

            <div className="space-y-4">
              <Label htmlFor="file-upload">Sélectionner le fichier Excel</Label>
              <div className="flex items-center gap-4">
                <Input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={isProcessing}
                />
                {isProcessing && <div className="text-sm text-muted-foreground">Traitement...</div>}
              </div>
            </div>
          </>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Aperçu des données ({data.length} lignes)</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={reset}>
                  Changer de fichier
                </Button>
                <Button onClick={handleImport} disabled={isProcessing}>
                  {isProcessing ? 'Import en cours...' : 'Confirmer l\'import'}
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ligne</TableHead>
                    {Object.keys(data[0] || {}).filter(key => key !== '_row').map(key => (
                      <TableHead key={key}>{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{row._row}</TableCell>
                      {Object.keys(row).filter(key => key !== '_row').map(key => (
                        <TableCell key={key} className="max-w-32 truncate">
                          {formatValueForDisplay(key, row[key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {data.length > 10 && (
              <p className="text-sm text-muted-foreground">
                Seules les 10 premières lignes sont affichées. {data.length - 10} autres lignes seront importées.
              </p>
            )}
          </div>
        )}

        {step === 'result' && importResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {importResult.success > 0 ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <h3 className="text-lg font-semibold">Résultat de l'import</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                    <div className="text-sm text-muted-foreground">Enregistrements importés</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                    <div className="text-sm text-muted-foreground">Erreurs</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-600">Erreurs détectées :</h4>
                <div className="max-h-32 overflow-auto space-y-1">
                  {importResult.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>
                Nouvel import
              </Button>
              <Button onClick={onClose}>Fermer</Button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <Progress value={undefined} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">
              {step === 'preview' ? 'Import en cours...' : 'Traitement du fichier...'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};