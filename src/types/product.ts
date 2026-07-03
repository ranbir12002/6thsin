export interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  images: string[];
  category: string;
  subcategory: string;
  color: string;
  colors?: { name: string; hex: string }[];
  sizes: string[];
  material: string;
  careInstructions: string[];
  fit: string;
  articleNumber: string;
  supplierInfo?: string;
  countryOfProduction?: string;
}
