
-- Table principale pour les employés
CREATE TABLE public.employes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  photo_url TEXT,
  poste VARCHAR(100) NOT NULL,
  service VARCHAR(50) NOT NULL, -- Transport, Maintenance, HSECQ, Administration, Direction
  date_embauche DATE NOT NULL,
  date_fin_contrat DATE,
  statut VARCHAR(20) NOT NULL DEFAULT 'actif', -- actif, inactif, en_arret
  type_contrat VARCHAR(20) NOT NULL DEFAULT 'CDI', -- CDI, CDD, Stage, Interim
  telephone VARCHAR(20),
  email VARCHAR(100),
  remarques TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les absences et congés
CREATE TABLE public.absences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employe_id UUID NOT NULL,
  type_absence VARCHAR(30) NOT NULL, -- conge, arret_maladie, formation, conge_sans_solde, autres
  motif TEXT,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  nombre_jours INTEGER GENERATED ALWAYS AS (date_fin - date_debut + 1) STORED,
  statut VARCHAR(20) NOT NULL DEFAULT 'en_attente', -- en_attente, approuve, refuse
  approuve_par VARCHAR(100),
  commentaires TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (employe_id) REFERENCES public.employes(id) ON DELETE CASCADE
);

-- Table pour les formations
CREATE TABLE public.formations_employes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employe_id UUID NOT NULL,
  nom_formation VARCHAR(200) NOT NULL,
  organisme VARCHAR(150),
  date_debut DATE NOT NULL,
  date_fin DATE,
  date_expiration DATE,
  certificat_url TEXT,
  statut VARCHAR(20) NOT NULL DEFAULT 'valide', -- valide, expire, a_renouveler
  obligatoire BOOLEAN DEFAULT false,
  remarques TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (employe_id) REFERENCES public.employes(id) ON DELETE CASCADE
);

-- Table pour l'historique RH
CREATE TABLE public.historique_rh (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employe_id UUID NOT NULL,
  type_evenement VARCHAR(50) NOT NULL, -- embauche, changement_poste, promotion, sanction, fin_contrat, evaluation
  ancien_poste VARCHAR(100),
  nouveau_poste VARCHAR(100),
  ancien_service VARCHAR(50),
  nouveau_service VARCHAR(50),
  description TEXT NOT NULL,
  date_evenement DATE NOT NULL DEFAULT CURRENT_DATE,
  saisi_par VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (employe_id) REFERENCES public.employes(id) ON DELETE CASCADE
);

-- Trigger pour ajouter automatiquement à l'historique lors de l'embauche
CREATE OR REPLACE FUNCTION add_embauche_to_historique()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.historique_rh (employe_id, type_evenement, nouveau_poste, nouveau_service, description, date_evenement)
    VALUES (NEW.id, 'embauche', NEW.poste, NEW.service, 'Embauche - ' || NEW.poste || ' dans le service ' || NEW.service, NEW.date_embauche);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Détecter changement de poste
    IF OLD.poste != NEW.poste OR OLD.service != NEW.service THEN
      INSERT INTO public.historique_rh (employe_id, type_evenement, ancien_poste, nouveau_poste, ancien_service, nouveau_service, description)
      VALUES (NEW.id, 'changement_poste', OLD.poste, NEW.poste, OLD.service, NEW.service, 
              'Changement: ' || OLD.poste || ' (' || OLD.service || ') → ' || NEW.poste || ' (' || NEW.service || ')');
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_employe_historique
  AFTER INSERT OR UPDATE ON public.employes
  FOR EACH ROW
  EXECUTE FUNCTION add_embauche_to_historique();

-- Utiliser la fonction existante pour updated_at
CREATE TRIGGER trigger_update_employes_updated_at
  BEFORE UPDATE ON public.employes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_absences_updated_at
  BEFORE UPDATE ON public.absences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_formations_updated_at
  BEFORE UPDATE ON public.formations_employes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Vue pour les alertes RH
CREATE OR REPLACE VIEW public.alertes_rh AS
SELECT 
  'fin_contrat' as type_alerte,
  e.id as employe_id,
  e.nom || ' ' || e.prenom as nom_complet,
  e.poste,
  e.service,
  'Fin de contrat dans ' || (e.date_fin_contrat - CURRENT_DATE) || ' jours' as message,
  e.date_fin_contrat as date_echeance,
  CASE 
    WHEN e.date_fin_contrat - CURRENT_DATE <= 7 THEN 'critique'
    WHEN e.date_fin_contrat - CURRENT_DATE <= 30 THEN 'important'
    ELSE 'normal'
  END as priorite
FROM public.employes e
WHERE e.date_fin_contrat IS NOT NULL 
  AND e.date_fin_contrat <= CURRENT_DATE + INTERVAL '60 days'
  AND e.statut = 'actif'

UNION ALL

SELECT 
  'formation_expire' as type_alerte,
  e.id as employe_id,
  e.nom || ' ' || e.prenom as nom_complet,
  e.poste,
  e.service,
  'Formation "' || f.nom_formation || '" expirée' as message,
  f.date_expiration as date_echeance,
  CASE 
    WHEN f.date_expiration < CURRENT_DATE THEN 'critique'
    WHEN f.date_expiration <= CURRENT_DATE + INTERVAL '30 days' THEN 'important'
    ELSE 'normal'
  END as priorite
FROM public.employes e
JOIN public.formations_employes f ON e.id = f.employe_id
WHERE f.obligatoire = true 
  AND f.date_expiration IS NOT NULL
  AND f.date_expiration <= CURRENT_DATE + INTERVAL '60 days'
  AND e.statut = 'actif'

UNION ALL

SELECT 
  'absence_longue' as type_alerte,
  e.id as employe_id,
  e.nom || ' ' || e.prenom as nom_complet,
  e.poste,
  e.service,
  'Absence longue durée (' || a.nombre_jours || ' jours)' as message,
  a.date_fin as date_echeance,
  CASE 
    WHEN a.nombre_jours >= 30 THEN 'critique'
    WHEN a.nombre_jours >= 15 THEN 'important'
    ELSE 'normal'
  END as priorite
FROM public.employes e
JOIN public.absences a ON e.id = a.employe_id
WHERE a.statut = 'approuve'
  AND a.date_debut <= CURRENT_DATE
  AND a.date_fin >= CURRENT_DATE
  AND a.nombre_jours >= 10
  AND e.statut = 'actif';
