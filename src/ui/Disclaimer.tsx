export function Disclaimer({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
      <div className="modal">
        <h2 id="disclaimer-title">Avant de commencer</h2>
        <ul>
          <li>
            Sélectionnez <strong>uniquement les actes réellement effectués</strong> et médicalement justifiés. L’outil choisit
            la combinaison la plus favorable <em>parmi ces actes</em> ; il n’en ajoute ni n’en remplace aucun.
          </li>
          <li>
            Les règles appliquées sont celles de la nomenclature CNS (version indiquée en haut). Certaines interprétations sont
            incertaines : elles sont signalées <span className="badge warn">à valider</span> et réglables dans Réglages.
          </li>
          <li>La responsabilité de la facturation reste celle du médecin. En cas de doute : CNS ou AMMD.</li>
          <li>Aucune donnée patient n’est demandée ni enregistrée : seuls vos réglages restent dans ce navigateur.</li>
        </ul>
        <button className="primary" onClick={onAccept} autoFocus>
          J’ai compris
        </button>
      </div>
    </div>
  );
}
