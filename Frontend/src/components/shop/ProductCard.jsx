import { Link } from 'react-router-dom';
import { Autoplay, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value);
};

const ProductCard = ({ product }) => {
  const images = Array.isArray(product?.imageUrls) ? product.imageUrls.filter(Boolean) : [];
  const hasMultipleImages = images.length > 1;
  const price = product?.price ?? 0;
  const discountPrice = product?.discountPrice ?? product?.discount?.value ? product?.discountPrice : null;
  const hasDiscount = Boolean(discountPrice);
  const discountPercent = hasDiscount && price > 0
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;
  const productPathId = product?._id || product?.id || product?.slug;

  return (
    <Link
      to={`/products/${productPathId}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-stone-200 bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-stone-900/10"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-mist">
        {images.length > 0 ? (
          hasMultipleImages ? (
            <Swiper
              modules={[Autoplay, Pagination]}
              autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
              pagination={{ clickable: true }}
              loop
              slidesPerView={1}
              className="h-full w-full"
            >
              {images.map((image, index) => (
                <SwiperSlide key={`${product?.id ?? 'product'}-${index}`} className="h-full w-full">
                  <img
                    src={image}
                    alt={product?.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <img
              src={images[0]}
              alt={product?.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-inkLight/60">Chưa có ảnh</div>
        )}
        
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-md bg-primary px-3 py-1 text-xs font-bold text-white shadow-md shadow-orange-900/20">
            {discountPercent > 0 ? `-${discountPercent}%` : 'Giảm giá'}
          </span>
        )}

        <span className="absolute bottom-3 right-3 translate-y-2 rounded-md bg-ink px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Xem chi tiết
        </span>
      </div>

      <div className="flex flex-1 flex-col bg-surface p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            {product?.category?.name || 'Danh mục'}
          </p>
          {product?.soldQuantity !== undefined && (
            <span className="shrink-0 text-xs text-inkLight">
              Đã bán {product.soldQuantity}
            </span>
          )}
        </div>

        <h4 className="min-h-[52px] text-base font-bold leading-snug text-ink line-clamp-2 transition-colors group-hover:text-primary">
          {product?.name}
        </h4>

        <p className="mt-2 min-h-[40px] text-sm leading-relaxed text-inkLight line-clamp-2">
          {product?.description || 'Sản phẩm đang được cập nhật mô tả.'}
        </p>

        <div className="mt-auto border-t border-stone-100 pt-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-inkLight/70">Giá bán</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-lg font-extrabold text-primary">
                  {formatCurrency(discountPrice || price)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-inkLight/70 line-through">
                    {formatCurrency(price)}
                  </span>
                )}
              </div>
            </div>

            <span className="rounded-md border border-stone-200 px-3 py-2 text-xs font-semibold text-ink transition group-hover:border-primary group-hover:bg-primary group-hover:text-white">
              Chi tiết
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
