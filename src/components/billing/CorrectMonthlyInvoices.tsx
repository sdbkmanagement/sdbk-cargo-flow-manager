import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { tarifsHydrocarburesService } from '@/services/tarifsHydrocarburesService';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const CorrectMonthlyInvoices = ({ onCorrectionComplete }: { onCorrectionComplete?: () => void }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{ facturesCorrigees: number; erreurs: string[] } | null>(null);

  const handleCorrection = async () => {
    setIsProcessing(true);
    setResults(null);

    try {
      // 1. Récupérer toutes les factures mensuelles (avec -GROUPE dans le numéro ou commençant par FM)
      const { data: factures, error: facturesError } = await supabase
        .from('factures')
        .select('*')
        .or('numero.ilike.%GROUPE%,numero.ilike.FM%');

      if (facturesError) throw facturesError;

      if (!factures || factures.length === 0) {
        toast({
          title: 'Aucune facture',
          description: 'Aucune facture mensuelle trouvée à corriger.',
        });
        setIsProcessing(false);
        return;
      }

      console.log(`${factures.length} factures mensuelles trouvées`);

      const erreurs: string[] = [];
      let facturesCorrigees = 0;

      for (const facture of factures) {
        try {
          // 2. Récupérer les lignes de la facture
          const { data: lignes, error: lignesError } = await supabase
            .from('facture_lignes')
            .select('*')
            .eq('facture_id', facture.id);

          if (lignesError) throw lignesError;

          if (!lignes || lignes.length === 0) {
            console.warn(`Aucune ligne pour la facture ${facture.numero}`);
            continue;
          }

          // 3. Recalculer les montants corrects (sans soustraire les manquants)
          let nouveauTotalHT = 0;

          for (const ligne of lignes) {
            // Le montant correct est quantite * prix_unitaire (sans manquants)
            const montantLigne = ligne.quantite * ligne.prix_unitaire;
            nouveauTotalHT += montantLigne;

            // Mettre à jour la ligne si nécessaire
            if (ligne.total !== montantLigne) {
              await supabase
                .from('facture_lignes')
                .update({ total: montantLigne })
                .eq('id', ligne.id);
            }
          }

          const nouveauTotalTVA = nouveauTotalHT * 0.18;
          const nouveauTotalTTC = nouveauTotalHT + nouveauTotalTVA;

          // 4. Mettre à jour la facture si les montants ont changé
          if (
            facture.montant_ht !== nouveauTotalHT ||
            facture.montant_tva !== nouveauTotalTVA ||
            facture.montant_ttc !== nouveauTotalTTC
          ) {
            const { error: updateError } = await supabase
              .from('factures')
              .update({
                montant_ht: nouveauTotalHT,
                montant_tva: nouveauTotalTVA,
                montant_ttc: nouveauTotalTTC,
                updated_at: new Date().toISOString()
              })
              .eq('id', facture.id);

            if (updateError) throw updateError;

            console.log(`Facture ${facture.numero} corrigée: ${facture.montant_ttc.toFixed(2)} → ${nouveauTotalTTC.toFixed(2)} GNF`);
            facturesCorrigees++;
          } else {
            console.log(`Facture ${facture.numero} déjà correcte`);
          }
        } catch (err: any) {
          console.error(`Erreur correction facture ${facture.numero}:`, err);
          erreurs.push(`${facture.numero}: ${err.message}`);
        }
      }

      setResults({ facturesCorrigees, erreurs });

      if (facturesCorrigees > 0) {
        toast({
          title: 'Correction terminée',
          description: `${facturesCorrigees} facture(s) mensuelle(s) corrigée(s) avec succès.`,
        });
        onCorrectionComplete?.();
      } else {
        toast({
          title: 'Aucune correction nécessaire',
          description: 'Toutes les factures mensuelles sont déjà correctes.',
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de la correction:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de corriger les factures.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <AlertCircle className="w-5 h-5" />
          Correction des factures mensuelles
        </CardTitle>
        <CardDescription>
          Recalculer les montants des factures mensuelles existantes pour exclure les manquants du montant facturé.
          Les manquants resteront affichés à titre informatif uniquement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Cette opération va recalculer tous les montants des factures mensuelles déjà créées 
            pour s'assurer que les manquants ne sont pas déduits du montant facturé.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleCorrection}
          disabled={isProcessing}
          className="w-full"
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
          {isProcessing ? 'Correction en cours...' : 'Corriger les factures mensuelles'}
        </Button>

        {results && (
          <div className="space-y-2">
            <Alert className={results.facturesCorrigees > 0 ? 'border-green-200 bg-green-50' : ''}>
              <AlertDescription className="text-sm">
                <strong>Résultat:</strong> {results.facturesCorrigees} facture(s) corrigée(s)
              </AlertDescription>
            </Alert>

            {results.erreurs.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">
                  <strong>Erreurs ({results.erreurs.length}):</strong>
                  <ul className="list-disc list-inside mt-2">
                    {results.erreurs.slice(0, 5).map((err, idx) => (
                      <li key={idx} className="text-xs">{err}</li>
                    ))}
                    {results.erreurs.length > 5 && (
                      <li className="text-xs">... et {results.erreurs.length - 5} autre(s)</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
