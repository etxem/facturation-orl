# Facturation ORL — CNS nomenclature optimizer

A small installable web app (PWA) for an ENT (ORL) doctor in Luxembourg. She taps the acts performed during a
consultation; the app returns the **highest-paying valid combination** of CNS codes, with the exact codes and suffixes to
bill (e.g. `C17 · GFQ12 · GFQ18R · GDE11R · GFM11 · GFM41`), the amount of each line and why the other acts are not billed.

- French UI, mobile-first, works offline once opened, installable on the home screen.
- **Favoris**: any act can be pinned with ☆ (from any category or from the dictionary); the tab also lists the
  most used acts, refreshed at each new patient.
- **Dictionnaire**: every code of the nomenclature (3 138), with its official label, tariff calculation, location and
  PDF page, the remarks that concern it, the app's combination rules, and the general provisions (Art. 1er–21) —
  tap any code or article reference anywhere in the app to open it. The header links to the official PDF.
- No backend, no analytics, **no patient data**: only settings (declared devices, favourites, interpretation switches) are
  stored in the browser (`localStorage`).
- Data: *nomenclature des actes et services des médecins*, CNS coordinated version **01.09.2026**, key letter **5,2346**
  (cote 992,24, valid since 01.06.2026).

> The app is a decision aid. Only acts actually performed and medically justified may be selected; the doctor remains
> responsible for billing. Only the Journal officiel is authoritative.

## How a bill is optimized

The engine (`src/engine/optimizer.ts`) compares the two ways of billing a session (Art. 10 of the règlement grand-ducal
du 21 décembre 1998):

1. **Consultation route**: `C17` + technical acts marked **CAC** only.
2. **Technical route**: all selected technical acts, without the consultation.

Within a route it enumerates the valid subsets of the selected acts and, for each one:

- rejects combinations forbidden by the chapter remarks (`src/data/rules.ts`: mutually exclusive groups, "non cumulable
  avec les autres codes de la présente sous-section", whitelists such as GDE12, dependencies);
- ranks acts by coefficient: 100 % / 50 % (`R`) / 50 % (`R`) / nothing (Art. 9), CAT acts at full rate;
- applies `B` (bilateral, ×1.5) and `L` (local anesthesia, ×1.15) where selected and allowed;
- adds device fees (Art. 15quater; according to the devices declared in *Réglages*) and material fees (Art. 15);
- adds `R1` when requested (Art. 10 pt 2, Art. 18).

Amounts are computed in integer cents with the rounding of Art. 4 (tenth of a euro, 5 cents round up; suffixes applied to
the rounded tariff and rounded again). The optimizer never adds or substitutes an act.

### Grey zones

Some rules are open to interpretation. By default the app applies the text literally and flags any result that relies on
an interpretation with **« à valider »**. Each one is a switch in *Réglages* (`src/engine/settings.ts`):

| Switch | Default |
|---|---|
| Consultation + several CAC acts (Art. 9 between them) | on |
| Device/material fee only when the linked act is paid | on |
| One device fee per device and session | on |
| GDE12/GDE13 whitelists apply to the whole session | on |
| Suffix B for small one-sided acts (cerumen, paracentesis, grommets, turbinates…) | on |
| R1 together with the consultation and technical acts | on |
| GDE11 together with acts done under the microscope | on |
| Several ORL echographies in one session | on |

They should be confirmed with the CNS (provider helpdesk) or the AMMD.

## Project layout

```
scripts/extract-nomenclature.ts  PDF → sources/raw-{meta,codes,remarks,articles}.json (pdfjs, rebuilds table rows)
scripts/build-data.ts            raw JSON + curated catalogue → src/data/nomenclature.json (optimizer)
                                 and src/data/dictionary.json (whole publication, loaded on demand)
src/data/catalog.ts              curated practice ("cabinet") codes: short labels, categories, overrides
src/data/rules.ts                combination rules, each with its source (article / remark)
src/data/devices.ts              device fee classes and linked acts
src/engine/                      pure TypeScript engine (tariff, rules, optimizer, settings)
src/dictionary/                  dictionary logic: lookup, remarks of a code, search, code/article links
src/ui/                          React UI (Séance, Dictionnaire, Règles, Réglages)
tests/                           Vitest: tariffs vs official PDF, rule coverage, scenarios, randomized brute-force oracle
```

## Commands

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 461 tests
npm run lint
npm run build        # production build + service worker in dist/
npm run preview      # serve dist/
```

## Updating when the CNS publishes a new version

1. Download the new *nomenclature et tarifs des médecins* PDF from
   [cns.public.lu](https://cns.public.lu/fr/assure/publications/legislations/ammd/cns-ammd-med-tableau.html) into `sources/`
   (PDFs are git-ignored).
2. `npm run extract -- sources/<file>.pdf <URL of that PDF>` — prints the version, key letter, number of codes per
   chapter and the articles found. The URL is stored so that the app links to the official PDF.
3. Review the changes: `git diff sources/` (coefficients, labels, remarks).
4. If codes or remarks changed, adjust `src/data/catalog.ts` and `src/data/rules.ts`. The test *"maps every remark of the
   ORL chapter to a rule"* fails when a new ORL remark appears.
5. `npm run build-data` then `npm test`. The data tests recompute **every** tariff of the publication from its coefficient
   and compare it with the official amount.
6. Commit and push: the GitHub Actions workflow tests, builds and deploys to GitHub Pages.

A pure index change (new key letter) only needs steps 1, 2, 5 and 6.

### Adding a code or a rule

- Practice code from another chapter: add an entry to `CATALOG` in `src/data/catalog.ts` (with `materialFee` if it has an
  `…M` fee), run `npm run build-data`.
- Rule: add it to `RULES` in `src/data/rules.ts` with its `source`, then a scenario test in `tests/optimizer.test.ts`.

## Deployment

GitHub Pages via `.github/workflows/deploy.yml` (repository *Settings → Pages → Source: GitHub Actions*). The workflow
sets `BASE_PATH=/<repository>/` so that assets, the manifest and the service worker work under the sub-path.

## Out of scope for version 1

Urgent/evening/Sunday/night consultations (C51–C54) and the N/D/F surcharge, hospital on-call (V21–V26, C600–C607),
operating-room billing (assistance P, reconstruction codes), and an annual counter per device for the reduced rate. The
data model already contains the whole ORL chapter.
