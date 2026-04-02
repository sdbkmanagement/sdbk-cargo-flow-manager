import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Printer, Download, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, addYears, parse } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PlanningEntry {
  id: string;
  numero: number;
  chauffeur_id: string;
  chauffeur_nom: string;
  tracteur: string;
  date_realisation_precedente: string | null;
  date_prevue: string | null;
  observations: string;
}

export const PlanningRecyclage = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [chauffeurs, setChauffeurs] = useState<any[]>([]);
  const [entries, setEntries] = useState<PlanningEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load chauffeurs with their vehicles
      const { data: chauffeursData } = await supabase
        .from('chauffeurs')
        .select('id, nom, prenom, matricule, vehicule_assigne, statut')
        .order('nom');

      if (chauffeursData) {
        setChauffeurs(chauffeursData);
        
        // Load vehicles for ID -> immatriculation mapping
        const { data: vehiculesData } = await supabase
          .from('vehicules')
          .select('id, immatriculation');

        const vehiculeMapById = new Map(
          (vehiculesData || []).map(v => [v.id, v.immatriculation || ''])
        );

        // Also load active affectations
        const { data: affectationsData } = await supabase
          .from('affectations_chauffeurs')
          .select('chauffeur_id, vehicule_id')
          .eq('statut', 'active');

        const affectationMap = new Map(
          (affectationsData || []).map(a => [a.chauffeur_id, a.vehicule_id])
        );

        // Load formations with date_recyclage
        const { data: formationsData } = await supabase
          .from('formations' as any)
          .select('chauffeur_id, date_formation, date_recyclage')
          .order('date_formation', { ascending: false });

        const lastFormationMap = new Map<string, { date_formation: string; date_recyclage: string | null }>();
        (formationsData || []).forEach((f: any) => {
          if (!lastFormationMap.has(f.chauffeur_id)) {
            lastFormationMap.set(f.chauffeur_id, {
              date_formation: f.date_formation,
              date_recyclage: f.date_recyclage
            });
          }
        });

        // Build entries
        const planningEntries: PlanningEntry[] = chauffeursData
          .filter(c => c.statut !== 'inactif')
          .map((c, index) => {
            // Priority: affectation active > vehicule_assigne field
            const vehiculeId = affectationMap.get(c.id) || c.vehicule_assigne;
            if (vehiculeId) {
              const immat = vehiculeMapById.get(vehiculeId);
              tracteur = immat && immat.trim() !== '' ? immat : 'Reserve';
            }
            
            const lastFormation = lastFormationMap.get(c.id);
            const dateRealisation = lastFormation?.date_formation || null;
            const datePrevue = lastFormation?.date_recyclage || null;

            return {
              id: c.id,
              numero: index + 1,
              chauffeur_id: c.id,
              chauffeur_nom: `${c.nom} ${c.prenom}`,
              tracteur,
              date_realisation_precedente: dateRealisation,
              date_prevue: datePrevue,
              observations: ''
            };
          });

        setEntries(planningEntries);
      }
    } catch (error) {
      console.error('Erreur chargement planning:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Planning de Recyclage ${year}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 9px; }
          .header { text-align: center; margin-bottom: 10px; }
          .header h1 { font-size: 16px; font-weight: bold; text-transform: uppercase; }
          .header h2 { font-size: 12px; color: #333; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #333; padding: 3px 5px; text-align: left; }
          th { background: #1a365d; color: white; font-size: 9px; text-align: center; }
          td { font-size: 8px; }
          tr:nth-child(even) { background: #f0f4f8; }
          .num-col { width: 35px; text-align: center; }
          .nom-col { width: 180px; }
          .tracteur-col { width: 100px; text-align: center; }
          .date-col { width: 100px; text-align: center; }
          .obs-col { width: 120px; }
          .footer { margin-top: 20px; display: flex; justify-content: space-between; }
          .footer div { width: 45%; }
          .footer .title { font-weight: bold; font-size: 10px; text-align: center; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 30px; }
          .company-name { font-size: 11px; font-weight: bold; color: #1a365d; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">SDBK TRANSPORT</div>
          <h1>Planning de Recyclage ${year}</h1>
        </div>
        <table>
          <thead>
            <tr>
              <th class="num-col">N°</th>
              <th class="nom-col">Nom / Prénoms</th>
              <th class="tracteur-col">Tracteurs</th>
              <th class="date-col">Date réalisation ${year - 1}</th>
              <th class="date-col">Date prévue ${year}</th>
              <th class="obs-col">Obs</th>
            </tr>
          </thead>
          <tbody>
            ${entries.map(e => `
              <tr>
                <td class="num-col">${String(e.numero).padStart(2, '0')}</td>
                <td class="nom-col">${e.chauffeur_nom}</td>
                <td class="tracteur-col">${e.tracteur}</td>
                <td class="date-col">${e.date_realisation_precedente ? format(new Date(e.date_realisation_precedente), 'dd/MM/yyyy') : ''}</td>
                <td class="date-col">${e.date_prevue ? format(new Date(e.date_prevue), 'dd/MM/yyyy') : ''}</td>
                <td class="obs-col">${e.observations}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <div>
            <div class="title">SERVICE FORMATION</div>
          </div>
          <div>
            <div class="title">LA SOCIETE</div>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const updateEntry = (index: number, field: keyof PlanningEntry, value: string) => {
    setEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">Planning de Recyclage</CardTitle>
          <div className="flex items-center gap-3">
            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={printRef}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10">
                    <TableHead className="w-[50px] text-center font-bold">N°</TableHead>
                    <TableHead className="font-bold">Nom / Prénoms</TableHead>
                    <TableHead className="w-[130px] text-center font-bold">Tracteurs</TableHead>
                    <TableHead className="w-[140px] text-center font-bold">Date réalisation {year - 1}</TableHead>
                    <TableHead className="w-[140px] text-center font-bold">Date prévue {year}</TableHead>
                    <TableHead className="w-[150px] font-bold">Obs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucun chauffeur trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry, index) => (
                      <TableRow key={entry.id} className={index % 2 === 0 ? '' : 'bg-muted/30'}>
                        <TableCell className="text-center font-medium">
                          {String(entry.numero).padStart(2, '0')}
                        </TableCell>
                        <TableCell className="font-medium">{entry.chauffeur_nom}</TableCell>
                        <TableCell className="text-center text-sm">{entry.tracteur}</TableCell>
                        <TableCell className="text-center text-sm">
                          {formatDate(entry.date_realisation_precedente)}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          <Input
                            type="date"
                            value={entry.date_prevue || ''}
                            onChange={e => updateEntry(index, 'date_prevue', e.target.value)}
                            className="h-7 text-xs text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={entry.observations}
                            onChange={e => updateEntry(index, 'observations', e.target.value)}
                            placeholder="..."
                            className="h-7 text-xs"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Signature area visible on screen */}
          <div className="mt-6 grid grid-cols-2 gap-8 border-t pt-4">
            <div className="text-center">
              <p className="font-semibold text-sm border-b pb-2 mb-8">SERVICE FORMATION</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm border-b pb-2 mb-8">LA SOCIETE</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
