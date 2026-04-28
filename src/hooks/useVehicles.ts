
import { useQuery } from '@tanstack/react-query';
import { vehiculesService } from '@/services/vehicules';

export const useVehicles = () => {
  return useQuery({
    queryKey: ['vehicules'],
    queryFn: vehiculesService.getAll,
    refetchInterval: 60_000, // Auto-refresh toutes les 60s
    refetchOnWindowFocus: true, // Rafraîchit quand on revient sur l'onglet
    refetchOnMount: 'always',
    staleTime: 30_000,
  });
};
