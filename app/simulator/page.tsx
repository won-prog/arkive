const hotspots = [
  { label: "Hairline", x: "62%", y: "26%" },
  { label: "Crown", x: "56%", y: "38%" },
  { label: "Back Tone", x: "64%", y: "52%" }
];

export default function SimulatorPage() {
  return (
    <section>
      <h1 className="page-title">AI Simulator</h1>
      <p className="page-desc">실시간 헤어 컬러 AR 시뮬레이션 화면</p>

      <div className="sim-layout">
        <div className="camera-area">
          <img src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80" alt="model" />
          <div className="overlay" />
          {hotspots.map((spot) => (
            <div key={spot.label} className="spot" style={{ left: spot.x, top: spot.y }}>
              <span>{spot.label}</span>
            </div>
          ))}
        </div>
        <aside className="control">
          <h3>Color Presets</h3>
          <div className="chips">
            <button>Rose Violet</button>
            <button>Ash Lavender</button>
            <button>Cherry Brown</button>
            <button>Milk Beige</button>
          </div>
          <h3>Intensity</h3>
          <input type="range" min={0} max={100} defaultValue={65} />
          <button className="btn-primary full">현재 톤 저장</button>
        </aside>
      </div>
    </section>
  );
}
