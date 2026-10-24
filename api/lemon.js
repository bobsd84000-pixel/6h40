// 6h40 — POST /api/lemon : webhook Lemon Squeezy.
// Garde à jour la liste des abonnés Pro (création, renouvellement, résiliation, expiration).
import { createHmac, timingSafeEqual } from 'node:crypto';
import { baseActive, sauverAbonne } from '../lib/base.js';

export async function POST(request) {
  const secret = (process.env.LEMON_WEBHOOK_SECRET || '').trim();
  if (!secret || !baseActive()) return Response.json({ erreur: 'Webhook non configuré' }, { status: 500 });

  const brut = await request.text();
  const recu = Buffer.from(request.headers.get('x-signature') || '', 'utf8');
  const attendu = Buffer.from(createHmac('sha256', secret).update(brut).digest('hex'), 'utf8');
  if (recu.length !== attendu.length || !timingSafeEqual(recu, attendu)) return Response.json({ erreur: 'Signature invalide' }, { status: 401 });

  let evt;
  try { evt = JSON.parse(brut); } catch { return Response.json({ erreur: 'JSON invalide' }, { status: 400 }); }
  const nom = evt.meta?.event_name || '';
  if (!nom.startsWith('subscription_')) return Response.json({ ignore: nom });

  const a = evt.data?.attributes || {};
  const boutique = (process.env.LEMON_STORE_ID || '').trim();
  if (boutique && String(a.store_id) !== boutique) return Response.json({ ignore: 'autre boutique' });
  if (!a.user_email) return Response.json({ erreur: 'Mail absent' }, { status: 400 });

  await sauverAbonne({
    email: String(a.user_email).toLowerCase(),
    statut: a.status || 'inconnu',
    fin: a.ends_at || null,
    portail: a.urls?.customer_portal || null,
    abonnement_id: String(evt.data?.id || '')
  });
  return Response.json({ ok: true, evenement: nom, statut: a.status });
}
