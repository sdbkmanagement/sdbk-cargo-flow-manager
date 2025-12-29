import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocieteDocumentsList } from '@/components/societe/SocieteDocumentsList';
import { SocieteDocumentForm } from '@/components/societe/SocieteDocumentForm';
import { SocieteAlertsDashboard } from '@/components/societe/SocieteAlertsDashboard';
import { SocieteAuditLog } from '@/components/societe/SocieteAuditLog';
import { SocieteStats } from '@/components/societe/SocieteStats';
import { 
  FileText, 
  AlertTriangle, 
  History, 
  PlusCircle,
  BarChart3
} from 'lucide-react';

const Societe: React.FC = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [showForm, setShowForm] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateDocument = () => {
    setEditingDocumentId(null);
    setShowForm(true);
  };

  const handleEditDocument = (documentId: string) => {
    setEditingDocumentId(documentId);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDocumentId(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingDocumentId(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <SocieteStats key={`stats-${refreshKey}`} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="alertes" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Alertes</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Historique</span>
          </TabsTrigger>
          <TabsTrigger value="nouveau" className="flex items-center gap-2" onClick={handleCreateDocument}>
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <SocieteDocumentsList 
            key={`list-${refreshKey}`}
            onEdit={handleEditDocument}
            onRefresh={() => setRefreshKey(prev => prev + 1)}
          />
        </TabsContent>

        <TabsContent value="alertes" className="mt-6">
          <SocieteAlertsDashboard key={`alerts-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <SocieteAuditLog key={`audit-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="nouveau" className="mt-6">
          <SocieteDocumentForm 
            documentId={editingDocumentId}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
          />
        </TabsContent>
      </Tabs>

      {/* Form Dialog for editing */}
      {showForm && activeTab !== 'nouveau' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <SocieteDocumentForm 
              documentId={editingDocumentId}
              onClose={handleFormClose}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Societe;
