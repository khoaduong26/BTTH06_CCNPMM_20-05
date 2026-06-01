import ProductCard from './ProductCard';

const ProductGrid = ({ items = [], isLoading, error, emptyMessage, lastElementRef }) => {
  // Skeleton loading cho lần load đầu tiên
  if (isLoading && items.length === 0) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-[360px] animate-pulse rounded-lg border border-stone-200 bg-surface shadow-sm shadow-stone-900/5" />
        ))}
      </div>
    );
  }

  if (error && items.length === 0) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-600">{error}</div>;
  }

  if (!items.length) {
    return <div className="rounded-lg border border-stone-200 bg-surface p-6 text-sm text-inkLight shadow-sm shadow-stone-900/5">{emptyMessage}</div>;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item, index) => {
        // Kiểm tra nếu là phần tử cuối cùng thì gắn ref vào
        const isLastItem = index === items.length - 1;
        
        return (
          <div key={item.id || item._id || item.slug || index} ref={isLastItem ? lastElementRef : null}>
            <ProductCard product={item} />
          </div>
        );
      })}
    </div>
  );
};

export default ProductGrid;
