import React from 'react';

const HeroBanner = () => {
  return (
    <section className="section-shell px-4">
      <div className="relative overflow-hidden rounded-lg border border-stone-800 bg-[#1f2933] px-8 py-14 text-white shadow-2xl shadow-stone-900/20 md:px-12 lg:px-16">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[linear-gradient(135deg,transparent_0%,rgba(217,119,6,0.22)_100%)] lg:block" />
        <div className="absolute left-8 top-8 h-1 w-24 bg-amber-500" />

        <div className="relative z-10 grid gap-12 lg:grid-cols-[1.25fr_0.75fr] items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-400/20 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              NEW ARRIVALS 2026
            </span>
            
            <h2 className="font-display text-3xl font-extrabold leading-tight md:text-5xl">
              Elevate your experience. <br />
              Define your digital lifestyle.
            </h2>
            
            <p className="max-w-xl text-sm leading-relaxed text-slate-400 md:text-base">
              Authorized distributor of premium technology products. 
              We guarantee 100% genuine devices with professional electronic warranty services, 
              delivering complete trust and peace of mind for every customer.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => {
                  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="rounded-md bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-950/20 transition-all duration-200 hover:bg-amber-500 active:scale-[0.98]"
              >
                Shop Now
              </button>

              <button 
                onClick={() => {
                  document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="rounded-md border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                Explore Categories
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-200 hover:border-amber-300/30">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-300">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Customer Protection
                  </p>

                  <p className="mt-1 text-base font-bold text-slate-100">
                    1-to-1 Home Warranty Service
                  </p>

                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    Strict electronic warranty activation standards with dedicated customer support.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-200 hover:border-emerald-300/30">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-300">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Shopping Benefits
                  </p>

                  <p className="mt-1 text-base font-bold text-slate-100">
                    Free Express Delivery
                  </p>

                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    Nationwide fast shipping available for all gaming devices and smartwatches.
                  </p>
                </div>
              </div>
            </div>

          </div>
          
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
