export interface Product {
  id: string;
  name: string;
  englishName: string;
  description: string;
  priceUSD: number;
  category: string;
  subcategory?: string;
  image: string;
  rating: number;
  reviewsCount: number;
  specs: {
    [key: string]: string;
  };
  inStock: boolean;
  tags: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
  description: string;
}
