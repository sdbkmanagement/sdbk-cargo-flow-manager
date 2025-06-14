
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Chauffeur = Database['public']['Tables']['chauffeurs']['Row'];

interface ProfileHeaderProps {
  chauffeur: Chauffeur;
  size?: 'sm' | 'md' | 'lg';
}

export const ProfileHeader = ({ chauffeur, size = 'md' }: ProfileHeaderProps) => {
  const getInitials = (nom: string, prenom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  const getStatutBadge = (statut: string | null) => {
    const statusValue = statut || 'actif';
    const variants = {
      'actif': 'default',
      'conge': 'secondary',
      'maladie': 'destructive',
      'suspendu': 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[statusValue as keyof typeof variants] || 'secondary'}>
        {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
      </Badge>
    );
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  };

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage 
          src={chauffeur.photo_url || undefined} 
          alt={`${chauffeur.prenom} ${chauffeur.nom}`}
          className="object-cover"
        />
        <AvatarFallback className="bg-orange-100 text-orange-700 text-lg font-semibold">
          {getInitials(chauffeur.nom, chauffeur.prenom)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className={`font-bold text-gray-900 ${textSizeClasses[size]}`}>
            {chauffeur.prenom} {chauffeur.nom}
          </h3>
          {getStatutBadge(chauffeur.statut)}
        </div>
        
        <div className="space-y-1 text-sm text-gray-600">
          {chauffeur.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {chauffeur.email}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            {chauffeur.telephone}
          </div>
          
          {chauffeur.ville && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {chauffeur.ville}
            </div>
          )}
        </div>
        
        <div className="mt-2 flex flex-wrap gap-1">
          {chauffeur.type_permis.map(permis => (
            <Badge key={permis} variant="outline" className="text-xs">
              Permis {permis}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};
