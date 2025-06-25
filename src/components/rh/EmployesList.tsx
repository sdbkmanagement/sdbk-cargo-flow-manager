
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Edit, Trash2, Phone, Mail } from 'lucide-react';
import { EmployeDetailDialog } from './EmployeDetailDialog';

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
          {employes.map((employe) => (
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
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                  {employe.email && (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setSelectedEmploye(employe)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {employes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Aucun personnel trouvé</p>
        </div>
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
