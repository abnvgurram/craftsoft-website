
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('setting_key', 'inactivity_timeout');

    if (error) {
        console.error('Error fetching settings:', error);
    } else {
        console.log('Settings:', data);
    }
}

checkSettings();
