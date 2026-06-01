import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import ShopHeader from '../components/shop/ShopHeader';
import SectionHeader from '../components/shop/SectionHeader';
import ProductGrid from '../components/shop/ProductGrid';
import ShopFooter from '../components/shop/ShopFooter';
import { fetchProductDetail } from '../util/catalog.api';
import { addToCartAPI } from '../util/cart.api';
import { message } from 'antd';
const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value);
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setThumbsSwiper(null);
      try {
        const res = await fetchProductDetail(id);
        setProduct(res?.product && typeof res.product === 'object' ? res.product : null);
        setRelated(Array.isArray(res?.related) ? res.related : []);
        setError('');
      } catch (error) {
        console.error('[ProductDetailPage] Failed to load product detail:', error);
        setError('Unable to load product.');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const maxQty = useMemo(() => product?.stockQuantity ?? 0, [product]);

  const handleQuantity = (next) => {
    const normalized = Math.min(Math.max(next, 1), maxQty || 1);
    setQuantity(normalized);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setIsAdding(true);
    try {
      const productId = product._id || product.id; 
      const res = await addToCartAPI(productId, quantity);
      
      if (res && res.success) {
        message.success("Đã thêm sản phẩm vào giỏ hàng thành công!");
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      message.error("Vui lòng đăng nhập để thêm vào giỏ hàng!");
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <ShopHeader />
        <main className="section-shell py-10">
          <div className="h-96 animate-pulse rounded-lg border border-stone-200 bg-surface" />
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col">
        <ShopHeader />
        <main className="section-shell py-10">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-600">
            {error || 'Product not found.'}
          </div>
        </main>
      </div>
    );
  }

  const productId = product?.id ?? product?._id ?? id;
  const images = Array.isArray(product?.imageUrls)
    ? product.imageUrls.filter(Boolean)
    : [];
  const activeThumbsSwiper = thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null;
  const hasDiscount = Boolean(product.discountPrice);
  const price = product.discountPrice || product.price;

  return (
    <div className="flex min-h-screen flex-col">
      <ShopHeader />
      <main className="flex flex-col gap-12 py-10">
        <section className="section-shell space-y-8">
          <nav className="text-sm text-inkLight">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <span>{product?.category?.name || 'Category'}</span>
            <span className="mx-2">/</span>
            <span className="text-ink">{product?.name || 'Product detail'}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-start">
            <div className="min-w-0 space-y-6">
              {images.length > 0 ? (
                <div className="space-y-4 min-w-0">
                  <Swiper
                    key={productId}
                    modules={[Navigation, Pagination, Thumbs]}
                    navigation
                    pagination={{ clickable: true }}
                    loop={images.length > 1}
                    watchOverflow
                    thumbs={{ swiper: images.length > 1 ? activeThumbsSwiper : null }}
                    className="product-detail-swiper aspect-square w-full overflow-hidden rounded-lg border border-stone-200 bg-mist"
                  >
                    {images.map((image) => (
                      <SwiperSlide key={image} className="!h-full w-full">
                        <img
                          src={image}
                          alt={product?.name || 'Product image'}
                          className="block h-full w-full object-cover"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = 'https://placehold.co/1200x1200?text=Image+Unavailable';
                          }}
                        />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                  <Swiper
                    key={`${productId}-thumbs`}
                    onSwiper={setThumbsSwiper}
                    modules={[Thumbs]}
                    watchSlidesProgress
                    spaceBetween={12}
                    slidesPerView={3}
                    className="product-detail-thumbs w-full"
                    breakpoints={{
                      640: { slidesPerView: 4 },
                      1024: { slidesPerView: 5 }
                    }}
                  >
                    {images.map((image) => (
                      <SwiperSlide key={`thumb-${image}`} className="!h-auto">
                        <div className="aspect-square overflow-hidden rounded-md bg-mist ring-1 ring-stone-200 transition hover:ring-primary/40">
                          <img
                            src={image}
                            alt={product?.name || 'Product thumbnail'}
                            className="block h-full w-full object-cover"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.src = 'https://placehold.co/1200x1200?text=Image+Unavailable';
                            }}
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-stone-200 bg-surface text-inkLight">
                  <div className="text-center">
                    <p className="text-sm font-medium text-inkLight">No images available</p>
                    <p className="mt-1 text-xs text-inkLight/70">Product images will appear here once uploaded.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary">{product?.category?.name || 'Category'}</p>
                <h1 className="mt-3 font-display text-3xl font-semibold text-ink">{product?.name || 'Product detail'}</h1>
                <p className="mt-3 text-sm text-inkLight">{product?.description || 'No description available.'}</p>
              </div>

              <div className="rounded-lg border border-stone-200 bg-surface p-6 shadow-sm shadow-stone-900/5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-2xl font-semibold text-primary">{formatCurrency(price)}</span>
                  {hasDiscount && (
                    <span className="text-sm text-inkLight/70 line-through">{formatCurrency(product?.price ?? 0)}</span>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-inkLight">
                  <div>
                    <p className="text-xs uppercase text-inkLight/70">SKU</p>
                    <p className="font-semibold text-ink">{product?.sku || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-inkLight/70">Stock</p>
                    <p className="font-semibold text-ink">{product?.stockQuantity ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-inkLight/70">Sold</p>
                    <p className="font-semibold text-ink">{product?.soldQuantity ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-inkLight/70">Category</p>
                    <p className="font-semibold text-ink">{product?.category?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-stone-200 bg-surface p-6 shadow-sm shadow-stone-900/5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 rounded-md border border-stone-200 px-3 py-2">
                    <button
                      className="h-8 w-8 rounded-md border border-stone-200 text-inkLight transition hover:border-primary hover:text-primary"
                      onClick={() => handleQuantity(quantity - 1)}
                    >
                      -
                    </button>
                    <span className="min-w-[32px] text-center text-sm font-semibold text-ink">{quantity}</span>
                    <button
                      className="h-8 w-8 rounded-md border border-stone-200 text-inkLight transition hover:border-primary hover:text-primary"
                      onClick={() => handleQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className={`flex-1 rounded-md px-6 py-3 text-sm font-semibold text-white transition-colors ${
                      isAdding 
                        ? 'bg-stone-400 cursor-not-allowed' 
                        : 'bg-primary hover:bg-amber-700'
                    }`}
                  >
                    {isAdding ? 'Đang thêm...' : 'Add to cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-shell space-y-8">
          <SectionHeader
            eyebrow="Related"
            title="You may also like"
          />
          <ProductGrid items={related} emptyMessage="No related products." />
        </section>
      </main>
      <ShopFooter />
    </div>
  );
};

export default ProductDetailPage;
