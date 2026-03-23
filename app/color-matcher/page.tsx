const results = [
  { part: "Forehead", score: "Warm 78%", color: "#b00d6a" },
  { part: "Cheek", score: "Neutral 62%", color: "#702ae1" },
  { part: "Jaw", score: "Cool 59%", color: "#9e3657" }
];

export default function ColorMatcherPage() {
  return (
    <section>
      <h1 className="page-title">Color Matcher</h1>
      <p className="page-desc">피부/헤어 분석 리포트와 추천 컬러 매칭</p>

      <div className="section-grid two">
        <article className="panel">
          <h3>Diagnostic Nodes</h3>
          <ul className="result-list">
            {results.map((item) => (
              <li key={item.part}>
                <span className="dot" style={{ background: item.color }} />
                <strong>{item.part}</strong>
                <span>{item.score}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h3>추천 조합</h3>
          <div className="recommend-grid">
            <div className="tone-card">
              <p>Primary Match</p>
              <h4>Radiant Violet</h4>
            </div>
            <div className="tone-card">
              <p>Secondary Match</p>
              <h4>Soft Berry</h4>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
