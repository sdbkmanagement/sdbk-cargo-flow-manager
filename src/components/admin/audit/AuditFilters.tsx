
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface AuditFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  actionFilter: string;
  onActionFilterChange: (value: string) => void;
  emailFilter?: string;
  onEmailFilterChange?: (value: string) => void;
  showEmailFilter?: boolean;
}

export const AuditFilters = ({
  searchTerm,
  onSearchChange,
  actionFilter,
  onActionFilterChange,
  emailFilter,
  onEmailFilterChange,
  showEmailFilter = false
}: AuditFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={showEmailFilter ? "Rechercher par email..." : "Rechercher par action, type ou utilisateur..."}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      {!showEmailFilter && (
        <Select value={actionFilter} onValueChange={onActionFilterChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrer par action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les actions</SelectItem>
            <SelectItem value="INSERT">Création</SelectItem>
            <SelectItem value="UPDATE">Modification</SelectItem>
            <SelectItem value="DELETE">Suppression</SelectItem>
          </SelectContent>
        </Select>
      )}
      
      {showEmailFilter && emailFilter !== undefined && onEmailFilterChange && (
        <Input
          placeholder="Filtrer par email spécifique..."
          value={emailFilter}
          onChange={(e) => onEmailFilterChange(e.target.value)}
          className="w-full sm:w-[250px]"
        />
      )}
    </div>
  );
};
