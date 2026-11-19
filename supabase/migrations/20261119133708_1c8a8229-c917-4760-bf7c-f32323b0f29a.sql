DO $$
DECLARE
  ot_ids uuid[] := ARRAY['d162d60f-ec70-45c5-ba66-7298be57e098','25d2f4c8-b397-4b41-9df8-082bbaabc876','908f6fa9-228f-4f59-ba8e-9248e67e31f1','d14a5dc8-1aa4-495e-88f9-27a8ab1166a6','e29097cb-4cab-4b2a-8b96-78d386b7fd66','047a485d-b395-48e2-ae53-faada83a083a','4624a10f-5654-4e63-84d1-b55bd1229805','5a55bca7-6a06-47ed-9cbe-0645fc4a4b2b','581a4d1a-0031-4326-a22d-6ca04f128775']::uuid[];
  di_ids uuid[] := ARRAY['ae9ae7d3-5675-47fb-971e-8360530a7f4e','ae3f1bef-6af3-4e89-b1cd-ccc7737b0130','394a7855-47fe-4555-8e45-9ee001756884','f25773e4-a4eb-44a1-99c1-91c7499bb7f1','68224b45-529c-4649-add6-1157173b77b1','17f87f00-a957-4d6e-b696-5ab818256f52','ef6a30b1-8cfb-44f7-ba57-9b0ab020a7c1','7e7a9d03-51d8-41f2-95ad-21ca80c55936','0fc5c69f-461c-4ba0-be1c-97da6be617a6','7d4dac40-46a1-43dc-a697-0768b0ba38ae','2b538a39-513a-44c6-907a-f172519e5b0f']::uuid[];
BEGIN
  -- Delete consumption first while its parent exists: the existing trigger restores stock.
  DELETE FROM public.gmao_ot_pieces WHERE ot_id = ANY(ot_ids);
  DELETE FROM public.gmao_mouvements_stock WHERE ot_id = ANY(ot_ids);
  DELETE FROM public.gmao_ordres_travail WHERE id = ANY(ot_ids);
  DELETE FROM public.gmao_demandes_intervention WHERE id = ANY(di_ids);
END $$;