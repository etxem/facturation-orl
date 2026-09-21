import { ENGINE_DATA } from '../engine/data';
import { inScope } from '../engine/scope';
import { INTERPRETATIONS } from '../engine/settings';
import { formatEuros, tariffCents } from '../engine/tariff';
import type { Rule } from '../engine/types';
import { ArticleLink, RichText } from './dictionary/links';

const { meta, list, rules, devices } = ENGINE_DATA;
const key = meta.keyLetter;
const price = (code: string) => {
  const c = ENGINE_DATA.codes.get(code);
  return c?.coef != null ? formatEuros(tariffCents(c.coef, key)) : '';
};

function scopeName(scope: string): string {
  const c = list.find((x) => inScope(x.scope, scope));
  if (!c) return scope;
  const parts = c.location.split(' › ');
  const depth = scope.split('/').length; // ORL/S2 → section, ORL/S2/SS1 → sous-section
  return parts.slice(1, depth).join(' › ').replace(/Sous-section \d+ - |Section \d+ - /g, '');
}

function codesIn(scope: string): string[] {
  return list.filter((c) => c.kind === 'act' && inScope(c.scope, scope)).map((c) => c.code);
}

function ruleText(r: Rule): string | null {
  switch (r.type) {
    case 'mutuallyExclusive':
      return `${r.codes.join(', ')} : non cumulables entre eux.`;
    case 'crossExclusive':
      return `${r.a.join(', ')} non cumulable(s) avec ${r.b.join(', ')}.`;
    case 'scopeMutuallyExclusive':
      return `« ${scopeName(r.scope)} » (${codesIn(r.scope).join(', ')}) : non cumulables entre eux.`;
    case 'exclusiveInScope':
      return `${r.codes.join(', ')} : non cumulable(s) avec les autres codes de « ${scopeName(r.scope)} ».`;
    case 'onlyCombinableWith':
      return `${r.code} n’est cumulable qu’avec ${r.allowed.join(', ')}.`;
    case 'requiresAnyOf':
      return `${r.code} ne peut être mis en compte qu’avec ${r.anyOf.join(', ')}.`;
    default:
      return null;
  }
}

const exclusions = rules.filter((r) => ruleText(r) && !('permissiveSwitch' in r && r.permissiveSwitch));
const reminders = rules.filter((r): r is Extract<Rule, { type: 'reminder' }> => r.type === 'reminder');

