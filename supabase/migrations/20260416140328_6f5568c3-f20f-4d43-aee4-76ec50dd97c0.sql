-- Update type_transport check constraint to include 'marchandise'
ALTER TABLE public.vehicules DROP CONSTRAINT vehicules_type_transport_check;

ALTER TABLE public.vehicules ADD CONSTRAINT vehicules_type_transport_check 
  CHECK (type_transport::text = ANY (ARRAY['hydrocarbures', 'bauxite', 'marchandise']::text[]));