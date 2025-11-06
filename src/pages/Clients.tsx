import React from 'react';
import { ClientsList } from '@/components/clients/ClientsList';

const Clients: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <ClientsList />
    </div>
  );
};

export default Clients;
