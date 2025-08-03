
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ExportButtonProps {
  onExportExcel: () => void;
  onExportCSV: () => void;
  onExportAlerts?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export const ExportButton = ({ 
  onExportExcel, 
  onExportCSV, 
  onExportAlerts,
  disabled = false,
  variant = 'outline',
  size = 'sm'
}: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: 'excel' | 'csv' | 'alerts', exportFn: () => void) => {
    try {
      setIsExporting(true);
      await exportFn();
      toast({
        title: "Export réussi",
        description: `Le fichier ${type === 'excel' ? 'Excel' : type === 'alerts' ? 'des alertes' : 'CSV'} a été téléchargé avec succès.`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export du fichier.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isExporting}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Export...' : 'Exporter'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport('excel', onExportExcel)}
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exporter en Excel
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('csv', onExportCSV)}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Exporter en CSV
        </DropdownMenuItem>
        {onExportAlerts && (
          <DropdownMenuItem
            onClick={() => handleExport('alerts', onExportAlerts)}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exporter les alertes
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
