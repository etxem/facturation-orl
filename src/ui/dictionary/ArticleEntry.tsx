import { pdfPageUrl, type Dictionary } from '../../dictionary/dictionary';
import { ArticleLink, RichText } from './links';

export function ArticleEntry({ id, dict }: { id: string; dict: Dictionary }) {
  const index = dict.articles.findIndex((a) => a.id === id);
  const article = dict.articles[index];
  if (!article) return <p className="hint">Article {id} introuvable.</p>;
  const prev = dict.articles[index - 1];
  const next = dict.articles[index + 1];
  return (
    <article className="dict-entry">
      <p className="dict-kicker">Règlement grand-ducal modifié du 21 décembre 1998 — dispositions générales</p>
      <h2>
        Art. {article.id === '1' ? '1er' : article.id}
        {article.title ? ` — ${article.title}` : ''}
      </h2>
      {article.paragraphs.map((p, i) => (
        <p key={i} className={/^(•|\d+\)|-\s)/.test(p) ? 'dict-par list-item' : 'dict-par'}>
          <RichText text={p} />
        </p>
      ))}
      <p>
        <a href={pdfPageUrl(dict, article.page)} target="_blank" rel="noreferrer">
          Voir dans le PDF officiel (page {article.page})
        </a>
      </p>
      <div className="dict-nav">
        {prev ? <ArticleLink id={prev.id}>← Art. {prev.id}</ArticleLink> : <span />}
        {next ? <ArticleLink id={next.id}>Art. {next.id} →</ArticleLink> : <span />}
      </div>
    </article>
  );
}
