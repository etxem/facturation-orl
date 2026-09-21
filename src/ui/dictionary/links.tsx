import { useEffect, type ReactNode } from 'react';
import { linkify } from '../../dictionary/dictionary';
import { ENGINE_DATA } from '../../engine/data';
import { useDictionary } from './context';

/** Article ids of the regulation, known before the dictionary is loaded. */
const ARTICLE_IDS = new Map(
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '15bis', '15ter', '15quater', '15quinquies', '16', '17', '18', '19', '20', '21'].map((id) => [id, true]),
);

export function CodeLink({ code, children, className }: { code: string; children?: ReactNode; className?: string }) {
  const { open } = useDictionary();
  return (
    <button type="button" className={`code-link ${className ?? ''}`} onClick={() => open({ kind: 'code', code })} title={`Voir ${code} dans le dictionnaire`}>
      {children ?? code}
    </button>
  );
}

export function ArticleLink({ id, children }: { id: string; children?: ReactNode }) {
  const { open } = useDictionary();
  return (
    <button type="button" className="code-link article" onClick={() => open({ kind: 'article', id })} title={`Voir l’article ${id}`}>
      {children ?? `Art. ${id}`}
    </button>
  );
}

/** Text in which codes and references to articles of the regulation become links. */
export function RichText({ text }: { text: string }) {
  const { dict, ensureLoaded } = useDictionary();
  useEffect(ensureLoaded, [ensureLoaded]);
  const lookup = dict ?? { byCode: ENGINE_DATA.codes, articleById: ARTICLE_IDS };
  return (
    <>
      {linkify(text, lookup).map((p, i) =>
        p.kind === 'text' ? (
          <span key={i}>{p.text}</span>
        ) : p.kind === 'code' ? (
          <CodeLink key={i} code={p.code} />
        ) : (
          <ArticleLink key={i} id={p.id}>
            {p.text}
          </ArticleLink>
        ),
      )}
    </>
  );
}
