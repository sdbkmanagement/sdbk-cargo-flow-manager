UPDATE public.vehicules 
SET lot = 'lot1_total_energie' 
WHERE type_transport = 'hydrocarbures' 
  AND (lot IS NULL OR lot = '');