// 6h40 — collecte des repères du jour.
// Automatique : dollar, livre (BCE via Frankfurter), Brent et or (Yahoo Finance), gazole (data.economie.gouv.fr).
// À la main : taux 10 ans, gaz, inflation, crédit immo, Livret A (fichier donnees/manuel.json).
import { readFileSync } from 'node:fs';
import { historiqueGazole } from './base.js';

const UA = 'Mozilla/5.0 (compatible; 6h40/1.0)';
const PARIS = 'Europe/Paris';

// ---------- mise en forme ----------
const fr = (n, d) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const jourParis = t => new Date(t).toLocaleDateString('fr-CA', { timeZone: PARIS }); // AAAA-MM-JJ
const jourCourt = j => new Date(j + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: PARIS });
const jourLong = j => new Date(j + 'T12:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: PARIS });

function variation(dernier, avant) {
  const pct = (dernier - avant) / avant * 100;
  const s = pct > 0.005 ? '+' : pct < -0.005 ? '−' : '';
  return { pct: Math.round(pct * 100) / 100, d: s + fr(Math.abs(pct), 2) + ' %' };
}

function sens(pct, sur) {
  if (pct > 0.005) return 'En hausse de ' + fr(pct, 2) + ' % ' + sur + '.';
  if (pct < -0.005) return 'En baisse de ' + fr(-pct, 2) + ' % ' + sur + '.';
  return 'Stable ' + sur + '.';
}

// Construit un repère au format attendu par la page à partir d'une série datée
function repere(serie, o) {
  const der = serie[serie.length - 1], prec = serie[serie.length - 2];
  const fmt = v => fr(v, o.decAffiche) + ' ' + o.unite;
  const vr = prec ? variation(der.v, prec.v) : { pct: 0, d: '—' };
  return {
    v: fmt(der.v), avant: prec ? fmt(prec.v) : fmt(der.v), d: vr.d, pct: prec ? vr.pct : null,
    num: der.v, unite: o.unite, dec: o.dec, pas: o.pas, src: o.src,
    sous: o.sous(der.j), serie: serie.map(p => ({ j: p.j, v: p.v, n: o.note })),
    txt: o.txt(der, prec, vr.pct), jour: der.j
  };
}

async function json(url) {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } });
  if (!r.ok) throw new Error(new URL(url).host + ' ' + r.status);
  return r.json();
}

// ---------- sources ----------

// Cours BCE sur 31 jours : 1 unité de devise en euros
async function bce(base) {
  const fin = new Date(), deb = new Date(fin - 31 * 864e5), f = d => d.toISOString().slice(0, 10);
  const j = await json(`https://api.frankfurter.dev/v1/${f(deb)}..?base=${base}&symbols=EUR`);
  const s = Object.keys(j.rates).sort().map(k => ({ j: k, v: j.rates[k].EUR }));
  if (s.length < 2) throw new Error('BCE ' + base + ' : série trop courte');
  return s;
}

