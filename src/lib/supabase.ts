import { createClient } from "@supabase/supabase-js";

const VITE_SUPABASE_URL = "https://rgojpowqpydsuszkzhyrk.supabase.co";
const VITE_SUPABASE_ANON_KEY = "sb_publishable_G6CAltf5gUcolQvsj-lH5A_nzxeK-dy";

export const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