export function RulesScreen() {
  return (
    <div className="rules card">
      <h2>Comment la facture est construite</h2>
      <p className="hint">
        Résumé du règlement grand-ducal modifié du 21 décembre 1998 (nomenclature des actes et services des médecins), version
        coordonnée CNS au{' '}
        <a href={meta.pdfUrl} target="_blank" rel="noreferrer">
          {meta.version}
        </a>
        . Seul le Journal officiel fait foi. Touchez un code ou un article pour l’ouvrir dans le dictionnaire.
      </p>

      <h3>1. Le tarif d’un acte (<ArticleLink id="4" />)</h3>
      <p>
        Tarif = coefficient × lettre-clé ({key.toLocaleString('fr-FR', { minimumFractionDigits: 4 })} depuis le {meta.validFrom}),
        arrondi au dixième d’euro (vers le haut dès 5 cents). Les suffixes multiplient ce tarif arrondi, puis le montant final est
        arrondi de la même façon. Exemple : C17 = 9,24 × {key.toLocaleString('fr-FR', { minimumFractionDigits: 4 })} = {price('C17')}.
      </p>

      <h3>2. Consultation ou actes techniques ? (<ArticleLink id="5" /> et <ArticleLink id="10" />)</h3>
      <ul>
        <li>Une seule consultation par patient et par jour ; l’ORL facture la consultation de sa spécialité : C17 ({price('C17')}). Il n’existe pas de consultation majorée ORL.</li>
        <li>
          La consultation ne se cumule qu’avec les actes techniques portant la mention <span className="badge cac">CAC</span>{' '}
          (« cumul avec consultation »).
        </li>
        <li>
          Dans tous les autres cas, le médecin a droit au montant le plus élevé : soit la consultation (avec ses actes CAC), soit les
          actes techniques seuls. L’application calcule les deux et propose le meilleur.
        </li>
        <li>Sans examen du patient (actes en série), pas de consultation : seuls les actes techniques sont dus.</li>
      </ul>

      <h3>3. Plusieurs actes techniques dans la même séance (<ArticleLink id="9" />)</h3>
      <ul>
        <li>L’acte au coefficient le plus élevé est payé à 100 %, le 2e et le 3e à 50 % (suffixe R), les suivants ne sont pas rémunérés.</li>
        <li>Les actes marqués CAT sont payés à plein tarif.</li>
        <li>Aucune prestation ne se cumule avec une prestation dont elle fait partie intégrante.</li>
        <li>Même opération des deux côtés en une séance : tarif unilatéral + 50 % (suffixe B).</li>
      </ul>
      <table className="simple">
        <thead>
          <tr>
            <th>Suffixe</th>
            <th>Signification</th>
            <th>Coefficient</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>R</td><td>2e / 3e acte technique (Art. 9)</td><td>× 0,50</td></tr>
          <tr><td>B</td><td>Opération bilatérale en une séance (Art. 9)</td><td>× 1,50</td></tr>
          <tr><td>L</td><td>Anesthésie locale par infiltration (Art. 13)</td><td>× 1,15</td></tr>
          <tr><td>N / D / F</td><td>Acte urgent de nuit, dimanche, jour férié (Art. 8) — version 2</td><td>× 2,00</td></tr>
          <tr><td>P</td><td>Assistance opératoire (Art. 11) — version 2</td><td>30 % du coefficient</td></tr>
        </tbody>
      </table>

      <h3>4. Anesthésie locale (<ArticleLink id="13" />)</h3>
      <p>
        +15 % sur l’acte concerné, sauf si le libellé précise « anesthésie locale comprise » (ex. GPD11, GPD16, GZD11) ou en cas
        d’anesthésie générale. L’anesthésie de contact (spray, gel) est toujours comprise et ne se facture pas.
      </p>

      <h3>5. Forfaits appareil et frais de matériel (<ArticleLink id="15" />, <ArticleLink id="15quater" />)</h3>
      <p>
        Uniquement au cabinet, pour un appareil déclaré à la CNS, et seulement si l’acte lié est facturé dans la même séance. Ces
        montants ne sont ni réduits ni majorés et ne comptent pas dans les trois actes de l’Art. 9.
      </p>
      <table className="simple">
        <thead>
          <tr>
            <th>Appareil</th>
            <th>Actes</th>
            <th>Plein / réduit</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d.type}>
              <td>{d.label}</td>
              <td>{d.acts.join(', ')}</td>
              <td>
                {Object.entries(d.classes).map(([cls, c]) => (
                  <div key={cls}>
                    Classe {cls} : {c!.full} {formatEuros(Math.round((ENGINE_DATA.codes.get(c!.full)?.amount ?? 0) * 100))} / {c!.reduced}{' '}
                    {formatEuros(Math.round((ENGINE_DATA.codes.get(c!.reduced)?.amount ?? 0) * 100))}
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>6. Rapport R1 (<ArticleLink id="10" /> point 2, <ArticleLink id="18" />)</h3>
      <p>
        R1 ({price('R1')}) se cumule avec un autre acte, à condition que l’ordonnance du médecin traitant (identifié par son code)
        demande expressément un avis et que vous ne poursuiviez pas vous-même le traitement.
      </p>

      <h3>7. Règles de non-cumul appliquées</h3>
      <ul className="rule-list">
        {exclusions.map((r) => (
          <li key={r.id}>
            <RichText text={ruleText(r)!} /> <small>({r.source})</small>
          </li>
        ))}
      </ul>

      <h3>8. Rappels (limites et conditions)</h3>
      <ul className="rule-list">
        {reminders.map((r) => (
          <li key={r.id}>
            <RichText text={`${r.codes.join(', ')} : ${r.message}`} /> <small>({r.source})</small>
          </li>
        ))}
      </ul>

      <h3>9. Zones grises</h3>
      <ul className="rule-list">
        {INTERPRETATIONS.map((i) => (
          <li key={i.id}>
            <strong>{i.label}.</strong> <RichText text={i.help} /> <small>(<RichText text={i.source} />)</small>
          </li>
        ))}
      </ul>

      <p>
        <a href={meta.pdfUrl} target="_blank" rel="noreferrer">
          Nomenclature officielle (PDF, version coordonnée au {meta.version})
        </a>{' '}
        ·{' '}
        <a href={meta.sourceUrl} target="_blank" rel="noreferrer">
          toutes les versions sur cns.public.lu
        </a>
      </p>
    </div>
  );
}
