
import { User, FileText, Upload, Camera } from 'lucide-react';

export const formSteps = [
  {
    id: 1,
    title: 'Informations personnelles',
    description: 'Données personnelles et permis',
    icon: User
  },
  {
    id: 2,
    title: 'Documents officiels',
    description: 'Documents obligatoires et certificats',
    icon: FileText
  },
  {
    id: 3,
    title: 'Autres documents',
    description: 'Documents supplémentaires personnalisés',
    icon: Upload
  },
  {
    id: 4,
    title: 'Photo et signature',
    description: 'Photo de profil et signature',
    icon: Camera
  }
];

export const typePermisOptions = [
  { value: 'A', label: 'Permis A - Motocyclettes' },
  { value: 'B', label: 'Permis B - Véhicules légers' },
  { value: 'C', label: 'Permis C - Poids lourds' },
  { value: 'CE', label: 'Permis CE - Ensemble articulé' },
  { value: 'D', label: 'Permis D - Transport en commun' },
  { value: 'DE', label: 'Permis DE - Autobus articulé' }
];
