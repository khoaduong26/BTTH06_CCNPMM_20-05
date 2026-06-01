import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/auth.context';
import { SearchOutlined, ShoppingCartOutlined, LogoutOutlined } from '@ant-design/icons';

const ShopHeader = ({ searchValue = '', onSearchChange }) => {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-surface/90 backdrop-blur-xl">
      <div className="section-shell">
        <div className="flex flex-col gap-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-white font-bold shadow-lg shadow-stone-900/10">Q</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Shop</p>
                <h1 className="font-display text-xl font-semibold text-ink">Khoa</h1>
              </div>
            </Link>
            <button className="flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-stone-900/10 lg:hidden">
              Menu
            </button>
          </div>

          <nav className="flex flex-wrap items-center gap-5 text-sm font-medium text-inkLight">
            <Link to="/" className="transition hover:text-primary">Home</Link>
            <a href="#latest" className="transition hover:text-primary">Latest</a>
            <a href="#best-sellers" className="transition hover:text-primary">Best Sellers</a>
            {/* <a href="#promotions" className="transition hover:text-primary">Promotions</a> */}
            <a href="#categories" className="transition hover:text-primary">Categories</a>
            {auth?.user?.role === 'ADMIN' && (
              <Link to="/admin/profile" className="font-semibold text-primary transition hover:text-amber-700">
                Quản lý đơn hàng
              </Link>
            )}
          </nav>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            <div className="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-4 py-2 shadow-sm shadow-stone-900/5 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-orange-100">
              <SearchOutlined className="text-primary" />
              <input
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-inkLight/60"
                placeholder="Search products"
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Link 
                to="/cart" 
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-900/10 transition hover:bg-amber-700"
              >
                <ShoppingCartOutlined />
                Cart
              </Link>
              <div className="flex items-center gap-3 rounded-md border border-stone-200 bg-white px-4 py-2 shadow-sm shadow-stone-900/5">
                <div className="h-8 w-8 rounded-md bg-emerald-700 text-xs font-semibold text-white flex items-center justify-center">
                  {auth?.user?.name?.[0]?.toUpperCase() || auth?.user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="text-left">
                  <p className="text-xs text-inkLight">Member</p>
                  <p className="text-sm font-semibold text-ink">
                    {auth?.user?.name || auth?.user?.email || 'Guest'}
                  </p>
                </div>
                {auth?.user?.role === 'ADMIN' && (
                  <Link
                    to="/admin/profile"
                    className="rounded-md bg-primarySoft px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
                  >
                    Admin
                  </Link>
                )}
                {auth?.isAuthenticated && (
                  <button
                    className="flex items-center gap-2 rounded-md border border-stone-200 px-3 py-1 text-xs font-semibold text-inkLight transition hover:border-primary/40 hover:text-primary"
                    onClick={handleLogout}
                  >
                    <LogoutOutlined />
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ShopHeader;
