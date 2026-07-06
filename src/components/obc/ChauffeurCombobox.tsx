import React, { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  chauffeurs: any[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

export const ChauffeurCombobox: React.FC<Props> = ({ chauffeurs, value, onChange, placeholder = 'Choisir...' }) => {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => chauffeurs.find((c: any) => c.id === value), [chauffeurs, value]);

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
          {selected ? `${selected.prenom} ${selected.nom}` : <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover z-50" align="start">
        <Command
          filter={(itemValue, search) => {
            return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Rechercher un chauffeur..." />
          <CommandList>
            <CommandEmpty>Aucun chauffeur trouvé.</CommandEmpty>
            <CommandGroup>
              {chauffeurs.map((c: any) => {
                const label = `${c.prenom} ${c.nom}${c.matricule ? ' ' + c.matricule : ''}`;
                return (
                  <CommandItem
                    key={c.id}
                    value={label}
                    onSelect={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === c.id ? 'opacity-100' : 'opacity-0')} />
                    {c.prenom} {c.nom}
                    {c.matricule && <span className="ml-2 text-xs text-muted-foreground">{c.matricule}</span>}
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
