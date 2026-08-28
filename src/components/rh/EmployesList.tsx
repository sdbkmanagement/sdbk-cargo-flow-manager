
import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Edit, Phone, Mail, Upload, Download, UserPlus, Search, X, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeDetailDialog } from './EmployeDetailDialog';
import { EmployeForm } from './EmployeForm';
import { EmployeesImport } from './EmployeesImport';
import { exportRHService } from '@/services/exportRHService';
interface Employe {
  id: string;
  nom: string;
  prenom: string;
  photo_url?: string;
  poste: string;
  service: string;
  date_embauche: string;
  date_fin_contrat?: string;
  statut: string;
  type_contrat: string;
  telephone?: string;
  email?: string;
  remarques?: string;
}

interface EmployesListProps {
  employes: Employe[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const EmployesList = ({ employes, isLoading, onRefresh }: EmployesListProps) => {
  const [selectedEmploye, setSelectedEmploye] = useState<Employe | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [filterContrat, setFilterContrat] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all');

  const services = useMemo(() => Array.from(new Set(employes.map((e: any) => e.service).filter(Boolean))).sort(), [employes]);
  const typesContrat = useMemo(() => Array.from(new Set(employes.map((e: any) => e.type_contrat).filter(Boolean))).sort(), [employes]);
  const statuts = useMemo(() => Array.from(new Set(employes.map((e: any) => e.statut).filter(Boolean))).sort(), [employes]);

  const hasActiveFilters = filterService !== 'all' || filterContrat !== 'all' || filterStatut !== 'all';
  const resetFilters = () => { setFilterService('all'); setFilterContrat('all'); setFilterStatut('all'); };

  const filteredEmployes = useMemo(() => {
    const q = search.trim().toLowerCase();
    const terms = q ? q.split(/\s+/) : [];
    return employes.filter((e: any) => {
      if (filterService !== 'all' && e.service !== filterService) return false;
      if (filterContrat !== 'all' && e.type_contrat !== filterContrat) return false;
      if (filterStatut !== 'all' && e.statut !== filterStatut) return false;
      if (terms.length === 0) return true;
      const haystack = [
        e.nom, e.prenom, e.matricule, e.poste, e.fonction, e.service,
        e.departement, e.type_contrat, e.telephone, e.email, e.statut,
      ].filter(Boolean).join(' ').toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [employes, search, filterService, filterContrat, filterStatut]);

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'bg-green-500';
      case 'inactif': return 'bg-gray-500';
      case 'en_arret': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'actif': return 'Actif';
      case 'inactif': return 'Inactif';
      case 'en_arret': return 'En arrêt';
      default: return statut;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {showImport && (
        <div className="mb-4">
          <EmployeesImport onSuccess={() => { setShowImport(false); onRefresh(); }} onClose={() => setShowImport(false)} />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un collaborateur (nom, matricule, poste, service…)"
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Nouveau collaborateur
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowImport(!showImport)}>
          <Upload className="w-4 h-4 mr-2" />
          Import Excel
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportRHService.exportToExcel(filteredEmployes)}>
          <Download className="w-4 h-4 mr-2" />
          Export Excel
        </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterService} onValueChange={setFilterService}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les services</SelectItem>
            {services.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterContrat} onValueChange={setFilterContrat}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Contrat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les contrats</SelectItem>
            {typesContrat.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatut} onValueChange={setFilterStatut}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {statuts.map((s) => <SelectItem key={s} value={s}>{getStatutLabel(s)}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>
      {showCreate && (
        <EmployeForm
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); onRefresh(); }}
        />
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Personnel</TableHead>
            <TableHead>Poste</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Contrat</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEmployes.map((employe) => (
            <TableRow key={employe.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={employe.photo_url} />
                    <AvatarFallback>
                      {employe.nom[0]}{employe.prenom[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{employe.nom} {employe.prenom}</p>
                    <p className="text-sm text-muted-foreground">
                      Embauché le {new Date(employe.date_embauche).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium">{employe.poste}</p>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{employe.service}</Badge>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{employe.type_contrat}</p>
                  {employe.date_fin_contrat && (
                    <p className="text-sm text-muted-foreground">
                      Fin: {new Date(employe.date_fin_contrat).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={`${getStatutColor(employe.statut)} text-white`}>
                  {getStatutLabel(employe.statut)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {employe.telephone && (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                      <a href={`tel:${employe.telephone}`} title={employe.telephone}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {employe.email && (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                      <a href={`mailto:${employe.email}`} title={employe.email}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    title="Voir le dossier"
                    onClick={() => setSelectedEmploye(employe)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    title="Modifier"
                    onClick={() => setSelectedEmploye(employe)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filteredEmployes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {search ? `Aucun collaborateur ne correspond à « ${search} »` : 'Aucun personnel trouvé'}
          </p>
        </div>
      )}
      {search && filteredEmployes.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          {filteredEmployes.length} collaborateur(s) sur {employes.length}
        </p>
      )}

      {selectedEmploye && (
        <EmployeDetailDialog
          employe={selectedEmploye}
          onClose={() => setSelectedEmploye(null)}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
};
