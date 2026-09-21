import { articlesForCode, pdfPageUrl, relevantRemarks, sectionPath, siblings, type Dictionary } from '../../dictionary/dictionary';
import { ENGINE_DATA } from '../../engine/data';
import { describeConflict, remindersFor } from '../../engine/rules';
import { conflictSummary } from '../../engine/summary';
import { formatEuros, tariffCents } from '../../engine/tariff';
import type { Rule, Settings } from '../../engine/types';
import { useDictionary } from './context';
import { ArticleLink, CodeLink, RichText } from './links';

const CATEGORY_LABEL: Record<string, string> = {
  oreille: 'Oreille',
  nez: 'Nez & sinus',
  pharynx: 'Pharynx & larynx',
  glandes: 'Cou & glandes',
  echo: 'Échographie',
  allergo: 'Allergologie',
  peau: 'Peau, plaies & bouche',
};

const eur = (euros: number) => formatEuros(Math.round(euros * 100));

/** Codes as links separated by commas. */
function CodeList({ codes, max = 60 }: { codes: string[]; max?: number }) {
  return (
    <>
      {codes.slice(0, max).map((c, i) => (
        <span key={c}>
          {i > 0 && ', '}
          <CodeLink code={c} />
        </span>
      ))}
      {codes.length > max && ` … (+${codes.length - max})`}
    </>
  );
}

