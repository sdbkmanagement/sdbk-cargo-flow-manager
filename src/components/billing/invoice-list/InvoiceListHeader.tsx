
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, Mail } from 'lucide-react';

interface InvoiceListHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onExportAll: () => void;
}

export const InvoiceListHeader = ({ searchTerm, onSearchChange, onExportAll }: InvoiceListHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <div className="flex gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une facture..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filtrer
        </Button>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onExportAll}>
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
        <Button variant="outline" size="sm">
          <Mail className="h-4 w-4 mr-2" />
          Relance groupe
        </Button>
      </div>
    </div>
  );
};
