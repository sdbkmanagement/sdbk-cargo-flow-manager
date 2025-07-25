
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, FileText, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface DocumentUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number;
  acceptedTypes?: string[];
}

export const DocumentUpload = ({ 
  onFilesChange, 
  maxFiles = 5,
  maxSizePerFile = 10,
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png']
}: DocumentUploadProps) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (type.includes('image')) return <Image className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Type de fichier non autorisé. Formats acceptés: ${acceptedTypes.map(type => 
        type.split('/')[1].toUpperCase()).join(', ')}`;
    }

    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSizePerFile) {
      return `Fichier trop volumineux. Taille maximum: ${maxSizePerFile}MB`;
    }

    if (files.length >= maxFiles) {
      return `Nombre maximum de fichiers atteint (${maxFiles})`;
    }

    return null;
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    const fileName = `chauffeurs/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erreur upload Supabase:', error);
      throw new Error('Erreur lors de l\'upload du fichier');
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleFileSelect = async (selectedFiles: FileList) => {
    const fileArray = Array.from(selectedFiles);
    setUploading(true);
    
    for (const file of fileArray) {
      const error = validateFile(file);
      
      if (error) {
        toast({
          title: "Erreur d'upload",
          description: error,
          variant: "destructive"
        });
        continue;
      }

      try {
        const fileUrl = await uploadFileToStorage(file);
        
        const newFile: UploadedFile = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          url: fileUrl
        };

        const updatedFiles = [...files, newFile];
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);

        toast({
          title: "Fichier ajouté",
          description: `${file.name} a été téléchargé avec succès`,
        });
      } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        toast({
          title: "Erreur d'upload",
          description: `Impossible de télécharger ${file.name}`,
          variant: "destructive"
        });
      }
    }
    
    setUploading(false);
  };

  const removeFile = async (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove) {
      try {
        // Extract file path from URL for deletion
        const urlParts = fileToRemove.url.split('/documents/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage
            .from('documents')
            .remove([filePath]);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }

    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
    
    toast({
      title: "Fichier supprimé",
      description: "Le fichier a été retiré de la liste",
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging 
            ? 'border-orange-500 bg-orange-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="space-y-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={openFileDialog}
            disabled={uploading}
          >
            {uploading ? 'Téléchargement...' : 'Télécharger les documents'}
          </Button>
          <p className="text-sm text-gray-500">
            ou glissez-déposez vos fichiers ici
          </p>
          <p className="text-xs text-gray-400">
            PDF, JPG, PNG jusqu'à {maxSizePerFile}MB chacun (max {maxFiles} fichiers)
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
      />

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Documents téléchargés:</h4>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center space-x-3">
                {getFileIcon(file.type)}
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {file.type.split('/')[1].toUpperCase()}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="text-red-600 hover:text-red-800"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
