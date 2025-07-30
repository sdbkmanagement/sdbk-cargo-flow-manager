
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { chauffeursService } from '@/services/chauffeurs';
import { ChauffeurDocumentManager } from './ChauffeurDocumentManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const DriversDocuments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChauffeurId, setSelectedChauffeurId] = useState<string | null>(null);

  const { data: chauffeurs = [] } = useQuery({
    queryKey: ['chauffeurs'],
    queryFn: chauffeursService.getAll,
  });

  const filteredChauffeurs = chauffeurs.filter(chauffeur =>
    `${chauffeur.prenom} ${chauffeur.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chauffeur.matricule?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedChauffeur = selectedChauffeurId 
    ? chauffeurs.find(c => c.id === selectedChauffeurId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher un chauffeur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des chauffeurs */}
        <Card>
          <CardHeader>
            <CardTitle>Chauffeurs ({filteredChauffeurs.length})</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            <div className="space-y-2">
              {filteredChauffeurs.map((chauffeur) => (
                <div
                  key={chauffeur.id}
                  onClick={() => setSelectedChauffeurId(chauffeur.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedChauffeurId === chauffeur.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">
                    {chauffeur.prenom} {chauffeur.nom}
                  </div>
                  {chauffeur.matricule && (
                    <div className="text-sm text-gray-500">
                      #{chauffeur.matricule}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gestion des documents */}
        <div className="lg:col-span-2">
          {selectedChauffeur ? (
            <ChauffeurDocumentManager 
              chauffeurId={selectedChauffeur.id}
              documents={[]} // À charger depuis la base de données
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-500">
                  Sélectionnez un chauffeur pour gérer ses documents
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