// Clôtures quotidiennes Yahoo Finance sur 1 mois
async function yahoo(symbole) {
  const j = await json(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbole)}?range=1mo&interval=1d`);
  const r = j.chart?.result?.[0];
  if (!r) throw new Error('Yahoo ' + symbole + ' : pas de données');
  const t = r.timestamp || [], c = r.indicators?.quote?.[0]?.close || [];
  const s = [];
  t.forEach((ts, i) => { if (c[i] != null) s.push({ j: jourParis(ts * 1000), v: Math.round(c[i] * 100) / 100 }); });
  // un seul point par jour (le dernier)
  const parJour = new Map(s.map(p => [p.j, p]));
  const out = [...parJour.values()];
  if (out.length < 2) throw new Error('Yahoo ' + symbole + ' : série trop courte');
  return out;
}

// Prix moyen du gazole en France, stations mises à jour depuis 3 jours
async function gazoleMoyen() {
  const q = new URLSearchParams({
    select: 'avg(gazole_prix) as moy, count(gazole_prix) as n',
    where: 'gazole_prix > 0.5 and gazole_prix < 5 and gazole_maj >= now(days=-3)'
  });
  const j = await json('https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?' + q);
  const r = j.results?.[0];
  if (!r || !r.moy || r.n < 1000) throw new Error('gazole : trop peu de stations (' + (r?.n || 0) + ')');
  return { v: Math.round(r.moy * 1000) / 1000, n: r.n };
}

function manuel() {
  return JSON.parse(readFileSync(new URL('../donnees/manuel.json', import.meta.url), 'utf8'));
}

// ---------- relevé complet ----------
export async function construireReleve({ avecBase = false } = {}) {
  const maintenant = Date.now(), jour = jourParis(maintenant);
  const reperes = {}, erreurs = {};
  const [usd, gbp, brent, orUsd, gaz] = await Promise.allSettled([bce('USD'), bce('GBP'), yahoo('BZ=F'), yahoo('GC=F'), gazoleMoyen()]);

  if (usd.status === 'fulfilled') {
    reperes.usd = repere(usd.value, { unite: '€', decAffiche: 2, dec: 4, pas: 4, note: 'cours BCE', src: 'BCE via Frankfurter, 30 jours',
      sous: j => 'pour 1 $ · ' + jourCourt(j),
      txt: (d, p, pct) => `Pour 1 dollar, cours de référence BCE du ${jourLong(d.j)} (${fr(d.v, 4)} €). ${sens(pct, 'sur un jour')}` });
  } else erreurs.usd = usd.reason?.message;

  if (gbp.status === 'fulfilled') {
    reperes.gbp = repere(gbp.value, { unite: '€', decAffiche: 2, dec: 4, pas: 4, note: 'cours BCE', src: 'BCE via Frankfurter, 30 jours',
      sous: j => 'pour 1 £ · ' + jourCourt(j),
      txt: (d, p, pct) => `Pour 1 livre sterling, cours de référence BCE du ${jourLong(d.j)} (${fr(d.v, 4)} €). ${sens(pct, 'sur un jour')}` });
  } else erreurs.gbp = gbp.reason?.message;

  if (brent.status === 'fulfilled') {
    reperes.brent = repere(brent.value, { unite: '$', decAffiche: 2, dec: 2, pas: 4, note: 'clôture', src: 'Yahoo Finance (contrat Brent ICE)',
      sous: j => jourCourt(j),
      txt: (d, p, pct) => `Prix du baril de Brent (contrat à terme ICE) le ${jourLong(d.j)}. ${sens(pct, 'par rapport à la séance précédente')}` });
  } else erreurs.brent = brent.reason?.message;

  // Or : cours en dollars converti en euros au cours BCE du même jour
  if (orUsd.status === 'fulfilled' && usd.status === 'fulfilled') {
    const taux = usd.value;
    const tauxDu = j => { let t = taux[0].v; for (const p of taux) { if (p.j <= j) t = p.v; } return t; };
    const s = orUsd.value.map(p => ({ j: p.j, v: Math.round(p.v * tauxDu(p.j)) }));
    reperes.or = repere(s, { unite: '€', decAffiche: 0, dec: 0, pas: 4, note: 'cours converti en euros', src: 'Yahoo Finance (or COMEX) et BCE',
      sous: j => jourCourt(j),
      txt: (d, p, pct) => `L'once d'or le ${jourLong(d.j)}, cours de New York converti en euros au taux BCE, hors prime de fabrication. ${sens(pct, 'par rapport à la séance précédente')}` });
  } else erreurs.or = (orUsd.reason || usd.reason)?.message;

  // Gazole : la variation se calcule avec les relevés précédents gardés en base
  if (gaz.status === 'fulfilled') {
    let hist = [];
    if (avecBase) { try { hist = await historiqueGazole(jour); } catch (e) { erreurs.historique = e.message; } }
    const s = [...hist, { j: jour, v: gaz.value.v }];
    reperes.gazole = repere(s, { unite: '€', decAffiche: 3, dec: 3, pas: 2, note: 'moyenne nationale', src: 'data.economie.gouv.fr, ' + gaz.value.n + ' stations',
      sous: j => 'moyenne France · ' + jourCourt(j),
      txt: (d, p, pct) => `Moyenne France le ${jourLong(d.j)}, sur ${gaz.value.n} stations.` + (p ? ' ' + sens(pct, 'depuis le relevé du ' + jourLong(p.j)) : ' Variation affichée dès le prochain relevé.') });
  } else erreurs.gazole = gaz.reason?.message;

  const m = manuel();
  for (const k of ['oat', 'gaz', 'inflation', 'immo', 'livreta']) if (m[k]) reperes[k] = m[k];

  const heure = new Date(maintenant).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: PARIS });
  return { jour, cree_le: new Date(maintenant).toISOString(), date: 'Relevé du ' + jourCourt(jour) + ' · ' + heure, reperes, erreurs };
}

export { jourParis };
