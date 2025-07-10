import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Wrench, 
  FileCheck, 
  MonitorSpeaker, 
  Shield, 
  Truck, 
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { processusSDBKService, type StatutVehicule } from '@/services/processus-sdbk';
import { MaintenanceDialog } from './MaintenanceDialog';
import { AdministratifDialog } from './AdministratifDialog';
import { OBCDialog } from './OBCDialog';
import { HSSEDialog } from './HSSEDialog';
import { BLDialog } from './BLDialog';
import { useToast } from '@/hooks/use-toast';

interface ProcessusWorkflowCardProps {
  vehiculeId: string;
  vehiculeNumero: string;
  vehiculeStatut: StatutVehicule;
  userRole?: string;
}

const ETAPES_PROCESSUS = [
  { key: 'retour_maintenance', label: 'Retour Maintenance', icon: Wrench },
  { key: 'maintenance_en_cours', label: 'Diagnostic', icon: Wrench },
  { key: 'disponible_maintenance', label: 'Réparation OK', icon: CheckCircle },
  { key: 'verification_admin', label: 'Vérif. Admin', icon: FileCheck },
  { key: 'controle_obc', label: 'Contrôle OBC', icon: MonitorSpeaker },
  { key: 'controle_hsse', label: 'Contrôle HSSE', icon: Shield },
  { key: 'disponible', label: 'Disponible', icon: CheckCircle },
  { key: 'en_mission', label: 'En Mission', icon: Truck }
];

const PERMISSIONS_ETAPES = {
  'retour_maintenance': ['maintenance', 'admin', 'direction'],
  'maintenance_en_cours': ['maintenance', 'admin', 'direction'],
  'disponible_maintenance': ['maintenance', 'admin', 'direction'],
  'verification_admin': ['administratif', 'admin', 'direction'],
  'controle_obc': ['obc', 'admin', 'direction'],
  'controle_hsse': ['hsecq', 'admin', 'direction'],
  'disponible': ['transport', 'admin', 'direction'],
  'en_mission': ['transport', 'admin', 'direction']
};

