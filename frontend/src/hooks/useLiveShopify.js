import { useState, useEffect, useCallback } from "react";
import axios from "axios";
const BACKEND = process.env.REACT_APP_BACKEND_URL;
const API = BACKEND ? `${BACKEND.replace(/\/$/, "")}/api` : "";

/**
 * Hook for fetching live Shopify product data with auto-refresh
 * Updates every 30 seconds automatically
 */
export const useLiveProducts = (refreshInterval = 30000) => {
  const [products, setProducts] = useState([]);
  const [drops, setDrops] = useState([]);
  const [basics, setBasics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLiveProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/live/products`);
      const data = response.data;
      
      setProducts(data.products || []);
      setDrops(data.drops || []);
      setBasics(data.basics || []);
      setLastUpdated(data.timestamp || new Date().toISOString());
      setError(null);
    } catch (err) {
      console.error("Error fetching live products:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchLiveProducts();
  }, [fetchLiveProducts]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchLiveProducts, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchLiveProducts, refreshInterval]);

  return {
    products,
    drops,
    basics,
    loading,
    error,
    lastUpdated,
    refresh: fetchLiveProducts
  };
};

/**
 * Hook for fetching a single live product with auto-refresh
 */
export const useLiveProduct = (handle, refreshInterval = 30000) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchProduct = useCallback(async () => {
    if (!handle) return;
    
    try {
      const response = await axios.get(`${API}/live/product/${handle}`);
      setProduct(response.data.product);
      setLastUpdated(response.data.timestamp);
      setError(null);
    } catch (err) {
      console.error(`Error fetching product ${handle}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [handle]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(fetchProduct, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchProduct, refreshInterval]);

  return {
    product,
    loading,
    error,
    lastUpdated,
    refresh: fetchProduct
  };
};

/**
 * Hook for fetching live drops only
 */
export const useLiveDrops = (refreshInterval = 30000) => {
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDrops = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/live/drops`);
      setDrops(response.data.drops || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrops();
  }, [fetchDrops]);

  useEffect(() => {
    const interval = setInterval(fetchDrops, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchDrops, refreshInterval]);

  return { drops, loading, error, refresh: fetchDrops };
};

/**
 * Hook for fetching live basics only
 */
export const useLiveBasics = (refreshInterval = 30000) => {
  const [basics, setBasics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBasics = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/live/basics`);
      setBasics(response.data.basics || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBasics();
  }, [fetchBasics]);

  useEffect(() => {
    const interval = setInterval(fetchBasics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchBasics, refreshInterval]);

  return { basics, loading, error, refresh: fetchBasics };
};

/**
 * Helper to calculate total remaining from variants
 */
export const calculateTotalRemaining = (variants = []) => {
  return variants.reduce((sum, v) => sum + (v.quantity_available || v.inventory || 0), 0);
};

/**
 * Helper to format remaining display: "X / 150 remaining"
 */
export const formatRemaining = (remaining, maxEdition = 150) => {
  return `${remaining} / ${maxEdition} remaining`;
};

/**
 * Helper to get variant by size
 */
export const getVariantBySize = (variants = [], size) => {
  return variants.find(v => v.size?.toUpperCase() === size?.toUpperCase());
};

export default useLiveProducts;
