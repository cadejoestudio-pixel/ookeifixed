import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ArrowLeft, Loader2, Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useLiveProduct } from "@/hooks/useLiveShopify";

const ALLOWED_SIZES = ["S", "M", "L", "XL"];

const ProductPage = () => {
  const { slug } = useParams();
  const { product, loading, error, lastUpdated, refresh } = useLiveProduct(slug, 30000);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [isBuying, setIsBuying] = useState(false);
  const { addToCart, directBuy } = useCart();

  // Auto-select first available size when product loads
  useEffect(() => {
    if (product?.variants) {
      const variants = product.shopify_variants?.length > 0 
        ? product.shopify_variants 
        : product.variants;
      const availableVariant = variants.find(
        v => ALLOWED_SIZES.includes(v.size?.toUpperCase()) && 
             (v.quantity_available > 0 || v.inventory > 0)
      );
      if (availableVariant && !selectedSize) {
        setSelectedSize(availableVariant.size);
      }
    }
  }, [product, selectedSize]);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error("Select a size");
      return;
    }

    const result = await addToCart(product.id, selectedSize, quantity);
    if (result.success) {
      toast.success("Added to cart");
    } else {
      toast.error("Failed to add to cart");
    }
  };

  const handleBuyNow = async () => {
    if (!selectedSize) {
      toast.error("Select a size");
      return;
    }

    // Get variants list
    const variants = product.shopify_variants?.length > 0 
      ? product.shopify_variants 
      : product.variants;
    
    const selectedVariant = variants.find(v => v.size === selectedSize);
    
    if (!selectedVariant) {
      toast.error("Variant not found");
      return;
    }

    // Check inventory
    const qty = selectedVariant.quantity_available || selectedVariant.inventory || 0;
    if (qty <= 0) {
      toast.error("Size out of stock");
      return;
    }

    // Use checkout_url if available
    if (selectedVariant.checkout_url) {
      window.location.href = selectedVariant.checkout_url;
      return;
    }

    const variantId = selectedVariant.shopify_variant_id || selectedVariant.variant_id;
    if (!variantId) {
      toast.error("Product not available for checkout yet");
      return;
    }

    setIsBuying(true);
    try {
      const result = await directBuy(variantId, quantity);
      if (!result.success) {
        toast.error(result.error || result.message || "Checkout failed");
      }
    } catch (err) {
      toast.error("Checkout failed");
    } finally {
      setIsBuying(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin" />
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <p className="text-neutral-400 text-sm mb-4">Product not found</p>
        <Link to="/drops" className="text-xs font-bold tracking-wider uppercase hover:underline">
          ← BACK TO DROPS
        </Link>
      </div>
    );
  }

  // Get variants for display
  const displayVariants = product.shopify_variants?.length > 0 
    ? product.shopify_variants 
    : product.variants || [];
  
  // Filter to allowed sizes only
  const filteredVariants = displayVariants.filter(v => 
    ALLOWED_SIZES.includes(v.size?.toUpperCase())
  );

  // Calculate total remaining
  const totalRemaining = filteredVariants.reduce(
    (sum, v) => sum + (v.quantity_available || v.inventory || 0), 
    0
  );

  // Get image
  const imageUrl = product.images?.[0] || "";

  // Check states
  const isSoldOut = product.is_sold_out || totalRemaining <= 0;
  const isLocked = product.is_locked;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white"
      data-testid="product-page"
    >
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to={product.productType === "basic" ? "/basics" : "/drops"}
            className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase hover:text-[#FF4F00] transition-colors"
            data-testid="back-link"
          >
            <ArrowLeft size={16} />
            BACK
          </Link>
          <button
            onClick={refresh}
            className="flex items-center gap-2 text-[10px] text-neutral-400 hover:text-black transition-colors"
            title="Refresh inventory"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Product Layout */}
      <div className="pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square lg:aspect-auto lg:min-h-screen">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={product.name}
                className={`w-full h-full object-cover ${isLocked ? "blur-lg grayscale opacity-50" : ""} ${isSoldOut && !isLocked ? "grayscale opacity-60" : ""}`}
              />
            )}
            
            {/* Locked Overlay */}
            {isLocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                <div className="w-24 h-24 border-2 border-white/40 flex items-center justify-center mb-4">
                  <Lock size={40} className="text-white/70" />
                </div>
                <p className="text-white text-sm font-bold tracking-[0.3em] uppercase">
                  LOCKED
                </p>
                {product.unlock_message && (
                  <p className="text-white/60 text-xs tracking-wide mt-2 text-center px-8">
                    {product.unlock_message}
                  </p>
                )}
              </div>
            )}

            {/* Sold Out Overlay */}
            {isSoldOut && !isLocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="text-white text-3xl font-black tracking-[0.2em] uppercase">
                  SOLD OUT
                </span>
              </div>
            )}

            {/* Badge */}
            {!isLocked && !isSoldOut && (
              <div className="absolute top-6 left-6 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#FF4F00] animate-pulse" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase bg-white px-3 py-1.5">
                  {product.drop_order ? "LIVE NOW" : "IN STOCK"}
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="px-6 lg:px-12 py-12 lg:py-20">
            {/* Category */}
            <p className="text-[#FF4F00] text-[10px] font-bold tracking-[0.4em] uppercase">
              {product.drop_order 
                ? `DROP ${String(product.drop_order).padStart(2, "0")}` 
                : product.category}
            </p>

            {/* Name */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase mt-3">
              {product.name}
            </h1>

            {/* Price & Color */}
            <div className="flex items-center gap-4 mt-4">
              <span className="text-2xl font-bold">Q{product.price}</span>
              {product.color && (
                <span className="text-sm text-neutral-500 uppercase">• {product.color}</span>
              )}
            </div>

            {/* Remaining Counter */}
            {!isLocked && (
              <div className="mt-6 flex items-center gap-3">
                <span className={`w-2 h-2 ${isSoldOut ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
                <span className="text-sm font-medium">
                  {isSoldOut 
                    ? "SOLD OUT" 
                    : `${totalRemaining} / ${product.max_edition || 150} remaining`}
                </span>
              </div>
            )}

            {/* Size Selector with Inventory */}
            {!isLocked && !isSoldOut && (
              <div className="mt-8">
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-3">
                  SIZE — INVENTORY
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {ALLOWED_SIZES.map((size) => {
                    const variant = filteredVariants.find(v => v.size === size);
                    const qty = variant?.quantity_available || variant?.inventory || 0;
                    const isAvailable = qty > 0;
                    const isSelected = selectedSize === size;

                    return (
                      <button
                        key={size}
                        onClick={() => isAvailable && setSelectedSize(size)}
                        disabled={!isAvailable}
                        className={`
                          py-4 text-sm font-bold border-2 transition-all
                          ${isSelected 
                            ? "bg-black text-white border-black" 
                            : isAvailable
                              ? "bg-white text-black border-black/20 hover:border-black"
                              : "bg-neutral-100 text-neutral-300 border-neutral-100 cursor-not-allowed"
                          }
                        `}
                        data-testid={`size-btn-${size}`}
                      >
                        {size}
                        <span className={`block text-[10px] font-medium mt-1 ${isAvailable ? "" : "line-through"}`}>
                          {isAvailable ? `${qty} available` : "SOLD OUT"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            {!isLocked && !isSoldOut && (
              <div className="mt-6 flex items-center gap-4">
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400">
                  QTY
                </p>
                <div className="flex items-center border-2 border-black/20">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-neutral-100 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 hover:bg-neutral-100 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Buy Now Button */}
            {!isLocked && (
              <button
                onClick={handleBuyNow}
                disabled={!selectedSize || isBuying || isSoldOut}
                className="mt-8 w-full bg-[#FF4F00] text-white py-5 text-sm font-bold tracking-[0.3em] uppercase hover:bg-black transition-colors disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-testid="buy-now-btn"
              >
                {isBuying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    REDIRECTING TO CHECKOUT...
                  </>
                ) : isSoldOut ? (
                  "SOLD OUT"
                ) : selectedSize ? (
                  "BUY NOW"
                ) : (
                  "SELECT SIZE"
                )}
              </button>
            )}

            {/* Add to Cart Button */}
            {!isLocked && !isSoldOut && (
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize}
                className="mt-3 w-full bg-black text-white py-4 text-xs font-bold tracking-[0.3em] uppercase hover:bg-neutral-800 transition-colors disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
                data-testid="add-to-cart-btn"
              >
                {selectedSize ? "ADD TO CART" : "SELECT SIZE"}
              </button>
            )}

            {/* Shopify Checkout Note */}
            {!isLocked && !isSoldOut && (
              <p className="text-[9px] text-center text-neutral-400 mt-4 tracking-wider uppercase">
                SECURE CHECKOUT VIA SHOPIFY
              </p>
            )}

            {/* Accordion Info */}
            <div className="mt-12 border-t border-black/10">
              {/* Details */}
              <div className="border-b border-black/10">
                <button
                  onClick={() => setOpenAccordion(openAccordion === "details" ? null : "details")}
                  className="w-full py-5 flex items-center justify-between"
                >
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase">
                    DETAILS
                  </span>
                  {openAccordion === "details" ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
                <AnimatePresence>
                  {openAccordion === "details" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-5 text-sm text-neutral-600 space-y-2">
                        <p>• Premium heavyweight cotton</p>
                        <p>• Oversized fit</p>
                        <p>• Detailed back artwork</p>
                        <p>• Limited edition — {product.max_edition || 150} pieces only</p>
                        {product.productType === "drop" && (
                          <p className="text-[#FF4F00] font-bold">• NEVER RESTOCKS</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Shipping */}
              <div className="border-b border-black/10">
                <button
                  onClick={() => setOpenAccordion(openAccordion === "shipping" ? null : "shipping")}
                  className="w-full py-5 flex items-center justify-between"
                >
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase">
                    SHIPPING
                  </span>
                  {openAccordion === "shipping" ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
                <AnimatePresence>
                  {openAccordion === "shipping" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-5 text-sm text-neutral-600 space-y-2">
                        <p>• Free shipping on all orders</p>
                        <p>• 3-5 business days delivery</p>
                        <p>• Worldwide shipping available</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
              <p className="text-[9px] text-neutral-300 mt-8 text-center">
                Last updated: {new Date(lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductPage;
