
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Search, Filter, Download, Mail, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface InvoiceListHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onExportAll: () => void;
  onExportByDates: (dateDebut: Date, dateFin: Date) => void;
}

export const InvoiceListHeader = ({ searchTerm, onSearchChange, onExportAll, onExportByDates }: InvoiceListHeaderProps) => {
  const [dateDebut, setDateDebut] = useState<Date>();
  const [dateFin, setDateFin] = useState<Date>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleExportByDates = () => {
    if (dateDebut && dateFin) {
      onExportByDates(dateDebut, dateFin);
      setDialogOpen(false);
    }
  };

  const setPeriodesRapides = (jours: number) => {
    const fin = new Date();
    const debut = new Date();
    debut.setDate(fin.getDate() - jours);
    setDateDebut(debut);
    setDateFin(fin);
  };

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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Exporter les factures</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPeriodesRapides(30)}
                >
                  30 derniers jours
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPeriodesRapides(90)}
                >
                  3 derniers mois
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const debut = new Date();
                    debut.setDate(1);
                    const fin = new Date();
                    setDateDebut(debut);
                    setDateFin(fin);
                  }}
                >
                  Ce mois
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateDebut && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateDebut ? format(dateDebut, "dd/MM/yyyy") : "Sélectionner"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateDebut}
                        onSelect={setDateDebut}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateFin && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFin ? format(dateFin, "dd/MM/yyyy") : "Sélectionner"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFin}
                        onSelect={setDateFin}
                        disabled={(date) => date > new Date() || (dateDebut && date < dateDebut)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={onExportAll}
                  variant="outline"
                  className="flex-1"
                >
                  Exporter tout
                </Button>
                <Button 
                  onClick={handleExportByDates}
                  disabled={!dateDebut || !dateFin}
                  className="flex-1"
                >
                  Exporter la période
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="outline" size="sm">
          <Mail className="h-4 w-4 mr-2" />
          Relance groupe
        </Button>
      </div>
    </div>
  );
};
