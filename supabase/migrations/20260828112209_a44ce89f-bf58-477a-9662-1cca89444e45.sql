DROP POLICY IF EXISTS "Employés peuvent voir leur profil" ON public.employes;
CREATE POLICY "Employés peuvent voir leur profil"
ON public.employes FOR SELECT TO authenticated
USING (email = (auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Employés peuvent voir leurs absences" ON public.absences;
CREATE POLICY "Employés peuvent voir leurs absences"
ON public.absences FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.employes e WHERE e.id = absences.employe_id AND e.email = (auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS "Employés peuvent voir leurs formations" ON public.formations_employes;
CREATE POLICY "Employés peuvent voir leurs formations"
ON public.formations_employes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.employes e WHERE e.id = formations_employes.employe_id AND e.email = (auth.jwt() ->> 'email')));