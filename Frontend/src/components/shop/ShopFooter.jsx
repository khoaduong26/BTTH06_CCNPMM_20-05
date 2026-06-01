const ShopFooter = () => {
  return (
    <footer className="border-t border-stone-200 bg-[#1f2933] py-10 text-slate-200">
      <div className="section-shell">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">QuickCart</p>
            <h3 className="mt-3 font-display text-2xl text-white">Ecommerce shop</h3>
            <p className="mt-4 text-sm text-slate-300">
              A curated marketplace with real-time product data, handpicked for modern shoppers.
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Explore</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><a className="transition hover:text-amber-300" href="#latest">Latest arrivals</a></li>
              <li><a className="transition hover:text-amber-300" href="#best-sellers">Best sellers</a></li>
              <li><a className="transition hover:text-amber-300" href="#promotions">Promotions</a></li>
              <li><a className="transition hover:text-amber-300" href="#categories">Categories</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">Contact</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Email: khoaduong861@gmail.com</li>
              <li>Phone: +8422787915</li>
              <li>Address: 1st Vo Van Ngan, Thu Duc District, HCM City</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-400">
          <span>© 2026 QuickCart Commerce Studio</span>
          <span>Built with care for modern shopping experiences.</span>
        </div>
      </div>
    </footer>
  );
};

export default ShopFooter;
