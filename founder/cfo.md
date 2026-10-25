# Note du CFO (en clair)

- **Marge** : chaque pass à 12 € laisse 10,94 € après les frais Lemon Squeezy (91 %). Les coûts fixes sont minuscules (≈21 €/mois, estimation : Vercel Pro car l'offre gratuite Hobby interdit l'usage commercial, plus le domaine).
- **Seuil de rentabilité réel** : 21 € ÷ 10,94 € ≈ **2 pass par mois** (l'outil arrondit à « 1 par jour »).
- **La ligne à surveiller** : les ventes, pas les coûts. Le rythme de ventes ci-dessous (de 1 à 30 pass par mois) est **une hypothèse**, alors que le panel a donné 0 acheteur sur 30. Avec 0 vente, l'année 1 perd ≈ 300 € (21 € × 12 + 50 € de test).
- **Cash nécessaire** : moins de 100 €.
- **Trois leviers** : passer à 15 € (année 1 : 2 132 $ au lieu de 1 619 $, même hypothèse de ventes) ; rester sur une offre gratuite d'hébergement tant qu'il n'y a pas de vente (à vérifier dans les conditions) ; vendre aux courtiers (15 €/mois récurrents).
- **Conditions du conseil** : non remplies. La cible est choisie, mais la valeur du payant n'est pas démontrée.

Les montants affichés en « $ » par l'outil sont des euros.

---

# Unit economics: 6h40 Projet immo (pass 6 mois)

Every number below comes from the input file. Nothing is looked up or guessed.

## One pass 6 mois

| line | per pass 6 mois |
| --- | ---: |
| Price | $12.00 |
| Lemon Squeezy 5 % | -$0.60 |
| Lemon Squeezy 0,50 $ fixe (≈0,46 €) | -$0.46 |
| Notifications + mails (offerts dans les paliers gratuits) | -$0.00 |
| **Contribution** (what each pass 6 mois leaves to pay the fixed costs) | **$10.94** (91%) |

## The margin that matters

Fixed costs: $21 a month (Hébergement Vercel Pro, usage commercial (estimation ≈20 €) $20, Nom de domaine (estimation ≈12 €/an) $1, Supabase + Resend (paliers gratuits) $0).

- **Break-even: 1 pass 6 moiss a day.** Below that you lose money every month.
- **Profit margin at your plan** (1 a day): **85%** of every sale, after every cost.

## Year 1, month by month

| month | pass 6 moiss a day | revenue | profit | cumulative (after $50 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | $18 | -$5 | -$55 |
| 2 | 0 | $36 | $12 | -$43 |
| 3 | 0 | $54 | $28 | -$15 |
| 4 | 0 | $72 | $45 | $30 |
| 5 | 0 | $108 | $77 | $108 |
| 6 | 0 | $144 | $110 | $218 |
| 7 | 0 | $180 | $143 | $361 |
| 8 | 1 | $216 | $176 | $537 |
| 9 | 1 | $252 | $209 | $746 |
| 10 | 1 | $288 | $242 | $987 |
| 11 | 1 | $324 | $274 | $1,262 |
| 12 | 1 | $360 | $307 | $1,569 |

- **Year 1 operating profit: $1,619** on $2,052 of revenue.
- After the $50 startup spend: $1,569.
- Startup money earned back: month 4.
- Cash you need before it pays for itself: **$55**.

## What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 85% | 1 | $1,619 |
| Price -10% | 84% | 1 | $1,414 |
| Volume -20% | 84% | 1 | $1,245 |
| Unit costs +15% | 84% | 1 | $1,592 |

No red flags in these numbers. They are only as good as the inputs: check every cost against a real quote.
