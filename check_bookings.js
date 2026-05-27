import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicateBookings() {
  const { data, error } = await supabase.from('bookings').select('*, users(email)');
  console.log(JSON.stringify(data, null, 2));
}
checkDuplicateBookings();
