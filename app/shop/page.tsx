const products = [
  { name: "Luminous Dye #V12", tag: "Best Match", price: "₩18,900" },
  { name: "Tone Booster Serum", tag: "AI Pick", price: "₩24,000" },
  { name: "Color Lock Shampoo", tag: "Bundle", price: "₩15,500" }
];

export default function ShopPage() {
  return (
    <section>
      <h1 className="page-title">Virtual Shop</h1>
      <p className="page-desc">추천 결과 기반 제품 큐레이션</p>

      <div className="section-grid three">
        {products.map((item) => (
          <article className="panel product" key={item.name}>
            <span className="badge">{item.tag}</span>
            <h3>{item.name}</h3>
            <p className="price">{item.price}</p>
            <button className="btn-primary full">장바구니 담기</button>
          </article>
        ))}
      </div>
    </section>
  );
}
