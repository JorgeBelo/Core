import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://icnkhgkhqfbzldenhrjw.supabase.co';
const supabaseKey = 'sb_publishable_peKAjBMhQldieg9IV3soeA_b8Y7Hj6T';

export const supabase = createClient(supabaseUrl, supabaseKey);
