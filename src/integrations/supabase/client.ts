// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vyyexbyqjrasipkxezpl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5eWV4YnlxanJhc2lwa3hlenBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MDM4MjksImV4cCI6MjA2NTQ3OTgyOX0.K_6nwFfaNWG_MkY9qSdbDMeq1emoq7O3P5zYydMjUKM";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);