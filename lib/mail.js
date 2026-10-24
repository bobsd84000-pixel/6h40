// 6h40 — mail du matin pour les abonnés Pro, envoyé avec Resend.
const NOMS = [
  ['usd', 'Dollar'], ['gbp', 'Livre sterling'], ['brent', 'Baril Brent'], ['or', "Or, l'once"], ['oat', 'Taux 10 ans France'],
  ['gazole', 'Gazole, le litre'], ['gaz', 'Gaz, le kWh'], ['inflation', 'Inflation sur un an'], ['immo', 'Crédit immo 20 ans'], ['livreta', 'Livret A']
];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function couleur(d) {
  const c = String(d || '').charAt(0);
  return c === '+' ? '#067132' : (c === '−' || c === '-') && d.length > 1 ? '#b13e06' : '#555555';
}

export function htmlMail(rel, site, portail) {
  const lignes = NOMS.filter(([id]) => rel.reperes[id]).map(([id, nom]) => {
    const r = rel.reperes[id];
    return `<tr><td style="padding:10px 0;border-top:1px solid #e5e5e5;font:15px/1.3 -apple-system,Segoe UI,sans-serif;color:#1b1b1b">${esc(nom)}<br><span style="font-size:12px;color:#777">${esc(r.sous)}</span></td>`
      + `<td align="right" style="padding:10px 0;border-top:1px solid #e5e5e5;font:600 15px ui-monospace,Menlo,monospace;color:#1b1b1b;white-space:nowrap">${esc(r.v)}</td>`
      + `<td align="right" style="padding:10px 0 10px 12px;border-top:1px solid #e5e5e5;font:13px ui-monospace,Menlo,monospace;color:${couleur(r.d)};white-space:nowrap">${esc(r.d)}</td></tr>`;
  }).join('');
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f5f5f5;padding:24px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:20px 20px 8px">
<tr><td colspan="3" style="font:400 26px Georgia,serif;color:#1b1b1b;padding-bottom:4px">6h40</td></tr>
<tr><td colspan="3" style="font:13px -apple-system,Segoe UI,sans-serif;color:#777;padding-bottom:12px">${esc(rel.date)}</td></tr>
${lignes}
<tr><td colspan="3" style="padding:18px 0 6px"><a href="${esc(site)}" style="display:inline-block;background:#bd4600;color:#ffffff;text-decoration:none;font:600 15px -apple-system,Segoe UI,sans-serif;padding:12px 18px;border-radius:10px">Ouvrir le relevé</a></td></tr>
<tr><td colspan="3" style="font:12px -apple-system,Segoe UI,sans-serif;color:#777;padding:12px 0">Information, pas un conseil financier.${portail ? ` <a href="${esc(portail)}" style="color:#777">Gérer ou résilier mon abonnement</a>` : ''}</td></tr>
</table></body></html>`;
}

// Envoie le relevé à chaque abonné, par lots de 100 (limite Resend)
export async function envoyerMails(rel, abonnes) {
  const cle = (process.env.RESEND_API_KEY || '').trim();
  const de = (process.env.MAIL_EXPEDITEUR || '').trim();
  const site = (process.env.SITE_URL || '').trim() || 'https://6h40.vercel.app';
  if (!cle || !de) return { envoyes: 0, erreur: 'RESEND_API_KEY ou MAIL_EXPEDITEUR manquant' };
  let envoyes = 0; const erreurs = [];
  for (let i = 0; i < abonnes.length; i += 100) {
    const lot = abonnes.slice(i, i + 100).map(a => ({
      from: de, to: [a.email], subject: '6h40 · ' + rel.date.replace('Relevé du ', ''),
      html: htmlMail(rel, site, a.portail)
    }));
    const r = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST', headers: { Authorization: 'Bearer ' + cle, 'content-type': 'application/json' }, body: JSON.stringify(lot)
    });
    if (r.ok) envoyes += lot.length; else erreurs.push('Resend ' + r.status + ' : ' + (await r.text()).slice(0, 200));
  }
  return { envoyes, erreurs };
}
