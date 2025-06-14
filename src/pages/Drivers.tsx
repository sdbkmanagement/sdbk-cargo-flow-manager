
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  AlertTriangle,
  FileText,
  Calendar,
  Settings
} from 'lucide-react';
import { ChauffeursList } from '@/components/drivers/ChauffeursList';
import { ChauffeurForm } from '@/components/drivers/ChauffeurForm';
import { AlertesDocuments } from '@/components/drivers/AlertesDocuments';
import { useAuth } from '@/contexts/AuthContext';

const Drivers = () => {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('liste');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChauffeur, setSelectedChauffeur] = useState(null);

  const stats = {
    total: 25,
    actifs: 22,
    inactifs: 3,
    alertes: 5
  };

  const handleSelectChauffeur = (chauffeur: any) => {
    setSelectedChauffeur(chauffeur);
    setActiveTab('modifier');
  };

  const handleFormSuccess = () => {
    setSelectedChauffeur(null);
    setActiveTab('liste');
  };

  if (!hasPermission('drivers_read')) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Accès non autorisé</h1>
          <p className="text-gray-600 mt-2">Vous n'avez pas les permissions pour accéder à ce module.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des chauffeurs</h1>
          <p className="text-gray-600 mt-1">
            Gestion complète du personnel de conduite
          </p>
        </div>
        {hasPermission('drivers_write') && (
          <Button 
            onClick={() => {
              setSelectedChauffeur(null);
              setActiveTab('nouveau');
            }}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau chauffeur
          </Button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total chauffeurs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.actifs}</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Actif
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactifs</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactifs}</p>
              </div>
              <Badge variant="destructive">
                Inactif
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertes</p>
                <p className="text-2xl font-bold text-orange-600">{stats.alertes}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'liste', label: 'Liste des chauffeurs', icon: Users },
            { id: 'alertes', label: 'Alertes documents', icon: AlertTriangle },
            { id: 'planning', label: 'Planning', icon: Calendar },
            ...(hasPermission('drivers_write') ? [
              { id: 'nouveau', label: 'Nouveau', icon: Plus },
              ...(selectedChauffeur ? [{ id: 'modifier', label: 'Modifier', icon: Settings }] : [])
            ] : [])
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu selon l'onglet actif */}
      <div className="mt-6">
        {activeTab === 'liste' && (
          <div className="space-y-6">
            {/* Barre de recherche et filtres */}
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
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
            </div>

            <ChauffeursList 
              searchTerm={searchTerm}
              onSelectChauffeur={handleSelectChauffeur}
            />
          </div>
        )}

        {activeTab === 'alertes' && (
          <AlertesDocuments />
        )}

        {activeTab === 'planning' && (
          <Card>
            <CardHeader>
              <CardTitle>Planning des chauffeurs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Module planning en développement...</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'nouveau' && hasPermission('drivers_write') && (
          <ChauffeurForm onSuccess={handleFormSuccess} />
        )}

        {activeTab === 'modifier' && hasPermission('drivers_write') && selectedChauffeur && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Modifier le chauffeur</h2>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('liste')}
              >
                Retour à la liste
              </Button>
            </div>
            <ChauffeurForm 
              chauffeur={selectedChauffeur} 
              onSuccess={handleFormSuccess} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Drivers;
