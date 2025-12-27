/* ============================================
   Supabase Configuration
   ============================================ */

const SUPABASE_URL = 'https://pklhwfipldiswdboobua.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbGh3ZmlwbGRpc3dkYm9vYnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NzM3NTEsImV4cCI6MjA4MjI0OTc1MX0.A9Omf4jyyj8U1AF163GWHlvQC5BNeiuSPV1iaiXCGQc';

// Initialize Supabase client using the CDN-loaded library
// The CDN script exposes `supabase` as a global object with `createClient` method
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other modules
window.supabaseClient = supabaseClient;
