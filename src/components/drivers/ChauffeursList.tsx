
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  User, 
  Phone, 
  Calendar,
  AlertTriangle,
  Edit,
  FileText
} from 'lucide-react';
import { ChauffeurDetailDialog } from './ChauffeurDetailDialog';
import { useAuth } from '@/contexts/AuthContext';

// Données de démonstration
const chauffeursDemo = [
  {
    id: '1',
    nom: 'Koné',
    prenom: 'Ibrahim',
    telephone: '+225 07 12 34 56 78',
    email: 'ibrahim.kone@sdbk.com',
    typePermis: ['B', 'C', 'CE'],
    statut: 'actif',
    vehiculeAssigne: 'TRK-001',
    dateExpirationPermis: new Date('2025-08-15'),
    prochaineMaintenance: new Date('2024-07-20'),
    alertes: 0
  },
  {
    id: '2',
    nom: 'Traoré',
    prenom: 'Aminata',
    telephone: '+225 05 98 76 54 32',
    email: 'aminata.traore@sdbk.com',
    typePermis: ['B', 'C'],
    statut: 'actif',
    vehiculeAssigne: 'TRK-015',
    dateExpirationPermis: new Date('2024-12-30'),
    prochaineMaintenance: new Date('2024-08-10'),
    alertes: 1
  },
  {
    id: '3',
    nom: 'Ouattara',
    prenom: 'Seydou',
    telephone: '+225 01 23 45 67 89',
    email: 'seydou.ouattara@sdbk.com',
    typePermis: ['B', 'C', 'CE', 'D'],
    statut: 'conge',
    vehiculeAssigne: null,
    dateExpirationPermis: new Date('2025-03-22'),
    prochaineMaintenance: null,
    alertes: 0
  }
];

interface ChauffeursListProps {
  searchTerm: string;
  onSelectChauffeur: (chauffeur: any) => void;
}

export const ChauffeursList = ({ searchTerm, onSelectChauffeur }: ChauffeursListProps) => {
  const { hasPermission } = useAuth();
  const [selectedChauffeur, setSelectedChauffeur] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const filteredChauffeurs = chauffeursDemo.filter(chauffeur =>
    chauffeur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chauffeur.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chauffeur.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatutBadge = (statut: string) => {
    const variants = {
      'actif': 'default',
      'conge': 'secondary',
      'maladie': 'destructive',
      'suspendu': 'destructive'
    };
    
    return (
      <Badge variant={variants[statut] || 'secondary'}>
        {statut.charAt(0).toUpperCase() + statut.slice(1)}
      </Badge>
    );
  };

  const handleViewDetail = (chauffeur: any) => {
    setSelectedChauffeur(chauffeur);
    setShowDetail(true);
  };

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chauffeur</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Permis</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Véhicule assigné</TableHead>
                  <TableHead>Alertes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChauffeurs.map((chauffeur) => (
                  <TableRow key={chauffeur.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium">{chauffeur.prenom} {chauffeur.nom}</div>
                          <div className="text-sm text-gray-500">{chauffeur.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 mr-1" />
                        {chauffeur.telephone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {chauffeur.typePermis.map(permis => (
                          <Badge key={permis} variant="outline" className="text-xs">
                            {permis}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatutBadge(chauffeur.statut)}
                    </TableCell>
                    <TableCell>
                      {chauffeur.vehiculeAssigne ? (
                        <Badge variant="secondary">{chauffeur.vehiculeAssigne}</Badge>
                      ) : (
                        <span className="text-gray-400">Non assigné</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {chauffeur.alertes > 0 ? (
                        <div className="flex items-center text-orange-600">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {chauffeur.alertes}
                        </div>
                      ) : (
                        <span className="text-green-600">Aucune</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(chauffeur)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        {hasPermission('drivers_write') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectChauffeur(chauffeur)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {showDetail && selectedChauffeur && (
        <ChauffeurDetailDialog
          chauffeur={selectedChauffeur}
          open={showDetail}
          onOpenChange={setShowDetail}
        />
      )}
    </>
  );
};
