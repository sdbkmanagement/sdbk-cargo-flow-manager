import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Camera, 
  Video,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControleInopineItem } from '@/types/inopine';
import { inopineService } from '@/services/inopineService';
import { toast } from 'sonner';

interface InopineCheckItemProps {
  item: ControleInopineItem;
  onUpdate: (itemId: string, updates: Partial<ControleInopineItem>) => void;
  disabled?: boolean;
}

export const InopineCheckItem: React.FC<InopineCheckItemProps> = ({
  item,
  onUpdate,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showComment, setShowComment] = useState(item.is_conforme === false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConformityChange = (isConforme: boolean) => {
    if (disabled) return;
    onUpdate(item.id, { is_conforme: isConforme });
    // Afficher le champ commentaire si non conforme
    if (!isConforme) {
      setShowComment(true);
    }
  };

  const handleCommentChange = (commentaire: string) => {
    if (disabled) return;
    onUpdate(item.id, { commentaire });
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || disabled) return;

    setIsUploading(true);
    try {
      const url = await inopineService.uploadMedia(item.control_id, file);
      const updatedMedias = [...(item.medias || []), url];
      onUpdate(item.id, { medias: updatedMedias });
      toast.success('Média uploadé');
    } catch (error) {
      console.error('Erreur upload:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeMedia = (index: number) => {
    if (disabled) return;
    const updatedMedias = (item.medias || []).filter((_, i) => i !== index);
    onUpdate(item.id, { medias: updatedMedias });
  };

  // Validation: commentaire obligatoire si non conforme
  const needsComment = item.is_conforme === false && !item.commentaire?.trim();

  return (
    <Card className={cn(
      'transition-all',
      item.is_conforme === true && 'border-green-200 bg-green-50/50',
      item.is_conforme === false && 'border-red-200 bg-red-50/50',
      item.is_critical && 'ring-1 ring-orange-300'
    )}>
      <CardContent className="p-4 space-y-3">
        {/* En-tête avec libellé et badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm">{item.libelle}</p>
              {item.is_critical && (
                <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                  Critique
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{item.categorie}</p>
          </div>
          
          {/* Boutons Oui/Non */}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={item.is_conforme === true ? 'default' : 'outline'}
              className={cn(
                'h-10 w-14',
                item.is_conforme === true && 'bg-green-600 hover:bg-green-700'
              )}
              onClick={() => handleConformityChange(true)}
              disabled={disabled}
            >
              <CheckCircle2 className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={item.is_conforme === false ? 'default' : 'outline'}
              className={cn(
                'h-10 w-14',
                item.is_conforme === false && 'bg-red-600 hover:bg-red-700'
              )}
              onClick={() => handleConformityChange(false)}
              disabled={disabled}
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Zone commentaire (obligatoire si Non) */}
        {showComment && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">
                Commentaire {item.is_conforme === false && <span className="text-red-500">*</span>}
              </label>
              {needsComment && (
                <div className="flex items-center gap-1 text-red-500 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  Obligatoire
                </div>
              )}
            </div>
            <Textarea
              placeholder="Décrivez le problème constaté..."
              value={item.commentaire || ''}
              onChange={(e) => handleCommentChange(e.target.value)}
              className={cn(
                'min-h-[80px] text-sm',
                needsComment && 'border-red-300 focus:border-red-500'
              )}
              disabled={disabled}
            />
          </div>
        )}

        {/* Zone médias (photos/vidéos) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              onChange={handleMediaUpload}
              className="hidden"
              disabled={disabled || isUploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="text-xs"
            >
              <Camera className="h-4 w-4 mr-1" />
              Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'video/*';
                  fileInputRef.current.click();
                  fileInputRef.current.accept = 'image/*,video/*';
                }
              }}
              disabled={disabled || isUploading}
              className="text-xs"
            >
              <Video className="h-4 w-4 mr-1" />
              Vidéo
            </Button>
            {isUploading && (
              <span className="text-xs text-muted-foreground">Upload en cours...</span>
            )}
          </div>

          {/* Aperçu des médias */}
          {item.medias && item.medias.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {item.medias.map((url, index) => (
                <div key={index} className="relative group">
                  {url.includes('video') ? (
                    <video
                      src={url}
                      className="h-16 w-16 object-cover rounded border"
                      controls={false}
                    />
                  ) : (
                    <img
                      src={url}
                      alt={`Média ${index + 1}`}
                      className="h-16 w-16 object-cover rounded border"
                    />
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
