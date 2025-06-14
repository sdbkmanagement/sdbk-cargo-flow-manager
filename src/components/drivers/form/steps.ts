
import { User, FileText, Camera } from 'lucide-react';

export const formSteps = [
  { id: 1, title: 'Informations personnelles', icon: User },
  { id: 2, title: 'Documents officiels', icon: FileText },
  { id: 3, title: 'Photo et signature', icon: Camera }
];

export const typePermisOptions = [
  { value: 'B', label: 'Permis B (Voiture)' },
  { value: 'C', label: 'Permis C (Camion)' },
  { value: 'CE', label: 'Permis CE (Camion + remorque)' },
  { value: 'D', label: 'Permis D (Transport de personnes)' }
];
