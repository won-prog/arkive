import Link from "next/link";

const steps = [
  { title: "Capture", desc: "카메라로 얼굴/헤어 입력" },
  { title: "Analyze", desc: "AI 노드 기반 톤 분석" },
  { title: "Simulate", desc: "실시간 컬러 오버레이 적용" },
  { title: "Shop", desc: "추천 제품 구매로 전환" }
];

export default function FlowPage() {
  return (
    <section>
      <h1 className="page-title">Luminous AR Beauty Flow</h1>
      <p className="page-desc">Stitch 프로젝트 핵심 유저 여정</p>

      <div className="flow-grid">
        {steps.map((step, idx) => (
          <article className="panel" key={step.title}>
            <p className="eyebrow">STEP {idx + 1}</p>
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
          </article>
        ))}
      </div>

      <div className="hero-actions" style={{ marginTop: 16 }}>
        <Link href="/simulator" className="btn-primary">체험 시작</Link>
        <Link href="/shop" className="btn-secondary">추천 상품 보기</Link>
      </div>
    </section>
  );
}
