import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SafeToLoadItem } from '@/types/hseq';
import { hseqService } from '@/services/hseqService';
import { toast } from 'sonner';

interface STLCheckItemProps {
  item: SafeToLoadItem;
  onUpdate: (itemId: string, updates: Partial<SafeToLoadItem>) => void;
  disabled?: boolean;
}

export const STLCheckItem: React.FC<STLCheckItemProps> = ({
  item,
  onUpdate,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showComment, setShowComment] = useState(item.is_conforme === false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConformityChange = (isConforme: boolean) => {
    onUpdate(item.id, { is_conforme: isConforme });
    if (!isConforme && item.is_critical) {
      setShowComment(true);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(item.id, { commentaire: e.target.value });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await hseqService.uploadPhoto(item.control_id, file);
      const newPhotos = [...(item.photos || []), url];
      onUpdate(item.id, { photos: newPhotos });
      toast.success('Photo ajoutée');
    } catch (error) {
      console.error('Erreur upload photo:', error);
      toast.error('Erreur lors de l\'upload de la photo');
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = item.photos.filter((_, i) => i !== index);
    onUpdate(item.id, { photos: newPhotos });
  };

  return (
    <Card className={cn(
      'transition-all',
      item.is_conforme === true && 'border-green-500/50 bg-green-50/30 dark:bg-green-950/10',
      item.is_conforme === false && 'border-red-500/50 bg-red-50/30 dark:bg-red-950/10',
    )}>
      <CardContent className="p-4 space-y-3">
        {/* En-tête avec libellé et badge critique */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            {item.is_critical && (
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            )}
            <span className={cn(
              'text-sm font-medium',
              item.is_critical && 'text-destructive'
            )}>
              {item.libelle}
              {item.is_critical && <span className="text-destructive"> *</span>}
            </span>
          </div>
          
          {item.is_critical && (
            <Badge variant="destructive" className="text-xs shrink-0">
              Bloquant
            </Badge>
          )}
        </div>

        {/* Boutons OK / NON OK */}
        <div className="flex gap-2">
          <Button
            variant={item.is_conforme === true ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'flex-1',
              item.is_conforme === true && 'bg-green-600 hover:bg-green-700'
            )}
            onClick={() => handleConformityChange(true)}
            disabled={disabled}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            OK
          </Button>
          <Button
            variant={item.is_conforme === false ? 'destructive' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => handleConformityChange(false)}
            disabled={disabled}
          >
            <XCircle className="h-4 w-4 mr-2" />
            NON OK
          </Button>
        </div>

        {/* Commentaire obligatoire si NON OK */}
        {(showComment || item.is_conforme === false) && (
          <div className="space-y-2">
            <Textarea
              placeholder={item.is_critical 
                ? "Commentaire obligatoire pour point critique..." 
                : "Commentaire optionnel..."
              }
              value={item.commentaire || ''}
              onChange={handleCommentChange}
              className="min-h-[60px] text-sm"
              disabled={disabled}
            />
            
            {/* Section photos */}
            <div className="flex flex-wrap gap-2">
              {item.photos?.map((photo, index) => (
                <div key={index} className="relative w-16 h-16">
                  <img 
                    src={photo} 
                    alt={`Photo ${index + 1}`} 
                    className="w-full h-full object-cover rounded"
                  />
                  {!disabled && (
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              
              {!disabled && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="h-16 w-16"
                  >
                    <Camera className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
