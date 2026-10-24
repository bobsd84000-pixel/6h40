// 6h40 — tâche programmée chaque matin (voir vercel.json) :
// 1. calcule et enregistre le relevé du jour, 2. l'envoie par mail aux abonnés Pro.
import { construireReleve } from '../lib/sources.js';
import { baseActive, sauverReleve, abonnesActifs } from '../lib/base.js';
import { envoyerMails } from '../lib/mail.js';

export async function GET(request) {
  const secret = (process.env.CRON_SECRET || '').trim();
  if (!secret) return Response.json({ erreur: 'CRON_SECRET manquant sur le serveur' }, { status: 500 });
  if (request.headers.get('authorization') !== 'Bearer ' + secret) return Response.json({ erreur: 'Accès refusé' }, { status: 401 });

  const base = baseActive();
  const rel = await construireReleve({ avecBase: base });
  const bilan = { jour: rel.jour, erreursSources: rel.erreurs };
  if (!base) return Response.json({ ...bilan, erreur: 'Base non configurée : relevé non enregistré, aucun mail envoyé' });

  try { await sauverReleve(rel); bilan.enregistre = true; } catch (e) { bilan.enregistre = false; bilan.erreurSauvegarde = e.message; }
  try {
    const abonnes = await abonnesActifs();
    bilan.abonnes = abonnes.length;
    bilan.mails = abonnes.length ? await envoyerMails(rel, abonnes) : { envoyes: 0 };
  } catch (e) { bilan.erreurMails = e.message; }
  return Response.json(bilan, { headers: { 'cache-control': 'no-store' } });
}
