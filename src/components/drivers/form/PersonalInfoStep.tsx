
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, IdCard, MapPin, Calendar, Phone, Mail } from 'lucide-react';

interface PersonalInfoStepProps {
  form: any;
}

export const PersonalInfoStep = ({ form }: PersonalInfoStepProps) => {
  // Calculer l'âge automatiquement à partir de la date de naissance
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  const watchedBirthDate = form.watch('dateNaissance');
  React.useEffect(() => {
    if (watchedBirthDate) {
      const age = calculateAge(watchedBirthDate);
      form.setValue('age', age);
    }
  }, [watchedBirthDate, form]);

  return (
    <div className="space-y-6">
      {/* Informations administratives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IdCard className="w-5 h-5" />
            Informations administratives
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="matricule"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matricule</FormLabel>
                <FormControl>
                  <Input placeholder="Matricule du chauffeur" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="id_conducteur"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Conducteur</FormLabel>
                <FormControl>
                  <Input placeholder="Identifiant conducteur" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="immatricule_cnss"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Immatricule CNSS</FormLabel>
                <FormControl>
                  <Input placeholder="Numéro CNSS" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Informations personnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="nom"
              rules={{ required: "Le nom est obligatoire" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom du chauffeur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prenom"
              rules={{ required: "Le prénom est obligatoire" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénoms *</FormLabel>
                  <FormControl>
                    <Input placeholder="Prénoms du chauffeur" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="dateNaissance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de Naissance</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Âge</FormLabel>
                  <FormControl>
                    <Input placeholder="Calculé automatiquement" {...field} readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lieu_naissance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lieu de Naissance</FormLabel>
                  <FormControl>
                    <Input placeholder="Ville de naissance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="groupe_sanguin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Groupe Sanguin</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le groupe sanguin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="statut_matrimonial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut Matrimonial</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="celibataire">Célibataire</SelectItem>
                        <SelectItem value="marie">Marié(e)</SelectItem>
                        <SelectItem value="divorce">Divorcé(e)</SelectItem>
                        <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="filiation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Filiation</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Informations sur la filiation (parents, etc.)"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Informations professionnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Informations professionnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="fonction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fonction</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la fonction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="titulaire">Titulaire</SelectItem>
                        <SelectItem value="reserve">Réserve</SelectItem>
                        <SelectItem value="doublon">Doublon</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="base_chauffeur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Chauffeur</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la base" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conakry">Conakry</SelectItem>
                        <SelectItem value="kankan">Kankan</SelectItem>
                        <SelectItem value="nzerekore">N'Zérékoré</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date_embauche"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date d'Embauche</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact et adresse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact et adresse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="telephone"
              rules={{ required: "Le téléphone est obligatoire" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact (Téléphone) *</FormLabel>
                  <FormControl>
                    <Input placeholder="+224 XXX XXX XXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemple.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="adresse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="Adresse complète" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ville"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ville</FormLabel>
                  <FormControl>
                    <Input placeholder="Ville" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Permis de conduire */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IdCard className="w-5 h-5" />
            Permis de conduire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="numeroPermis"
              rules={{ required: "Le numéro de permis est obligatoire" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de permis *</FormLabel>
                  <FormControl>
                    <Input placeholder="Numéro du permis de conduire" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateExpirationPermis"
              rules={{ required: "La date d'expiration est obligatoire" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date d'expiration *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="typePermis"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Types de permis</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-4">
                    {['A', 'A1', 'B', 'C', 'C1', 'D', 'D1', 'E'].map((type) => (
                      <label key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={field.value?.includes(type) || false}
                          onChange={(e) => {
                            const currentTypes = field.value || [];
                            if (e.target.checked) {
                              field.onChange([...currentTypes, type]);
                            } else {
                              field.onChange(currentTypes.filter((t: string) => t !== type));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span>Permis {type}</span>
                      </label>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};
