import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { maintenanceTemporaireService } from '@/services/maintenanceTemporaire'
import { useToast } from '@/hooks/use-toast'
import { 
  Wrench, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Settings
} from 'lucide-react'
import type { Database } from '@/integrations/supabase/types'

type Vehicule = Database['public']['Tables']['vehicules']['Row']

interface PostMissionWorkflowProps {
  vehicule: Vehicule
  userRole: string
  userName: string
  userId: string
  onClose: () => void
}

export const PostMissionWorkflow = ({
  vehicule,
  userRole,
  userName,
  userId,
  onClose
}: PostMissionWorkflowProps) => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('maintenance')
  const [isLoading, setIsLoading] = useState(false)
  const [maintenances, setMaintenances] = useState<any[]>([])

  // État pour le formulaire de maintenance
  const [maintenanceForm, setMaintenanceForm] = useState({
    type_panne: '',
    description: '',
    date_diagnostic: new Date().toISOString().split('T')[0],
    cout_reparation: 0
  })

  useEffect(() => {
    loadMaintenances()
  }, [vehicule.id])

  const loadMaintenances = async () => {
    try {
      const data = await maintenanceTemporaireService.getMaintenancesByVehicle(vehicule.id)
      setMaintenances(data)
    } catch (error) {
      console.error('Erreur lors du chargement des maintenances:', error)
    }
  }

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await maintenanceTemporaireService.createMaintenance(vehicule.id, maintenanceForm)
      
      // Mettre à jour le statut du véhicule
      await maintenanceTemporaireService.updateVehicleStatus(vehicule.id, 'maintenance')
      
      toast({
        title: 'Diagnostic créé',
        description: 'Le diagnostic de maintenance a été enregistré avec succès.',
      })

      // Recharger les maintenances
      loadMaintenances()
      
      // Réinitialiser le formulaire
      setMaintenanceForm({
        type_panne: '',
        description: '',
        date_diagnostic: new Date().toISOString().split('T')[0],
        cout_reparation: 0
      })
      
    } catch (error) {
      console.error('Erreur lors de la création du diagnostic:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le diagnostic de maintenance.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleValidateMaintenance = async () => {
    setIsLoading(true)
    try {
      await maintenanceTemporaireService.updateVehicleStatus(vehicule.id, 'disponible')
      
      toast({
        title: 'Maintenance validée',
        description: 'Le véhicule est maintenant disponible.',
      })

      onClose()
    } catch (error) {
      console.error('Erreur lors de la validation:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de valider la maintenance.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatutBadge = (status: string) => {
    const statusConfig = {
      'disponible': { label: 'Disponible', variant: 'default' as const, icon: CheckCircle },
      'maintenance': { label: 'En maintenance', variant: 'secondary' as const, icon: Wrench },
      'indisponible': { label: 'Indisponible', variant: 'destructive' as const, icon: AlertTriangle },
      'en_mission': { label: 'En mission', variant: 'outline' as const, icon: Clock },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['indisponible']
    const IconComponent = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const canAccessMaintenance = userRole === 'maintenance' || userRole === 'admin'
  const canAccessAdministratif = userRole === 'administratif' || userRole === 'admin'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Processus post-mission
              </CardTitle>
              <CardDescription>
                Véhicule: {vehicule.numero} - {vehicule.immatriculation || 'Sans immatriculation'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {getStatutBadge(vehicule.statut)}
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="maintenance" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Contrôle Maintenance
                </TabsTrigger>
                <TabsTrigger value="administratif" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Vérification Administrative
                </TabsTrigger>
              </TabsList>

              <TabsContent value="maintenance" className="space-y-6">
                {!canAccessMaintenance ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Vous n'avez pas les permissions nécessaires pour accéder à la gestion de maintenance.
                      Seuls les utilisateurs avec le rôle "Maintenance" peuvent intervenir.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wrench className="h-5 w-5" />
                          Diagnostic de Maintenance
                        </CardTitle>
                        <CardDescription>
                          Enregistrer les observations et interventions nécessaires
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="type_panne">Type de panne</Label>
                              <Select 
                                value={maintenanceForm.type_panne} 
                                onValueChange={(value) => setMaintenanceForm({...maintenanceForm, type_panne: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner le type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {maintenanceTemporaireService.getTypesPannes().map((type) => (
                                    <SelectItem key={type.id} value={type.libelle}>
                                      {type.libelle}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="date_diagnostic">Date du diagnostic</Label>
                              <Input
                                id="date_diagnostic"
                                type="date"
                                value={maintenanceForm.date_diagnostic}
                                onChange={(e) => setMaintenanceForm({...maintenanceForm, date_diagnostic: e.target.value})}
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description">Description / Observations</Label>
                            <Textarea
                              id="description"
                              placeholder="Décrivez le problème et les interventions réalisées..."
                              value={maintenanceForm.description}
                              onChange={(e) => setMaintenanceForm({...maintenanceForm, description: e.target.value})}
                              required
                              rows={4}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="cout_reparation">Coût de la réparation (€)</Label>
                            <Input
                              id="cout_reparation"
                              type="number"
                              min="0"
                              step="0.01"
                              value={maintenanceForm.cout_reparation}
                              onChange={(e) => setMaintenanceForm({...maintenanceForm, cout_reparation: parseFloat(e.target.value) || 0})}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? 'Enregistrement...' : 'Enregistrer le diagnostic'}
                            </Button>
                            {maintenances.length > 0 && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleValidateMaintenance}
                                disabled={isLoading}
                              >
                                Valider la maintenance
                              </Button>
                            )}
                          </div>
                        </form>
                      </CardContent>
                    </Card>

                    {/* Historique des maintenances */}
                    {maintenances.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Historique des interventions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {maintenances.map((maintenance, index) => (
                              <div key={maintenance.id || index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                <div>
                                  <p className="font-medium">{maintenance.type_maintenance}</p>
                                  <p className="text-sm text-muted-foreground">{maintenance.description}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(maintenance.date_maintenance).toLocaleDateString()}
                                  </p>
                                </div>
                                {maintenance.cout && (
                                  <Badge variant="outline">
                                    {maintenance.cout}€
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="administratif" className="space-y-6">
                {!canAccessAdministratif ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Vous n'avez pas les permissions nécessaires pour accéder à la gestion administrative.
                      Seuls les utilisateurs avec le rôle "Administratif" peuvent modifier et valider les documents.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Vérification Administrative
                      </CardTitle>
                      <CardDescription>
                        Contrôle et validation des documents administratifs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          La gestion complète des documents sera disponible après la migration de la base de données.
                          En attendant, vous pouvez consulter les documents existants dans l'onglet "Documents" du véhicule.
                        </AlertDescription>
                      </Alert>

                      <div className="mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab('maintenance')}
                        >
                          Retour à la maintenance
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}