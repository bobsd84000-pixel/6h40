// 6h40 — GET /api/releve : le relevé du jour pour la page.
// Lit le relevé enregistré à 6 h 40 ; s'il n'existe pas encore, le calcule et l'enregistre.
import { construireReleve, jourParis } from '../lib/sources.js';
import { baseActive, dernierReleve, sauverReleve } from '../lib/base.js';

export async function GET() {
  let rel = null;
  const base = baseActive();
  if (base) {
    try {
      const d = await dernierReleve();
      if (d && d.jour === jourParis(Date.now())) rel = d;
    } catch (e) { /* base indisponible : on calcule en direct */ }
  }
  if (!rel) {
    rel = await construireReleve({ avecBase: base });
    if (base) { try { await sauverReleve(rel); } catch (e) { rel.erreurs.sauvegarde = e.message; } }
  }
  return Response.json(
    { ...rel, lienPro: (process.env.LEMON_LIEN_PRO || '').trim() },
    { headers: { 'cache-control': 'public, s-maxage=900, stale-while-revalidate=3600' } }
  );
}
