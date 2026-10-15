import React, { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GmaoPiece } from '@/services/gmao';
import { fmtMontant } from './gmaoUi';

export interface PieceComboboxProps {
  pieces: GmaoPiece[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

const texteRecherche = (p: GmaoPiece) =>
  [p.reference, p.designation, p.marque, p.categorie, p.emplacement]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

/**
 * Sélecteur de pièce avec recherche : reference, désignation, marque ou catégorie.
 * Utilisé dans les formulaires d'intervention pour retrouver rapidement une pièce
 * parmi un stock de plusieurs dizaines de lignes.
 */
export const PieceCombobox: React.FC<PieceComboboxProps> = ({
  pieces,
  value,
  onChange,
  placeholder = 'Sélectionner une pièce',
  searchPlaceholder = 'Rechercher : référence, désignation, marque...',
  emptyMessage = 'Aucune pièce trouvée.',
}) => {
  const [open, setOpen] = useState(false);
  const [recherche, setRecherche] = useState('');

  const selectionnee = useMemo(() => pieces.find((p) => p.id === value), [pieces, value]);

  const label = useMemo(() => {
    if (!selectionnee) return null;
    return `${selectionnee.reference} — ${selectionnee.designation || ''}`.trim();
  }, [selectionnee]);

  // Les lignes déjà choisies ailleurs restent affichables, même hors liste filtrée.
  const visibles = useMemo(() => {
    const mots = recherche.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!mots.length) return pieces;
    return pieces.filter((p) => {
      const txt = texteRecherche(p);
      return mots.every((m) => txt.includes(m));
    });
  }, [pieces, recherche]);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setRecherche('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate text-left">
            {label || <span className="text-muted-foreground">{placeholder}</span>}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover z-50" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={recherche}
            onValueChange={setRecherche}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup className="max-h-72 overflow-y-auto">
              {visibles.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.id}
                  onSelect={() => {
                    onChange(p.id);
                    setOpen(false);
                    setRecherche('');
                  }}
                  className="gap-2"
                >
                  <Check className={cn('h-4 w-4 shrink-0', value === p.id ? 'opacity-100' : 'opacity-0')} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium">{p.reference}</span>
                      <span className="truncate">{p.designation}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      {p.marque && <span>{p.marque}</span>}
                      {p.categorie && <span>· {p.categorie}</span>}
                      <span>· stock {p.quantite_stock}</span>
                      <span>· {fmtMontant(Number(p.prix_unitaire || 0))}</span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
