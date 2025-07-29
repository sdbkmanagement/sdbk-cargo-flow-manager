
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface FleetFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  typeVehiculeFilter: string;
  setTypeVehiculeFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  transportFilter: string;
  setTransportFilter: (value: string) => void;
  baseFilter: string;
  setBaseFilter: (value: string) => void;
  bases: string[];
  onResetFilters: () => void;
  activeFiltersCount: number;
}

export const FleetFilters = ({
  searchTerm,
  setSearchTerm,
  typeVehiculeFilter,
  setTypeVehiculeFilter,
  statusFilter,
  setStatusFilter,
  transportFilter,
  setTransportFilter,
  baseFilter,
  setBaseFilter,
  bases,
  onResetFilters,
  activeFiltersCount
}: FleetFiltersProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et recherche
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onResetFilters}
                className="h-8"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  {isOpen ? 'Masquer' : 'Afficher'} les filtres
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barre de recherche principale */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, immatriculation, marque..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filtres avancés */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type de véhicule</Label>
                <Select value={typeVehiculeFilter} onValueChange={setTypeVehiculeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="porteur">Porteur</SelectItem>
                    <SelectItem value="tracteur_remorque">Tracteur + Remorque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Statut</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="disponible">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Disponible
                      </div>
                    </SelectItem>
                    <SelectItem value="en_mission">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        En mission
                      </div>
                    </SelectItem>
                    <SelectItem value="maintenance">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Maintenance
                      </div>
                    </SelectItem>
                    <SelectItem value="validation_requise">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Validation requise
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Type de transport</Label>
                <Select value={transportFilter} onValueChange={setTransportFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les transports" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les transports</SelectItem>
                    <SelectItem value="hydrocarbures">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Hydrocarbures
                      </div>
                    </SelectItem>
                    <SelectItem value="marchandise">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        Bauxite
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Base</Label>
                <Select value={baseFilter} onValueChange={setBaseFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les bases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les bases</SelectItem>
                    {bases.map((base) => (
                      <SelectItem key={base} value={base}>
                        {base}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Affichage des filtres actifs */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Recherche: "{searchTerm}"
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {typeVehiculeFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Type: {typeVehiculeFilter === 'porteur' ? 'Porteur' : 'Tracteur + Remorque'}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setTypeVehiculeFilter('all')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Statut: {statusFilter}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setStatusFilter('all')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {transportFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Transport: {transportFilter === 'hydrocarbures' ? 'Hydrocarbures' : 'Bauxite'}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setTransportFilter('all')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {baseFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Base: {baseFilter}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => setBaseFilter('all')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
