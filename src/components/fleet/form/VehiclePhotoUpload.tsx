import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface VehiclePhotoUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  vehicleNumero?: string;
}

export const VehiclePhotoUpload = ({ value, onChange, vehicleNumero }: VehiclePhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Format invalide', description: 'Veuillez sélectionner une image.', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Fichier trop volumineux', description: 'Maximum 10 Mo.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const safeNumero = (vehicleNumero || 'vehicle').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filePath = `vehicules/${safeNumero}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
      onChange(data.publicUrl);
      toast({ title: 'Photo téléchargée', description: 'La photo du véhicule a été enregistrée.' });
    } catch (err: any) {
      console.error('Erreur upload photo:', err);
      toast({ title: 'Erreur', description: err.message || 'Impossible de télécharger la photo.', variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Photo du véhicule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {value ? (
          <div className="relative inline-block">
            <img
              src={value}
              alt="Véhicule"
              className="max-h-64 rounded-md border border-border object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={() => onChange(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 border-2 border-dashed border-border rounded-md bg-muted/30">
            <p className="text-sm text-muted-foreground">Aucune photo</p>
          </div>
        )}

        <div>
          <Label htmlFor="vehicle-photo-upload" className="cursor-pointer">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {value ? 'Remplacer la photo' : 'Ajouter une photo'}
                </>
              )}
            </div>
            <input
              id="vehicle-photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </Label>
          <p className="text-xs text-muted-foreground mt-2">JPG, PNG ou WebP — 10 Mo max.</p>
        </div>
      </CardContent>
    </Card>
  );
};
