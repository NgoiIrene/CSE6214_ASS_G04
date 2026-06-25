const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://yeytzbyyspbwpqbyzmhq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlleXR6Ynl5c3Bid3BxYnl6bWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MTEzNzcsImV4cCI6MjA5NzE4NzM3N30.2w7y_IjR1LIyNjnNSzRorT_tFB7puFT5GoCU23o7Ung';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, vendro_commission')
    .eq('account_type', 'vendor')
    .limit(3);
  if (error) {
    console.error('Error fetching profiles with vendro_commission:', error);
  } else {
    console.log('Profiles with vendro_commission:', data);
  }
}
run();
