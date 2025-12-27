
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pklhwfipldiswdboobua.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbGh3ZmlwbGRpc3dkYm9vYnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NzM3NTEsImV4cCI6MjA4MjI0OTc1MX0.A9Omf4jyyj8U1AF163GWHlvQC5BNeiuSPV1iaiXCGQc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
