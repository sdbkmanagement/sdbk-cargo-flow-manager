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
  Package,
  Clock,
  MapPin,
  FileCheck,
  Sparkles
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header moderne avec glassmorphism */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-500">
                  <Truck className="w-7 h-7 text-white drop-shadow-lg" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  SDBK Transport
                </h1>
                <p className="text-sm text-gray-600 font-semibold mt-1">Plateforme de gestion V2.0</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-full shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-bold">Système opérationnel</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Hero section avec animation */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-bold text-purple-700">Version 2.0 - Interface Modernisée</span>
          </div>
          <h2 className="text-5xl lg:text-6xl font-display font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Bienvenue sur votre plateforme
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            Gérez votre flotte, vos chauffeurs et vos missions avec une interface 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold"> ultra-moderne et intuitive</span>
          </p>
        </div>

        {/* Grille des cartes de navigation avec animations échelonnées */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
          {navigationCards.map((card, index) => (
            <Card 
              key={card.route}
              className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white/80 backdrop-blur-xl animate-fade-in-up hover-glow"
              style={{ animationDelay: `${index * 0.08}s` }}
              onClick={() => handleCardClick(card.route)}
            >
              <CardContent className="p-0">
                {/* Header avec gradient dynamique */}
                <div className={`h-36 bg-gradient-to-br ${card.color} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  
                  {/* Icône animée */}
                  <div className="absolute top-5 left-5">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/20 rounded-xl blur-md"></div>
                      <card.icon className="relative w-10 h-10 text-white drop-shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" />
                    </div>
                  </div>
                  
                  {/* Badge nouveau */}
                  {card.isNew && (
                    <div className="absolute top-5 right-5 animate-pulse-soft">
                      <Badge className="bg-white/90 text-gray-900 border-white/50 shadow-lg font-bold">
                        ✨ Nouveau
                      </Badge>
                    </div>
                  )}
                  
                  {/* Stats badge */}
                  <div className="absolute bottom-5 left-5">
                    {card.stats && (
                      <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 shadow-lg font-semibold">
                        {card.stats}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Effet shimmer au hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
                
                {/* Contenu avec animations */}
                <div className="p-6 space-y-3">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
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

        {/* Section d'actions rapides ultra-moderne */}
        <div className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-2xl rounded-3xl p-10 border border-white/40 shadow-2xl animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-3xl font-display font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Actions rapides
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 hover:from-blue-100/80 hover:to-indigo-100/80 backdrop-blur-sm transition-all duration-500 cursor-pointer group hover:-translate-y-2 hover:shadow-xl border border-blue-100/50">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                <Package className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
              <h4 className="font-bold text-lg text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">Nouvelle Mission</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Créer rapidement une nouvelle mission de transport</p>
            </div>
            
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/80 hover:from-emerald-100/80 hover:to-teal-100/80 backdrop-blur-sm transition-all duration-500 cursor-pointer group hover:-translate-y-2 hover:shadow-xl border border-emerald-100/50">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                <Clock className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
              <h4 className="font-bold text-lg text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">Planning</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Consulter le planning des chauffeurs et véhicules</p>
            </div>
            
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50/80 to-pink-50/80 hover:from-purple-100/80 hover:to-pink-100/80 backdrop-blur-sm transition-all duration-500 cursor-pointer group hover:-translate-y-2 hover:shadow-xl border border-purple-100/50">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                <MapPin className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
              <h4 className="font-bold text-lg text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">Suivi GPS</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Localiser vos véhicules en temps réel</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};