import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function cleanDuplicates() {
  const { data: bookings } = await supabase.from('bookings').select('*');
  const seen = new Set();
  const toDelete = [];
  
  for (const b of bookings) {
    const key = `${b.user_id}-${b.room_id}-${b.status}`;
    if (seen.has(key)) {
      toDelete.push(b.id);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} duplicates...`);
    const { error } = await supabase.from('bookings').delete().in('id', toDelete);
    if (error) console.error(error);
    else console.log('Cleaned duplicates.');
  } else {
    console.log('No duplicates found.');
  }
}
cleanDuplicates();
