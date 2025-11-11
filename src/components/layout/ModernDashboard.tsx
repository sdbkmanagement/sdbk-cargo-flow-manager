import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Users, 
  Route, 
  FileText, 
  UserCheck, 
  Settings,
  BarChart3,
  Shield,
  Package,
  Clock,
  MapPin,
  FileCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NavigationCard {
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  color: string;
  stats?: string;
  isNew?: boolean;
}

const navigationCards: NavigationCard[] = [
  {
    title: 'Flotte & Véhicules',
    description: 'Gestion des véhicules, maintenance et documents',
    icon: Truck,
    route: '/fleet',
    color: 'from-blue-500 to-blue-600',
    stats: '24 véhicules'
  },
  {
    title: 'Chauffeurs',
    description: 'Gestion des conducteurs et leurs documents',
    icon: Users,
    route: '/drivers', 
    color: 'from-emerald-500 to-emerald-600',
    stats: '18 chauffeurs'
  },
  {
    title: 'Missions',
    description: 'Planification et suivi des transports',
    icon: Route,
    route: '/missions',
    color: 'from-purple-500 to-purple-600',
    stats: '7 en cours'
  },
  {
    title: 'Facturation',
    description: 'Devis, factures et suivi des paiements',
    icon: FileText,
    route: '/billing',
    color: 'from-orange-500 to-orange-600',
    stats: '12 factures'
  },
  {
    title: 'Validations',
    description: 'Workflows de validation des véhicules',
    icon: FileCheck,
    route: '/validations',
    color: 'from-red-500 to-red-600',
    stats: '3 en attente'
  },
  {
    title: 'Ressources Humaines',
    description: 'Gestion des employés et formations',
    icon: UserCheck,
    route: '/rh',
    color: 'from-teal-500 to-teal-600',
    stats: '25 employés'
  },
  {
    title: 'Administration',
    description: 'Utilisateurs, rôles et paramètres système',
    icon: Settings,
    route: '/admin',
    color: 'from-gray-500 to-gray-600',
    isNew: true
  },
  {
    title: 'Tableau de Bord',
    description: 'Vue d\'ensemble et analytics',
    icon: BarChart3,
    route: '/dashboard',
    color: 'from-indigo-500 to-indigo-600',
    stats: 'Temps réel'
  }
];

export const ModernDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header moderne */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  SDBK Transport
                </h1>
                <p className="text-sm text-gray-500 font-medium">Plateforme de gestion</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Système opérationnel
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Introduction */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Bienvenue sur votre plateforme
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Gérez votre flotte, vos chauffeurs et vos missions en toute simplicité 
            avec notre interface moderne et intuitive.
          </p>
        </div>

        {/* Grille des cartes de navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {navigationCards.map((card, index) => (
            <Card 
              key={card.route}
              className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/70 backdrop-blur-sm animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => handleCardClick(card.route)}
            >
              <CardContent className="p-0">
                {/* Header avec gradient */}
                <div className={`h-32 bg-gradient-to-br ${card.color} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-4 left-4">
                    <card.icon className="w-8 h-8 text-white/90" />
                  </div>
                  {card.isNew && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white/20 text-white border-white/30">
                        Nouveau
                      </Badge>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4">
                    {card.stats && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {card.stats}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Effet de brillance au hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </div>
                
                {/* Contenu */}
                <div className="p-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Section d'actions rapides */}
        <div className="mt-16 bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h3 className="text-2xl font-display font-semibold text-gray-900 mb-6 text-center">
            Actions rapides
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer group">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Nouvelle Mission</h4>
              <p className="text-gray-600 text-sm">Créer rapidement une nouvelle mission de transport</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-all duration-300 cursor-pointer group">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Planning</h4>
              <p className="text-gray-600 text-sm">Consulter le planning des chauffeurs et véhicules</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 cursor-pointer group">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Suivi GPS</h4>
              <p className="text-gray-600 text-sm">Localiser vos véhicules en temps réel</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};