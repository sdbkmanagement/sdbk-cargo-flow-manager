
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { FileText } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { DocumentUpload } from '../DocumentUpload';
import { typePermisOptions } from './steps';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface DocumentsStepProps {
  form: UseFormReturn<any>;
  uploadedDocuments: UploadedFile[];
  onDocumentsChange: (files: UploadedFile[]) => void;
}

export const DocumentsStep = ({ form, uploadedDocuments, onDocumentsChange }: DocumentsStepProps) => {
  const typePermis = form.watch('typePermis') || [];

  const handlePermisChange = (value: string, checked: boolean) => {
    const currentValues = form.getValues('typePermis') || [];
    if (checked) {
      form.setValue('typePermis', [...currentValues, value]);
    } else {
      form.setValue('typePermis', currentValues.filter((v: string) => v !== value));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Documents officiels
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="numeroPermis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de permis *</FormLabel>
                <FormControl>
                  <Input placeholder="Numéro du permis de conduire" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateExpirationPermis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date d'expiration du permis *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <Label>Types de permis autorisés *</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {typePermisOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={typePermis.includes(option.value)}
                  onCheckedChange={(checked) => 
                    handlePermisChange(option.value, checked as boolean)
                  }
                />
                <Label htmlFor={option.value} className="text-sm">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Documents à télécharger</Label>
          <div className="mt-2">
            <DocumentUpload
              onFilesChange={onDocumentsChange}
              maxFiles={5}
              maxSizePerFile={10}
              acceptedTypes={['application/pdf', 'image/jpeg', 'image/png']}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Documents recommandés : Permis de conduire, Visite médicale, Formation ADR, Carte professionnelle
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