export function CodeEntry({ code, dict, settings }: { code: string; dict: Dictionary; settings: Settings }) {
  const { favorites, toggleFavorite, selectedCodes, toggleAct } = useDictionary();
  const entry = dict.byCode.get(code);
  if (!entry) return <p className="hint">Le code {code} n’existe pas dans la nomenclature {dict.version}.</p>;

  const key = ENGINE_DATA.meta.keyLetter;
  const def = ENGINE_DATA.codes.get(code);
  const isAct = def?.kind === 'act';
  const label = entry.label;
  const mentions = {
    cac: /-\s*CAC\b/.test(label),
    cat: /-\s*CAT\b/.test(label),
    apcm: /\bAPCM\b/.test(label),
    acm: /\bACM\b/.test(label),
    localIncluded: /y compris l'anesthésie locale|anesthésie locale comprise/i.test(label),
    unilateral: /unilatéral|par côté/i.test(label),
  };
  const technical = entry.section.part?.startsWith('DEUXIEME');
  const remarks = relevantRemarks(dict, code);
  const groups = isAct ? conflictSummary(def, ENGINE_DATA.list, ENGINE_DATA.rules, settings.switches) : [];
  const reminders = remindersFor([code], ENGINE_DATA.rules);
  const requires = ENGINE_DATA.rules.filter((r): r is Extract<Rule, { type: 'requiresAnyOf' }> => r.type === 'requiresAnyOf' && r.code === code);
  const device = def?.device ? ENGINE_DATA.devices.find((d) => d.type === def.device) : undefined;
  const feeOf = ENGINE_DATA.devices.find((d) => Object.values(d.classes).some((c) => c?.full === code || c?.reduced === code));
  const materialOf = ENGINE_DATA.list.filter((c) => c.materialFee === code);
  const articles = articlesForCode(entry, { localAnesthesia: def?.localAnesthesia === 'allowed' });
  const others = siblings(dict, code);
  const isFavorite = favorites.includes(code);
  const inSession = selectedCodes.has(code);

  return (
    <article className="dict-entry">
      <p className="dict-kicker">{sectionPath(entry.section).slice(1, 3).join(' › ')}</p>
      <div className="dict-head">
        <h2 className="code">{code}</h2>
        <strong className="dict-price">
          {entry.coef != null ? formatEuros(tariffCents(entry.coef, key)) : eur(entry.tarif)}
        </strong>
      </div>
      <p className="dict-label">{label}</p>
      {def && def.short !== label && def.cabinet && <p className="hint">Dans l’application : « {def.short} »</p>}

      {isAct && (
        <div className="dict-actions">
          <button className={isFavorite ? 'toggle on' : 'toggle'} aria-pressed={isFavorite} onClick={() => toggleFavorite(code)}>
            {isFavorite ? '★ Favori' : '☆ Ajouter aux favoris'}
          </button>
          <button className={inSession ? 'toggle on' : 'toggle'} aria-pressed={inSession} onClick={() => toggleAct(code)}>
            {inSession ? 'Dans la séance' : '+ Ajouter à la séance'}
          </button>
        </div>
      )}

      <dl className="dict-facts">
        <dt>Tarif</dt>
        <dd>
          {entry.coef != null ? (
            <>
              coefficient {entry.coef.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} × lettre-clé{' '}
              {key.toLocaleString('fr-FR', { minimumFractionDigits: 4 })} = {formatEuros(tariffCents(entry.coef, key))}
            </>
          ) : (
            <>montant forfaitaire (non indexé, ni réduit ni majoré)</>
          )}
        </dd>
        <dt>Emplacement</dt>
        <dd>
          {sectionPath(entry.section).join(' › ')}
          {entry.position ? `, position ${entry.position}` : ''} —{' '}
          <a href={pdfPageUrl(dict, entry.page)} target="_blank" rel="noreferrer">
            PDF officiel, page {entry.page}
          </a>
        </dd>
        {technical && (
          <>
            <dt>Mentions</dt>
            <dd className="badges">
              {mentions.cac ? <span className="badge cac">CAC — cumulable avec la consultation</span> : <span className="badge nocac">sans mention CAC</span>}
              {mentions.cat && <span className="badge device">CAT — cumul à plein tarif</span>}
              {mentions.apcm && <span className="badge warn">APCM — autorisation préalable du contrôle médical</span>}
              {mentions.acm && <span className="badge warn">ACM — autorisation du contrôle médical</span>}
              {mentions.localIncluded && <span className="badge">anesthésie locale comprise</span>}
              {mentions.unilateral && <span className="badge">unilatéral / par côté</span>}
            </dd>
          </>
        )}
        {device && (
          <>
            <dt>Forfait appareil</dt>
            <dd>
              {device.label} :{' '}
              {Object.entries(device.classes).map(([cls, c], i) => (
                <span key={cls}>
                  {i > 0 && ' · '}classe {cls} <CodeLink code={c!.full} /> {eur(ENGINE_DATA.codes.get(c!.full)?.amount ?? 0)} / <CodeLink code={c!.reduced} />{' '}
                  {eur(ENGINE_DATA.codes.get(c!.reduced)?.amount ?? 0)}
                </span>
              ))}
            </dd>
          </>
        )}
        {def?.materialFee && (
          <>
            <dt>Frais de matériel</dt>
            <dd>
              <CodeLink code={def.materialFee} /> ajouté au cabinet ({formatEuros(tariffCents(ENGINE_DATA.codes.get(def.materialFee)!.coef!, key))})
            </dd>
          </>
        )}
        {def?.noSutureFee && (
          <>
            <dt>Frais de matériel</dt>
            <dd>sans suture : 8 % du coefficient (Art. 15), au cabinet</dd>
          </>
        )}
        {feeOf && (
          <>
            <dt>Actes liés</dt>
            <dd>
              <CodeList codes={feeOf.acts} />{' '}
              — seuil d’activité de référence : {feeOf.threshold} actes par an
            </dd>
          </>
        )}
        {materialOf.length > 0 && (
          <>
            <dt>Acte lié</dt>
            <dd>
              <CodeList codes={materialOf.map((c) => c.code)} />
            </dd>
          </>
        )}
      </dl>

      {remarks.length > 0 && (
        <section>
          <h3>Remarques de la nomenclature</h3>
          <ul className="dict-remarks">
            {remarks.map(({ remark, mentions: named }, i) => (
              <li key={i} className={named ? 'named' : undefined}>
                <small>
                  {(remark.section.subsection ?? remark.section.section ?? remark.section.chapter ?? '').replace(/^(Sous-section|Section|Chapitre) (\d+) - /, '$1 $2 · ')}
                  {remark.n ? ` — remarque ${remark.n}` : ' — remarque'} ·{' '}
                  <a href={pdfPageUrl(dict, remark.p)} target="_blank" rel="noreferrer">
                    p. {remark.p}
                  </a>
                </small>
                <RichText text={remark.t} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {def && (
        <section>
          <h3>Dans l’application</h3>
          <ul className="dict-app">
            {isAct && (
              <li>
                {def.cac
                  ? 'Cumulable avec la consultation C17 (mention CAC).'
                  : 'Non cumulable avec la consultation : l’application compare « consultation + actes CAC » et « actes techniques seuls » (Art. 10).'}
              </li>
            )}
            {isAct && (
              <li>
                {def.cabinet
                  ? `Catalogue du cabinet : onglet « ${CATEGORY_LABEL[def.category] ?? def.category} ».`
                  : 'Acte du bloc opératoire (hors catalogue de la version 1) : ajoutez-le aux favoris pour l’utiliser dans une séance.'}
              </li>
            )}
            {def.kind === 'deviceFee' && <li>Ajouté automatiquement si l’appareil est déclaré dans Réglages et qu’un acte lié est facturé dans la séance.</li>}
            {def.kind === 'materialFee' && <li>Ajouté automatiquement au cabinet avec l’acte lié.</li>}
            {def.kind === 'consultation' && <li>Évaluée automatiquement à chaque séance ; cumulable uniquement avec les actes CAC.</li>}
            {def.kind === 'report' && <li>À cocher dans la séance quand les conditions de l’Art. 18 sont remplies.</li>}
            {groups.map((g) => (
              <li key={`${g.level}-${g.rule.id}`} className={g.level === 'soft' ? 'soft' : undefined}>
                {g.level === 'soft' && <span className="badge warn">à valider</span>}{' '}
                {g.rule.type === 'onlyCombinableWith' && g.rule.code === code ? (
                  <>
                    Cumulable uniquement avec <CodeList codes={g.rule.allowed} />
                  </>
                ) : (
                  <>
                    {g.level === 'soft' ? 'Cumul discutable avec' : 'Non cumulable avec'} <CodeList codes={g.codes} max={40} />
                  </>
                )}
                <small>{describeConflict(g.rule)}</small>
              </li>
            ))}
            {requires.map((r) => (
              <li key={r.id}>
                Ne peut être mis en compte qu’avec <CodeList codes={r.anyOf} />
                <small>{r.source}</small>
              </li>
            ))}
            {reminders.map((r) => (
              <li key={r.id} className="reminder">
                🔔 <RichText text={r.message} /> <small>{r.source}</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3>Dispositions générales</h3>
        <div className="dict-chips">
          {articles.map((id) => (
            <ArticleLink key={id} id={id}>
              Art. {id}
              {dict.articleById.get(id)?.title ? ` · ${dict.articleById.get(id)!.title}` : ''}
            </ArticleLink>
          ))}
        </div>
      </section>

      {others.length > 0 && (
        <section>
          <h3>Même {entry.section.subsection ? 'sous-section' : 'section'}</h3>
          <ul className="dict-list">
            {others.slice(0, 60).map((o) => (
              <li key={o.code}>
                <CodeLink code={o.code} className="row">
                  <span className="code">{o.code}</span>
                  <span className="dict-row-label">{o.label}</span>
                  <span className="price">{o.coef != null ? formatEuros(tariffCents(o.coef, key)) : eur(o.tarif)}</span>
                </CodeLink>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
