
import { Badge } from '@/components/ui/badge';

export const getActionBadge = (action: string) => {
  switch (action.toLowerCase()) {
    case 'insert':
      return <Badge className="bg-green-100 text-green-700 border-green-200">Création</Badge>;
    case 'update':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Modification</Badge>;
    case 'delete':
      return <Badge className="bg-red-100 text-red-700 border-red-200">Suppression</Badge>;
    default:
      return <Badge variant="secondary">{action}</Badge>;
  }
};

export const getSuccessBadge = (success: boolean) => {
  return success ? (
    <Badge className="bg-green-100 text-green-700 border-green-200">Succès</Badge>
  ) : (
    <Badge className="bg-red-100 text-red-700 border-red-200">Échec</Badge>
  );
};

export const formatDetails = (details: unknown): string => {
  if (!details) return 'Aucun détail';
  
  try {
    if (typeof details === 'string') {
      return details;
    }
    if (typeof details === 'object') {
      return JSON.stringify(details, null, 2);
    }
    return String(details);
  } catch {
    return 'Détails non formatables';
  }
};
