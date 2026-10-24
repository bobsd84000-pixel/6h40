# 6h40

Dix repères économiques chaque matin, traduits en euros. Sans compte.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | L'app (relevé, cadran, « Pour toi », alertes, offre Pro) |
| `landing.html` | La landing, copie de l'original (ne pas modifier) |
| `api/releve.js` | Donne le relevé du jour à la page |
| `api/cron.js` | Chaque matin : enregistre le relevé et envoie le mail Pro |
| `api/lemon.js` | Reçoit les abonnements Lemon Squeezy |
| `lib/` | Sources des chiffres, base Supabase, mail |
| `donnees/manuel.json` | Repères mis à jour à la main |
| `supabase/schema.sql` | Tables à créer une fois dans Supabase |

## D'où viennent les chiffres

- **Automatiques** : dollar et livre (BCE via Frankfurter), Brent et or (Yahoo Finance, or converti au cours BCE), gazole (data.economie.gouv.fr, moyenne des stations).
- **À la main** dans `donnees/manuel.json` : taux 10 ans, gaz (CRE), inflation (Insee), crédit immo (Pretto), Livret A.

Si une source automatique ne répond pas, la page garde les dernières valeurs connues.

## Réglages Vercel (Settings → Environment Variables)

| Variable | Sert à |
|---|---|
| `SUPABASE_URL` | Adresse du projet Supabase |
| `SUPABASE_SERVICE_KEY` | Clé `service_role` (secrète, serveur seulement) |
| `CRON_SECRET` | Mot de passe de la tâche du matin (texte au hasard) |
| `LEMON_LIEN_PRO` | Lien de paiement Lemon Squeezy de l'offre Pro |
| `LEMON_WEBHOOK_SECRET` | Secret du webhook Lemon Squeezy |
| `LEMON_STORE_ID` | Numéro de ta boutique Lemon (optionnel, sécurité) |
| `RESEND_API_KEY` | Clé Resend pour envoyer les mails |
| `MAIL_EXPEDITEUR` | Expéditeur, ex. `6h40 <matin@ton-domaine.fr>` |
| `SITE_URL` | Adresse publique du site (lien dans le mail) |

## Lemon Squeezy

- Produit « 6h40 Pro », abonnement 4 €/mois.
- **Confirmation redirect URL** : `https://<ton-site>/?pro=1`
- **Webhook** : `https://<ton-site>/api/lemon`, événements `subscription_*`.

## Tâche du matin

`vercel.json` lance `/api/cron` à 5 h 40 UTC, soit 6 h 40 à Paris en hiver (7 h 40 en été).
Sur l'offre Vercel gratuite, l'heure exacte peut glisser dans l'heure prévue.

## Déploiement

Branche `develop` → PR vers `main` → Vercel met en production. Jamais de push direct sur `main`.
