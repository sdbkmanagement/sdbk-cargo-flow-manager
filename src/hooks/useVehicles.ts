
import { useQuery } from '@tanstack/react-query';
import { vehiculesService } from '@/services/vehicules';

export const useVehicles = () => {
  return useQuery({
    queryKey: ['vehicules'],
    queryFn: vehiculesService.getAll,
  });
};
