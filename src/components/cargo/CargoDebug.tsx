
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { chargementsService } from '@/services/chargements';

export const CargoDebug = () => {
  const { user, hasPermission } = useAuth();

  const { data: chargements = [], isLoading, error } = useQuery({
    queryKey: ['chargements-debug'],
    queryFn: chargementsService.getAll,
  });

  return (
    <div className="p-6 bg-white border rounded-lg">
      <h2 className="text-lg font-bold mb-4">Debug Chargements Module</h2>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>User:</strong> {user ? `${user.prenom} ${user.nom} (${user.role})` : 'Not logged in'}
        </div>
        <div>
          <strong>Has cargo_read permission:</strong> {hasPermission('cargo_read') ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Has cargo_write permission:</strong> {hasPermission('cargo_write') ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Data loading:</strong> {isLoading ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Error:</strong> {error ? error.message : 'None'}
        </div>
        <div>
          <strong>Chargements count:</strong> {chargements.length}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
          <strong>Error details:</strong>
          <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {chargements.length > 0 && (
        <div className="mt-4">
          <strong>Sample data:</strong>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(chargements[0], null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
