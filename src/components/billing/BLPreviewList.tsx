import React, { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Search } from 'lucide-react';

export interface BLPreviewItem {
  id: string;
  numero: string;
  destination: string;
  lieu_arrivee?: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
  depart: string;
  mission_numero?: string;
}

interface BLPreviewListProps {
  items: BLPreviewItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
}

export const BLPreviewList = ({ items, selectedIds, onToggle, onToggleAll }: BLPreviewListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;
  const totalSelected = items.filter(i => selectedIds.has(i.id)).reduce((s, i) => s + i.total, 0);
  const excludedCount = items.length - selectedIds.size;

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i =>
      i.numero.toLowerCase().includes(q) ||
      i.destination.toLowerCase().includes(q) ||
      (i.lieu_arrivee || '').toLowerCase().includes(q) ||
      i.depart.toLowerCase().includes(q) ||
      (i.mission_numero || '').toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un BL (numéro, trajet, mission)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            // @ts-ignore - indeterminate supported by radix
            data-state={someSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked'}
            onCheckedChange={(checked) => onToggleAll(!!checked)}
          />
          <span className="font-medium">
            {selectedIds.size}/{items.length} BL sélectionnés
          </span>
        </div>
        <span className="font-medium text-primary">
          Total: {totalSelected.toLocaleString('fr-FR')} GNF
        </span>
      </div>

      {excludedCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          {excludedCount} BL exclu{excludedCount > 1 ? 's' : ''} de la facturation (litige / en attente)
        </div>
      )}

      <div className="max-h-64 overflow-y-auto border rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>N° BL</TableHead>
              <TableHead>Trajet</TableHead>
              <TableHead className="text-right">Qté (L)</TableHead>
              <TableHead className="text-right">Prix/L</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const checked = selectedIds.has(item.id);
              return (
                <TableRow
                  key={item.id}
                  className={!checked ? 'opacity-50 bg-muted/30' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggle(item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.numero}</TableCell>
                  <TableCell className="text-xs">
                    {item.depart} → {item.lieu_arrivee || item.destination}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {item.quantite.toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {item.prix_unitaire > 0 ? item.prix_unitaire.toLocaleString('fr-FR') : (
                      <Badge variant="outline" className="text-amber-600 text-[10px]">N/A</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs font-medium">
                    {item.total.toLocaleString('fr-FR')}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-4">
                  Aucun BL trouvé pour « {searchQuery} »
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
