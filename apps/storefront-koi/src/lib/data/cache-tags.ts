export const CACHE_TAGS = {
  products: 'products',
  product: (handle: string) => `product-${handle}`,
  offers: 'offers',
  offer: (id: string) => `offer-${id}`,
  productOffers: (productId: string) => `product-offers-${productId}`,
  collections: 'collections',
  collection: (handle: string) => `collection-${handle}`,
  categories: 'categories',
  category: (handle: string) => `category-${handle}`,
} as const;

export const getGlobalCacheOptions = (
  base: string,
  scoped?: string
): { revalidate: false; tags: string[] } => {
  const tags = scoped ? [base, scoped] : [base];
  return { revalidate: false, tags };
};
