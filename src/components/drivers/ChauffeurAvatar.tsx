import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface ChauffeurAvatarProps {
  chauffeur: {
    nom: string;
    prenom: string;
    photo_url?: string | null;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ChauffeurAvatar = ({ 
  chauffeur, 
  size = 'md', 
  className = '' 
}: ChauffeurAvatarProps) => {
  const getInitials = (nom: string, prenom: string) => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {chauffeur.photo_url ? (
        <AvatarImage 
          src={chauffeur.photo_url} 
          alt={`${chauffeur.prenom} ${chauffeur.nom}`}
          className="object-cover"
        />
      ) : null}
      <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold">
        {chauffeur.photo_url ? (
          <User className={`${iconSizes[size]} text-gray-400`} />
        ) : (
          getInitials(chauffeur.nom, chauffeur.prenom)
        )}
      </AvatarFallback>
    </Avatar>
  );
};