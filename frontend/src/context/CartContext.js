import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const BACKEND = process.env.REACT_APP_BACKEND_URL;
const API = BACKEND ? `${BACKEND.replace(/\/$/, "")}/api` : "";

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [products, setProducts] = useState([]);

  // Generate or retrieve session ID
  useEffect(() => {
    let sid = localStorage.getItem("ookei_session_id");
    if (!sid) {
      sid = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("ookei_session_id", sid);
    }
    setSessionId(sid);
  }, []);

  // Fetch cart on session load
useEffect(() => {
  if (sessionId) {
    fetchCart();
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [sessionId]);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart/${sessionId}`);
      setCart(response.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const addToCart = async (productId, variantSize, quantity = 1, color = null) => {
    try {
      const response = await axios.post(`${API}/cart/add`, {
        session_id: sessionId,
        product_id: productId,
        size: variantSize,
        color: color,
        quantity,
      });
      setCart(response.data.cart);
      setIsCartOpen(true);
      return { success: true };
    } catch (error) {
      console.error("Error adding to cart:", error);
      return { success: false, error: error.message };
    }
  };

  const updateCartItem = async (productId, variantSize, quantity, color = null) => {
    try {
      const response = await axios.put(`${API}/cart/update`, {
        session_id: sessionId,
        product_id: productId,
        size: variantSize,
        color: color,
        quantity,
      });
      setCart(response.data.cart);
      return { success: true };
    } catch (error) {
      console.error("Error updating cart:", error);
      return { success: false, error: error.message };
    }
  };

  const removeFromCart = async (productId, variantSize) => {
    return updateCartItem(productId, variantSize, 0);
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API}/cart/${sessionId}`);
      setCart({ items: [] });
      return { success: true };
    } catch (error) {
      console.error("Error clearing cart:", error);
      return { success: false, error: error.message };
    }
  };

  const getCartTotal = () => {
    return cart.items.reduce((total, item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (product) {
        return total + product.price * item.quantity;
      }
      return total;
    }, 0);
  };

  const getCartItemCount = () => {
    return cart.items.reduce((count, item) => count + item.quantity, 0);
  };

  const getProductById = (productId) => {
    return products.find((p) => p.id === productId);
  };

  // Shopify checkout - creates checkout URL and redirects
  const initiateCheckout = async () => {
    try {
      const response = await axios.post(`${API}/checkout`, {
        session_id: sessionId
      });
      
      if (response.data.success && response.data.checkout_url) {
        // Redirect to Shopify checkout
        window.location.href = response.data.checkout_url;
        return { success: true };
      } else {
        return { 
          success: false, 
          message: response.data.error || "Checkout not available yet" 
        };
      }
    } catch (error) {
      console.error("Error initiating checkout:", error);
      const errorMsg = error.response?.data?.detail || error.message;
      return { success: false, error: errorMsg };
    }
  };

  // Direct buy - creates immediate Shopify checkout for a single item
  const directBuy = async (variantId, quantity = 1) => {
    try {
      const response = await axios.post(`${API}/shopify/checkout`, {
        variant_id: variantId,
        quantity: quantity
      });
      
      if (response.data.success && response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
        return { success: true };
      } else {
        return { 
          success: false, 
          message: response.data.error || "Checkout failed" 
        };
      }
    } catch (error) {
      console.error("Error creating direct checkout:", error);
      const errorMsg = error.response?.data?.detail || error.message;
      return { success: false, error: errorMsg };
    }
  };

  const value = {
    cart,
    products,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
    getProductById,
    initiateCheckout,
    directBuy,
    fetchProducts,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
