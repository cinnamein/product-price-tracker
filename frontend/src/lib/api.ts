import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

export interface PriceHistory {
  price: number;
  original_price: number | null;
  discount_rate: number | null;
  scraped_at: string;
}

export interface Product {
  id: number;
  name: string | null;
  url: string;
  image_url: string | null;
  brand: string | null;
  latest_price: number | null;
  previous_price: number | null;
  first_price: number | null;
  created_at: string;
}

export interface ProductDetail extends Product {
  price_history: PriceHistory[];
}

export async function registerProduct(url: string): Promise<Product> {
  const { data } = await api.post<Product>("/products/", { url });
  return data;
}

export async function getProducts(q: string = ""): Promise<Product[]> {
  const { data } = await api.get<Product[]>("/products/", {
    params: q.trim() ? { q: q.trim() } : {},
  });
  return data;
}

export async function getProduct(id: number): Promise<ProductDetail> {
  const { data } = await api.get<ProductDetail>(`/products/${id}`);
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function triggerScrape(id: number): Promise<ProductDetail> {
  const { data } = await api.post<ProductDetail>(`/products/${id}/scrape`);
  return data;
}

export default api;