export const ProcessusWorkflowCard = ({ 
  vehiculeId, 
  vehiculeNumero, 
  vehiculeStatut, 
  userRole = 'admin' 
}: ProcessusWorkflowCardProps) => {
  const [showDialog, setShowDialog] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getEtapeIndex = (statut: StatutVehicule): number => {
    return ETAPES_PROCESSUS.findIndex(etape => etape.key === statut);
  };

  const getProgress = (): number => {
    const index = getEtapeIndex(vehiculeStatut);
    if (index === -1) return 0;
    return ((index + 1) / ETAPES_PROCESSUS.length) * 100;
  };

  const getStatutBadge = (statut: StatutVehicule) => {
    if (statut === 'bloque') {
      return <Badge className="bg-red-500 text-white"><XCircle className="w-3 h-3 mr-1" />Bloqué</Badge>;
    }
    if (statut === 'disponible') {
      return <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Disponible</Badge>;
    }
    if (statut === 'en_mission') {
      return <Badge className="bg-blue-500 text-white"><Truck className="w-3 h-3 mr-1" />En Mission</Badge>;
    }
    return <Badge className="bg-yellow-500 text-white"><Clock className="w-3 h-3 mr-1" />En Cours</Badge>;
  };

  const canInteract = (statut: StatutVehicule): boolean => {
    const permissions = PERMISSIONS_ETAPES[statut];
    return permissions?.includes(userRole) || false;
  };

  const getActionButton = () => {
    if (!canInteract(vehiculeStatut)) return null;

    switch (vehiculeStatut) {
      case 'retour_maintenance':
        return (
          <Button 
            size="sm" 
            onClick={() => setShowDialog('maintenance')}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Démarrer Diagnostic
          </Button>
        );
      case 'disponible_maintenance':
        return (
          <Button 
            size="sm" 
            onClick={() => setShowDialog('administratif')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FileCheck className="w-4 h-4 mr-2" />
            Vérif. Administrative
          </Button>
        );
      case 'verification_admin':
        return (
          <Button 
            size="sm" 
            onClick={() => setShowDialog('obc')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <MonitorSpeaker className="w-4 h-4 mr-2" />
            Contrôle OBC
          </Button>
        );
      case 'controle_obc':
        return (
          <Button 
            size="sm" 
            onClick={() => setShowDialog('hsse')}
            className="bg-red-600 hover:bg-red-700"
          >
            <Shield className="w-4 h-4 mr-2" />
            Contrôle HSSE
          </Button>
        );
      case 'disponible':
        return (
          <Button 
            size="sm" 
            onClick={() => setShowDialog('bl')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Truck className="w-4 h-4 mr-2" />
            Créer Bon de Livraison
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Processus SDBK - {vehiculeNumero}</CardTitle>
            {getStatutBadge(vehiculeStatut)}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progression du processus</span>
              <span>{Math.round(getProgress())}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Timeline des étapes */}
            <div className="flex flex-wrap gap-2">
              {ETAPES_PROCESSUS.map((etape, index) => {
                const Icon = etape.icon;
                const isCompleted = getEtapeIndex(vehiculeStatut) > index;
                const isCurrent = vehiculeStatut === etape.key;
                const isBlocked = vehiculeStatut === 'bloque';
                
                return (
                  <div key={etape.key} className="flex items-center">
                    <div className={`
                      flex items-center gap-1 px-2 py-1 rounded text-xs
                      ${isCompleted ? 'bg-green-100 text-green-800' : 
                        isCurrent ? 'bg-blue-100 text-blue-800' : 
                        isBlocked ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-600'}
                    `}>
                      <Icon className="w-3 h-3" />
                      <span>{etape.label}</span>
                    </div>
                    {index < ETAPES_PROCESSUS.length - 1 && (
                      <ArrowRight className="w-3 h-3 mx-1 text-gray-400" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action button */}
            <div className="flex justify-end">
              {vehiculeStatut === 'bloque' && (
                <div className="flex items-center text-red-600 text-sm">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Véhicule bloqué - Corrections requises
                </div>
              )}
              {getActionButton()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs pour chaque étape */}
      <MaintenanceDialog 
        open={showDialog === 'maintenance'}
        onOpenChange={() => setShowDialog(null)}
        vehiculeId={vehiculeId}
        onSuccess={() => {
          setShowDialog(null);
          toast({
            title: 'Diagnostic créé',
            description: 'Le diagnostic de maintenance a été enregistré'
          });
        }}
      />

      <AdministratifDialog 
        open={showDialog === 'administratif'}
        onOpenChange={() => setShowDialog(null)}
        vehiculeId={vehiculeId}
        onSuccess={() => {
          setShowDialog(null);
          toast({
            title: 'Vérification terminée',
            description: 'La vérification administrative est terminée'
          });
        }}
      />

      <OBCDialog 
        open={showDialog === 'obc'}
        onOpenChange={() => setShowDialog(null)}
        vehiculeId={vehiculeId}
        onSuccess={() => {
          setShowDialog(null);
          toast({
            title: 'Contrôle OBC terminé',
            description: 'Le contrôle OBC a été enregistré'
          });
        }}
      />

      <HSSEDialog 
        open={showDialog === 'hsse'}
        onOpenChange={() => setShowDialog(null)}
        vehiculeId={vehiculeId}
        onSuccess={() => {
          setShowDialog(null);
          toast({
            title: 'Contrôle HSSE terminé',
            description: 'Le contrôle HSSE a été enregistré'
          });
        }}
      />

      <BLDialog 
        open={showDialog === 'bl'}
        onOpenChange={() => setShowDialog(null)}
        vehiculeId={vehiculeId}
        onSuccess={() => {
          setShowDialog(null);
          toast({
            title: 'Bon de livraison créé',
            description: 'Le bon de livraison a été créé avec succès'
          });
        }}
      />
    </>
  );
};