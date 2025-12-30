import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Truck,
  User,
  Eye,
  AlertOctagon,
  Loader2,
  WifiOff,
  Pen,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { inopineService } from '@/services/inopineService';
import { ControleInopine, ControleInopineItem, INOPINE_CATEGORIES } from '@/types/inopine';
import { InopineCheckItem } from './InopineCheckItem';
import { SignaturePad } from './SignaturePad';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InopineControlFormProps {
  controlId?: string;
  vehiculeId?: string;
  chauffeurId?: string;
  vehiculeInfo?: { numero: string; immatriculation: string };
  chauffeurInfo?: { nom: string; prenom: string };
  onComplete?: () => void;
  onCancel?: () => void;
}

export const InopineControlForm: React.FC<InopineControlFormProps> = ({
  controlId,
  vehiculeId,
  chauffeurId,
  vehiculeInfo,
  chauffeurInfo,
  onComplete,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const [currentControl, setCurrentControl] = useState<ControleInopine | null>(null);
  const [items, setItems] = useState<ControleInopineItem[]>([]);
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
    inopineService.getCurrentPosition()
      .then(setLocation)
      .catch(err => console.warn('Géolocalisation non disponible:', err));
  }, []);

  // Charger un contrôle existant
  const { isLoading: isLoadingControl } = useQuery({
    queryKey: ['inopine-control', controlId],
    queryFn: () => inopineService.getControlById(controlId!),
    enabled: !!controlId,
    staleTime: 0,
  });

  // Créer un nouveau contrôle
  const createMutation = useMutation({
    mutationFn: () => inopineService.createControl({
      vehicule_id: vehiculeId!,
      chauffeur_id: chauffeurId!,
      latitude: location?.latitude,
      longitude: location?.longitude,
    }),
    onSuccess: async (control) => {
      setCurrentControl(control);
      // Recharger pour avoir les items
      const fullControl = await inopineService.getControlById(control.id);
      if (fullControl) {
        setCurrentControl(fullControl);
        setItems(fullControl.items || []);
      }
      toast.success('Contrôle INOPINÉ créé');
    },
    onError: (error) => {
      console.error('Erreur création contrôle:', error);
      toast.error('Erreur lors de la création du contrôle');
    },
  });

  // Mettre à jour un item
  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: Partial<ControleInopineItem> }) =>
      inopineService.updateControlItem(itemId, updates),
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
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const signatureUrl = await inopineService.uploadSignature(currentControl!.id, type, blob);
      await inopineService.signControl(currentControl!.id, type, signatureUrl);
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
    mutationFn: () => inopineService.finalizeControl(currentControl!.id, observations),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inopine-controls'] });
      toast.success('Contrôle INOPINÉ finalisé');
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
  const nonCriticalFailed = items.filter(i => !i.is_critical && i.is_conforme === false).length;
  const allChecked = checkedItems === totalItems && totalItems > 0;

  // Vérifier les commentaires obligatoires
  const missingComments = items.filter(i => i.is_conforme === false && !i.commentaire?.trim()).length;

  // Déterminer le statut
  const isNonConforme = criticalFailed > 0 || nonCriticalFailed > 2;
  const isConformeAvecReserve = !isNonConforme && nonCriticalFailed > 0;
  
  const canFinalize = allChecked && 
    missingComments === 0 &&
    currentControl?.confirmation_controleur && 
    currentControl?.confirmation_chauffeur;

  // Grouper les items par catégorie
  const itemsByCategory = INOPINE_CATEGORIES.map(category => ({
    ...category,
    items: items.filter(item => item.categorie === category.libelle),
  }));

  const handleItemUpdate = (itemId: string, updates: Partial<ControleInopineItem>) => {
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

  const getStatusBadge = () => {
    if (!allChecked) return null;
    if (isNonConforme) {
      return <Badge variant="destructive">NON CONFORME</Badge>;
    }
    if (isConformeAvecReserve) {
      return <Badge className="bg-orange-500">CONFORME AVEC RÉSERVE</Badge>;
    }
    return <Badge className="bg-green-600">CONFORME</Badge>;
  };

  return (
    <div className="space-y-6 pb-24">
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

      {/* En-tête avec infos */}
      <Card className="border-orange-200 bg-orange-50/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                  <Eye className="h-3 w-3 mr-1" />
                  CONTRÔLE INOPINÉ
                </Badge>
                {getStatusBadge()}
              </div>
              <CardDescription className="mt-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {format(new Date(), 'PPPp', { locale: fr })}
              </CardDescription>
            </div>
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
            {missingComments > 0 && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {missingComments} commentaire(s) obligatoire(s) manquant(s)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerte si non conforme */}
      {isNonConforme && allChecked && (
        <Alert variant="destructive">
          <AlertOctagon className="h-4 w-4" />
          <AlertTitle>Contrôle NON CONFORME</AlertTitle>
          <AlertDescription>
            {criticalFailed > 0 && (
              <p>{criticalFailed} point(s) critique(s) non conforme(s).</p>
            )}
            {nonCriticalFailed > 2 && (
              <p>Plus de 2 points non critiques non conformes.</p>
            )}
            Des actions correctives seront automatiquement déclenchées.
          </AlertDescription>
        </Alert>
      )}

      {/* Points de contrôle par catégorie */}
      {itemsByCategory.map((category) => (
        <div key={category.code} className="space-y-3">
          <h3 className="font-semibold text-lg sticky top-0 bg-background py-2 z-10 flex items-center gap-2">
            {category.libelle}
            <Badge variant="outline" className="text-xs">
              {category.items.filter(i => i.is_conforme !== null).length}/{category.items.length}
            </Badge>
          </h3>
          <div className="grid gap-3">
            {category.items.map((item) => (
              <InopineCheckItem
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
                <p className="font-medium">Contrôleur HSEQ</p>
                {currentControl?.signature_controleur_date && (
                  <p className="text-xs text-muted-foreground">
                    Signé le {format(new Date(currentControl.signature_controleur_date), 'Pp', { locale: fr })}
                  </p>
                )}
              </div>
            </div>
            {!currentControl?.confirmation_controleur && allChecked && missingComments === 0 && (
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-3 z-20">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button 
          onClick={() => finalizeMutation.mutate()}
          disabled={!canFinalize || finalizeMutation.isPending}
          className={cn(
            'flex-1',
            isNonConforme && 'bg-destructive hover:bg-destructive/90',
            isConformeAvecReserve && 'bg-orange-500 hover:bg-orange-600'
          )}
        >
          {finalizeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isNonConforme ? 'Clôturer (NC)' : isConformeAvecReserve ? 'Valider avec réserve' : 'Valider le contrôle'}
        </Button>
      </div>

      {/* Dialog signature */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-md">
          <SignaturePad
            title={signatureType === 'controleur' ? 'Signature Contrôleur' : 'Signature Chauffeur'}
            onSave={(dataUrl) => signMutation.mutate({ type: signatureType, dataUrl })}
            onCancel={() => setShowSignatureDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
