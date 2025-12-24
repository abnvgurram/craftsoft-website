// Supabase Configuration
const supabaseUrl = 'https://ogkownghceldmagzjhdq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9na293bmdoY2VsZG1hZ3pqaGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NTI1MzQsImV4cCI6MjA4MjEyODUzNH0.HQ64E3jcSc0eXRKTeNYplVoqagC2LqxXUeRri0PZBM4';

const client = supabase.createClient(supabaseUrl, supabaseKey);
window['supabase'] = client;
console.log('⚡ Supabase Connected');
