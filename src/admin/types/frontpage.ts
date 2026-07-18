export interface FrontpageSettings {
  hero: {
    text: string;
  };
  featuredCollections: {
    heading: string;
    body: string;
    ctaText: string;
    images?: string[];
  };
  newArrivals: {
    title: string;
  };
  lookbook?: {
    images: string[];
  };
}
