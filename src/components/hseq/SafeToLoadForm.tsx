import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Clock,
  Truck,
  User,
  FileCheck,
  AlertOctagon,
  Loader2,
  WifiOff,
  Pen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hseqService } from '@/services/hseqService';
import { SafeToLoadControl, SafeToLoadItem, SAFE_TO_LOAD_CATEGORIES } from '@/types/hseq';
import { STLCheckItem } from './STLCheckItem';
import { SignaturePad } from './SignaturePad';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SafeToLoadFormProps {
  controlId?: string;
  vehiculeId?: string;
  chauffeurId?: string;
  vehiculeInfo?: { numero: string; immatriculation: string };
  chauffeurInfo?: { nom: string; prenom: string };
  onComplete?: () => void;
  onCancel?: () => void;
}

export const SafeToLoadForm: React.FC<SafeToLoadFormProps> = ({
  controlId,
  vehiculeId,
  chauffeurId,
  vehiculeInfo,
  chauffeurInfo,
  onComplete,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const [currentControl, setCurrentControl] = useState<SafeToLoadControl | null>(null);
  const [items, setItems] = useState<SafeToLoadItem[]>([]);
  const [observations, setObservations] = useState('');
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [signatureType, setSignatureType] = useState<'controleur' | 'chauffeur'>('controleur');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Écouter les changements de connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Récupérer la géolocalisation au chargement
  useEffect(() => {
    hseqService.getCurrentPosition()
      .then(setLocation)
      .catch(err => console.warn('Géolocalisation non disponible:', err));
  }, []);

  // Charger un contrôle existant
  const { isLoading: isLoadingControl } = useQuery({
    queryKey: ['stl-control', controlId],
    queryFn: () => hseqService.getControlById(controlId!),
    enabled: !!controlId,
    staleTime: 0,
  });

  // Créer un nouveau contrôle
  const createMutation = useMutation({
    mutationFn: () => hseqService.createControl({
      vehicule_id: vehiculeId!,
      chauffeur_id: chauffeurId!,
      latitude: location?.latitude,
      longitude: location?.longitude,
    }),
    onSuccess: async (control) => {
      setCurrentControl(control);
      // Recharger pour avoir les items
      const fullControl = await hseqService.getControlById(control.id);
      if (fullControl) {
        setCurrentControl(fullControl);
        setItems(fullControl.items || []);
      }
      toast.success('Contrôle SAFE TO LOAD créé');
    },
    onError: (error) => {
      console.error('Erreur création contrôle:', error);
      toast.error('Erreur lors de la création du contrôle');
    },
  });

  // Mettre à jour un item
  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: Partial<SafeToLoadItem> }) =>
      hseqService.updateControlItem(itemId, updates),
    onSuccess: (updatedItem) => {
      setItems(prev => prev.map(item => 
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      ));
    },
    onError: (error) => {
      console.error('Erreur mise à jour item:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // Signer le contrôle
  const signMutation = useMutation({
    mutationFn: async ({ type, dataUrl }: { type: 'controleur' | 'chauffeur'; dataUrl: string }) => {
      // Convertir dataUrl en blob et uploader
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const signatureUrl = await hseqService.uploadSignature(currentControl!.id, type, blob);
      await hseqService.signControl(currentControl!.id, type, signatureUrl);
      return { type, signatureUrl };
    },
    onSuccess: ({ type, signatureUrl }) => {
      setCurrentControl(prev => prev ? {
        ...prev,
        [`signature_${type}_url`]: signatureUrl,
        [`signature_${type}_date`]: new Date().toISOString(),
        [`confirmation_${type}`]: true,
      } : null);
      setShowSignatureDialog(false);
      toast.success(`Signature ${type === 'controleur' ? 'contrôleur' : 'chauffeur'} enregistrée`);
    },
    onError: (error) => {
      console.error('Erreur signature:', error);
      toast.error('Erreur lors de l\'enregistrement de la signature');
    },
  });

  // Finaliser le contrôle
  const finalizeMutation = useMutation({
    mutationFn: () => hseqService.finalizeControl(currentControl!.id, observations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stl-controls'] });
      toast.success('Contrôle SAFE TO LOAD finalisé');
      onComplete?.();
    },
    onError: (error) => {
      console.error('Erreur finalisation:', error);
      toast.error('Erreur lors de la finalisation');
    },
  });

  // Initialiser un nouveau contrôle si pas d'ID existant
  useEffect(() => {
    if (!controlId && vehiculeId && chauffeurId && !currentControl) {
      createMutation.mutate();
    }
  }, [controlId, vehiculeId, chauffeurId]);

  // Calculer les statistiques de progression
  const checkedItems = items.filter(i => i.is_conforme !== null).length;
  const totalItems = items.length;
  const progressPercent = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;
  
  const criticalFailed = items.filter(i => i.is_critical && i.is_conforme === false).length;
  const anyFailed = items.filter(i => i.is_conforme === false).length;
  const allChecked = checkedItems === totalItems && totalItems > 0;

  const isBlocked = criticalFailed > 0;
  const canFinalize = allChecked && 
    currentControl?.confirmation_controleur && 
    currentControl?.confirmation_chauffeur;

  // Grouper les items par catégorie
  const itemsByCategory = SAFE_TO_LOAD_CATEGORIES.map(category => ({
    ...category,
    items: items.filter(item => item.categorie === category.libelle),
  }));

  const handleItemUpdate = (itemId: string, updates: Partial<SafeToLoadItem>) => {
    if (isOnline) {
      updateItemMutation.mutate({ itemId, updates });
    } else {
      // Mode hors-ligne: mettre à jour localement
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ));
    }
  };

  const openSignature = (type: 'controleur' | 'chauffeur') => {
    setSignatureType(type);
    setShowSignatureDialog(true);
  };

  if (isLoadingControl || createMutation.isPending) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Indicateur hors-ligne */}
      {!isOnline && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Mode hors-ligne</AlertTitle>
          <AlertDescription>
            Les modifications seront synchronisées lors de la reconnexion.
          </AlertDescription>
        </Alert>
      )}

      {/* En-tête avec infos véhicule/chauffeur */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Contrôle SAFE TO LOAD
              </CardTitle>
              <CardDescription>
                {format(new Date(), 'PPPp', { locale: fr })}
              </CardDescription>
            </div>
            {currentControl?.statut && (
              <Badge variant={
                currentControl.statut === 'conforme' ? 'default' :
                currentControl.statut === 'refuse' ? 'destructive' : 'secondary'
              } className={cn(
                'text-sm',
                currentControl.statut === 'conforme' && 'bg-green-600'
              )}>
                {currentControl.statut.toUpperCase()}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {vehiculeInfo?.numero || currentControl?.vehicule?.numero} - 
              {vehiculeInfo?.immatriculation || currentControl?.vehicule?.immatriculation}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>
              {chauffeurInfo?.prenom || currentControl?.chauffeur?.prenom} {chauffeurInfo?.nom || currentControl?.chauffeur?.nom}
            </span>
          </div>
          {location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Barre de progression */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression</span>
              <span className="font-medium">{checkedItems}/{totalItems} points vérifiés</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Alerte si points critiques non conformes */}
      {isBlocked && (
        <Alert variant="destructive">
          <AlertOctagon className="h-4 w-4" />
          <AlertTitle>Chargement interdit – SAFE TO LOAD non conforme</AlertTitle>
          <AlertDescription>
            {criticalFailed} point(s) critique(s) non conforme(s). 
            Le véhicule ne peut pas être autorisé au chargement.
          </AlertDescription>
        </Alert>
      )}

      {/* Points de contrôle par catégorie */}
      {itemsByCategory.map((category) => (
        <div key={category.code} className="space-y-3">
          <h3 className="font-semibold text-lg sticky top-0 bg-background py-2 z-10">
            {category.libelle}
          </h3>
          <div className="grid gap-3">
            {category.items.map((item) => (
              <STLCheckItem
                key={item.id}
                item={item}
                onUpdate={handleItemUpdate}
                disabled={currentControl?.statut !== 'en_cours'}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Observations générales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observations générales</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Notes ou observations supplémentaires..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            className="min-h-[100px]"
            disabled={currentControl?.statut !== 'en_cours'}
          />
        </CardContent>
      </Card>

      {/* Section signatures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signatures digitales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Signature contrôleur */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                currentControl?.confirmation_controleur 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-muted text-muted-foreground'
              )}>
                {currentControl?.confirmation_controleur ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Pen className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="font-medium">Agent HSEQ</p>
                {currentControl?.signature_controleur_date && (
                  <p className="text-xs text-muted-foreground">
                    Signé le {format(new Date(currentControl.signature_controleur_date), 'Pp', { locale: fr })}
                  </p>
                )}
              </div>
            </div>
            {!currentControl?.confirmation_controleur && allChecked && (
              <Button size="sm" onClick={() => openSignature('controleur')}>
                Signer
              </Button>
            )}
            {currentControl?.signature_controleur_url && (
              <img 
                src={currentControl.signature_controleur_url} 
                alt="Signature contrôleur"
                className="h-12 w-24 object-contain border rounded"
              />
            )}
          </div>

          {/* Signature chauffeur */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                currentControl?.confirmation_chauffeur 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-muted text-muted-foreground'
              )}>
                {currentControl?.confirmation_chauffeur ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Pen className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="font-medium">Chauffeur</p>
                {currentControl?.signature_chauffeur_date && (
                  <p className="text-xs text-muted-foreground">
                    Signé le {format(new Date(currentControl.signature_chauffeur_date), 'Pp', { locale: fr })}
                  </p>
                )}
              </div>
            </div>
            {!currentControl?.confirmation_chauffeur && currentControl?.confirmation_controleur && (
              <Button size="sm" onClick={() => openSignature('chauffeur')}>
                Signer
              </Button>
            )}
            {currentControl?.signature_chauffeur_url && (
              <img 
                src={currentControl.signature_chauffeur_url} 
                alt="Signature chauffeur"
                className="h-12 w-24 object-contain border rounded"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Boutons d'action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button 
          onClick={() => finalizeMutation.mutate()}
          disabled={!canFinalize || finalizeMutation.isPending}
          className={cn(
            'flex-1',
            isBlocked && 'bg-destructive hover:bg-destructive/90'
          )}
        >
          {finalizeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isBlocked ? 'Refuser' : 'Valider le contrôle'}
        </Button>
      </div>

      {/* Dialog signature */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-md">
          <SignaturePad
            title={signatureType === 'controleur' ? 'Signature Agent HSEQ' : 'Signature Chauffeur'}
            onSave={(dataUrl) => signMutation.mutate({ type: signatureType, dataUrl })}
            onCancel={() => setShowSignatureDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
