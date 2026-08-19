import React, { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EquipementComboboxProps {
  equipements: any[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export const EquipementCombobox: React.FC<EquipementComboboxProps> = ({
  equipements,
  value,
  onChange,
  placeholder = 'Sélectionner',
  searchPlaceholder = 'Rechercher une immatriculation...',
  emptyMessage = 'Aucun équipement trouvé.',
}) => {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => equipements.find((e: any) => e.id === value), [equipements, value]);

  const label = useMemo(() => {
    if (!selected) return null;
    return `${selected.immatriculation || selected.code || 'Équipement'} — ${selected.designation || ''}`;
  }, [selected]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {label || <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover z-50" align="start">
        <Command
          filter={(itemValue, search) => {
            return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {equipements.map((e: any) => {
                const itemLabel = `${e.immatriculation || e.code || 'Équipement'} — ${e.designation || ''}`;
                return (
                  <CommandItem
                    key={e.id}
                    value={itemLabel}
                    onSelect={() => {
                      onChange(e.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === e.id ? 'opacity-100' : 'opacity-0')} />
                    {e.immatriculation || e.code}
                    {e.designation && <span className="ml-2 text-xs text-muted-foreground">{e.designation}</span>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
