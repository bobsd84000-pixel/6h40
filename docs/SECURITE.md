# 6h40 — revue de sécurité (29 octobre 2026)

Faite avec les skills `performing-serverless-function-security-review`, `testing-api-security-with-owasp-top-10` et `performing-security-headers-audit` (pack mukul975/Anthropic-Cybersecurity-Skills), en lisant le code. Le site en ligne n'a pas pu être testé depuis l'environnement de travail.

## Déjà bon

| Point | Où |
|---|---|
| Webhook Lemon signé (HMAC SHA-256, comparaison à temps constant) | `api/lemon.js` |
| Clé Supabase `service_role` seulement côté serveur, jamais dans la page | `lib/base.js` |
| Tables protégées par RLS, aucune lecture possible depuis le navigateur | `supabase/schema.sql` |
| Aucun secret en clair dans le dépôt | tout le dépôt |
| Valeurs du mail échappées avant insertion dans le HTML | `lib/mail.js` |

## Corrigé dans cette branche

| Problème | Correctif | Fichier |
|---|---|---|
| Aucun en-tête de sécurité : la page pouvait être affichée dans une iframe d'un autre site, sans politique de contenu | En-têtes CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` | `vercel.json` |
| Mot de passe du cron comparé avec `!==` (fuite possible par le temps de réponse) | Comparaison à temps constant, comme le webhook | `api/cron.js` |
| `/api/releve` publiait le texte brut des erreurs (messages Supabase, noms d'hôtes) | Seule la liste des repères en erreur est publiée ; le détail reste dans la base et dans le bilan du cron | `api/releve.js` |

CSP testée en local sur `index.html` et `landing.html` : aucune ressource bloquée.

## À faire plus tard (non modifié)

1. **Ordre des événements Lemon** : si Lemon renvoie un vieil événement après un plus récent, l'ancien statut écrase le nouveau. Correctif : enregistrer `updated_at` de l'événement et ignorer ceux plus anciens que la ligne en base.
2. **CSP stricte** : `index.html` contient son JavaScript dans la page, d'où `'unsafe-inline'`. Le sortir dans un fichier `.js` permettrait de retirer cette exception.
3. **Appels répétés à `/api/releve`** : le cache de 15 minutes limite déjà les appels. Si le trafic monte, activer une règle de limite de débit dans le pare-feu Vercel.
4. **`LEMON_STORE_ID`** est optionnel : le renseigner sur Vercel ajoute un contrôle gratuit.
