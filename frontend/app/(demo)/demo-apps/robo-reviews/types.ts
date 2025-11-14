export type Review = {
  title: string;
  review: string;
};

export type Product = {
  name: string;
  summary: string;
  images: string[];
  reviews: Review[];
};

export type Category = {
  name: string;
  products: Product[];
  previewImages: string[];
};

