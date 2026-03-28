import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Truck, Users, Building2 } from 'lucide-react';
import { VehiculeRanking, ChauffeurRanking, ClientRanking } from '@/services/managementDashboardService';

const formatGNF = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}Md GNF`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M GNF`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K GNF`;
  return `${value.toLocaleString('fr-FR')} GNF`;
};

interface RankingsProps {
  topVehicules: VehiculeRanking[];
  topChauffeurs: ChauffeurRanking[];
  topClients: ClientRanking[];
}

const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600', 'text-muted-foreground', 'text-muted-foreground'];

export const Rankings: React.FC<RankingsProps> = ({ topVehicules, topChauffeurs, topClients }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Top Véhicules */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-500" />
            Top 5 Camions (CA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topVehicules.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
            )}
            {topVehicules.map((v, i) => (
              <div key={i} className="flex items-center gap-3">
                <Medal className={`h-4 w-4 ${medalColors[i]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{v.numero}</p>
                  <p className="text-xs text-muted-foreground">{v.totalBL} BL</p>
                </div>
                <Badge variant="secondary" className="text-xs font-semibold whitespace-nowrap">
                  {formatGNF(v.totalRevenu)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Chauffeurs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            Top 5 Chauffeurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topChauffeurs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
            )}
            {topChauffeurs.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <Medal className={`h-4 w-4 ${medalColors[i]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.prenom} {c.nom}</p>
                </div>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {c.totalBL} BL
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Clients */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-500" />
            Top Clients (CA)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topClients.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
            )}
            {topClients.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <Medal className={`h-4 w-4 ${medalColors[i]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.nom}</p>
                  <p className="text-xs text-muted-foreground">{c.totalBL} factures</p>
                </div>
                <Badge variant="secondary" className="text-xs font-semibold whitespace-nowrap">
                  {formatGNF(c.totalCA)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
