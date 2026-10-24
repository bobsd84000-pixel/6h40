// 6h40 — accès à la base Supabase (tables releves et abonnes), côté serveur uniquement.
// Sans SUPABASE_URL / SUPABASE_SERVICE_KEY, le site marche quand même : pas d'historique, pas de mails.

const URL_BASE = () => (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const CLE = () => (process.env.SUPABASE_SERVICE_KEY || '').trim();

export function baseActive() {
  return !!(URL_BASE() && CLE());
}

async function appel(chemin, options = {}) {
  const r = await fetch(URL_BASE() + '/rest/v1/' + chemin, {
    ...options,
    headers: {
      apikey: CLE(),
      Authorization: 'Bearer ' + CLE(),
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!r.ok) throw new Error('base ' + r.status + ' : ' + (await r.text()).slice(0, 200));
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

// Dernier relevé enregistré
export async function dernierReleve() {
  const l = await appel('h640_releves?select=donnees&order=jour.desc&limit=1');
  return l && l[0] ? l[0].donnees : null;
}

// Prix du gazole des 30 derniers relevés, du plus ancien au plus récent
export async function historiqueGazole(avantLe) {
  const l = await appel('h640_releves?select=jour,prix:donnees->reperes->gazole->>num&jour=lt.' + avantLe + '&order=jour.desc&limit=30');
  return (l || []).filter(x => x.prix != null).map(x => ({ j: x.jour, v: Number(x.prix) })).reverse();
}

// Enregistre (ou remplace) le relevé du jour
export async function sauverReleve(rel) {
  await appel('h640_releves?on_conflict=jour', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ jour: rel.jour, donnees: rel })
  });
}

// Abonnés Pro à qui envoyer le mail
export async function abonnesActifs() {
  const l = await appel('h640_abonnes?select=email,portail,statut,fin&statut=in.(active,on_trial,cancelled)');
  const maintenant = Date.now();
  // Un abonnement résilié reste actif jusqu'à la fin de la période payée
  return (l || []).filter(a => a.statut !== 'cancelled' || (a.fin && Date.parse(a.fin) > maintenant));
}

// Crée ou met à jour un abonné (appelé par le webhook Lemon Squeezy)
export async function sauverAbonne(ab) {
  await appel('h640_abonnes?on_conflict=email', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ ...ab, maj: new Date().toISOString() })
  });
}
