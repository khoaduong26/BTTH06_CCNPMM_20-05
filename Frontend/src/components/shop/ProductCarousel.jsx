import ProductCard from './ProductCard';

const ProductCarousel = ({ items = [], isLoading, error, emptyMessage }) => {
  if (isLoading) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="w-[320px] h-[360px] flex-shrink-0 animate-pulse rounded-lg border border-stone-200 bg-surface shadow-sm" />
        ))}
      </div>
    );
  }

  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-600">{error}</div>;
  if (!items.length) return <div className="rounded-lg border border-stone-200 bg-surface p-6 text-sm text-inkLight">{emptyMessage}</div>;

  return (
    <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
      {items.map((item, index) => (
        <div key={item.id || item._id || item.slug || index} className="w-[320px] flex-shrink-0 snap-start">
          <ProductCard product={item} />
        </div>
      ))}
    </div>
  );
};

export default ProductCarousel;
