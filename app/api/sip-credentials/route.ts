import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !userData?.user?.email) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
  }

  const email = userData.user.email;

  const { data: sip, error: sipError } = await supabaseAdmin
    .from('sip_extensions')
    .select('sip_extension, sip_password, sip_domain')
    .eq('agent_email', email)
    .eq('active', true)
    .single();

  if (sipError || !sip) {
    return NextResponse.json(
      { error: 'Aucun poste téléphonique configuré pour cet agent' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    extension: sip.sip_extension,
    password: sip.sip_password,
    domain: sip.sip_domain,
  });
}