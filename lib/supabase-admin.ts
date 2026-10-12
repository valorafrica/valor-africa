import { createClient } from '@supabase/supabase-js'

// Ce client utilise la clé secrète (service_role).
// Il ne doit JAMAIS être importé dans un composant utilisé côté navigateur,
// uniquement dans les fichiers du dossier app/api/.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)