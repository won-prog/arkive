import Link from "next/link";

export default function LandingPage() {
  return (
    <section>
      <div className="hero">
        <div>
          <p className="eyebrow">AI Beauty Tech</p>
          <h1 className="hero-title">
            실패 없는 변신,
            <br />
            실시간 웹 AR로 확인하세요.
          </h1>
          <p className="hero-copy">
            고도화된 AI가 얼굴과 헤어 톤을 분석해 가장 자연스러운 컬러를 추천합니다.
            Stitch 프로젝트 콘셉트를 Next.js 구조로 재구성한 페이지입니다.
          </p>
          <div className="hero-actions">
            <Link href="/simulator" className="btn-primary">시뮬레이터 시작</Link>
            <Link href="/color-matcher" className="btn-secondary">컬러 매처 보기</Link>
          </div>
        </div>
        <div className="hero-card">
          <h3>추천 흐름</h3>
          <ol>
            <li>1. 얼굴 인식 및 베이스 톤 분석</li>
            <li>2. 컬러 시뮬레이션 결과 비교</li>
            <li>3. 제품 추천 및 장바구니 연결</li>
          </ol>
        </div>
      </div>

      <div className="section-grid">
        <article className="panel">
          <h3>AI Simulator</h3>
          <p>실시간 웹캠 기반 컬러 미리보기와 포인트 마스크 오버레이를 제공합니다.</p>
          <Link href="/simulator" className="inline-link">페이지 이동</Link>
        </article>
        <article className="panel">
          <h3>Color Matcher</h3>
          <p>스킨/헤어 분석 결과에 따라 톤별 컬러 조합을 추천합니다.</p>
          <Link href="/color-matcher" className="inline-link">페이지 이동</Link>
        </article>
        <article className="panel">
          <h3>Virtual Shop</h3>
          <p>추천된 컬러를 바로 구매 가능한 카드 UI로 보여줍니다.</p>
          <Link href="/shop" className="inline-link">페이지 이동</Link>
        </article>
      </div>
    </section>
  );
}
