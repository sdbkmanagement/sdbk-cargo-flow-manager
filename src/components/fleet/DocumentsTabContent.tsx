
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Upload } from 'lucide-react';

export const DocumentsTabContent = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents de la flotte
              </CardTitle>
              <CardDescription>
                Gérez les documents administratifs de vos véhicules
              </CardDescription>
            </div>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Ajouter un document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun document</h3>
            <p className="mt-1 text-sm text-gray-500">
              Commencez par ajouter des documents pour vos véhicules.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents expirant bientôt</CardTitle>
          <CardDescription>
            Documents nécessitant un renouvellement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Assurances à renouveler</p>
                <p className="text-sm text-gray-500">Vérifiez les dates d'expiration</p>
              </div>
              <Badge variant="destructive">Urgent</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
