import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rgojpowqpydsuskzhyrk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_G6CAltf5gUcolQvsj-lH5A_nzxeK-dy";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
