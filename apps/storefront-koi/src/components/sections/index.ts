/* The tier barrel, as `apps/storefront` keeps one per component tier: a route
   imports `@/components/sections`, never a deep path, so a section can be split
   or renamed without touching `app/`. */

export { AccountPage } from './AccountPage/AccountPage';
export { AddressesPage } from './AccountPage/AddressesPage';
export { OrderDetailPage } from './AccountPage/OrderDetailPage';
export { OrdersPage } from './AccountPage/OrdersPage';
export { SettingsPage } from './AccountPage/SettingsPage';
export { AuctionsPage } from './AuctionsPage/AuctionsPage';
export { ForgotPasswordPage } from './AuthPage/ForgotPasswordPage';
export { LoginPage } from './AuthPage/LoginPage';
export { NewPasswordPage } from './AuthPage/NewPasswordPage';
export { RegisterPage } from './AuthPage/RegisterPage';
export { Cart } from './Cart/Cart';
export { CatalogPage } from './CatalogPage/CatalogPage';
export { CategoriesPage } from './CategoryPage/CategoriesPage';
export { CategoryPage, getCategory } from './CategoryPage/CategoryPage';
export { HomePage } from './HomePage/HomePage';
export { InfoPage, getInfoDoc } from './InfoPage/InfoPage';
export { LivePage } from './LivePage/LivePage';
export { LotDetailsPage } from './LotDetailsPage/LotDetailsPage';
export { ProductDetailsPage, getProduct } from './ProductDetailsPage/ProductDetailsPage';
export { MarketplacePage } from './MarketplacePage/MarketplacePage';
export { PartnerPage, getPartner } from './PartnerPage/PartnerPage';
export { PartnersPage } from './PartnersPage/PartnersPage';
export { Shipping } from './Shipping/Shipping';
