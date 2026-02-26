import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";

/**
 * LiveProductCard - Displays product with real-time Shopify data
 * Shows:
 * - Image, name, price, color
 * - Remaining stock: "X / 150 remaining"
 * - Size selector with inventory per size
 * - BUY button using variant.checkoutUrl
 */
const LiveProductCard = ({ product, index = 0 }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [isBuying, setIsBuying] = useState(false);
  const { directBuy } = useCart();

  if (!product) return null;

  const {
    name,
    slug,
    handle,
    price,
    color,
    images,
    variants = [],
    shopify_variants = [],
    total_inventory,
    max_edition,
    is_locked,
    is_sold_out,
    unlock_message,
    drop_order,
    category
  } = product;

  // Get image
  const imageUrl = images?.[0] || "";
  
  // Get variants (use shopify_variants if available, else variants)
  const displayVariants = shopify_variants.length > 0 ? shopify_variants : variants;
  
  // Filter to only S, M, L, XL
  const ALLOWED_SIZES = ["S", "M", "L", "XL"];
  const filteredVariants = displayVariants.filter(v => 
    ALLOWED_SIZES.includes(v.size?.toUpperCase())
  );

  // Calculate total remaining
  const totalRemaining = filteredVariants.reduce(
    (sum, v) => sum + (v.quantity_available || v.inventory || 0), 
    0
  );

  // Handle BUY click
  const handleBuy = async () => {
    if (!selectedSize) {
      toast.error("Select a size");
      return;
    }

    const variant = filteredVariants.find(v => v.size === selectedSize);
    if (!variant) {
      toast.error("Variant not found");
      return;
    }

    // Check inventory
    const qty = variant.quantity_available || variant.inventory || 0;
    if (qty <= 0) {
      toast.error("Size out of stock");
      return;
    }

    // Use checkout_url if available, else use variant ID
    if (variant.checkout_url) {
      window.location.href = variant.checkout_url;
      return;
    }

    const variantId = variant.shopify_variant_id || variant.variant_id;
    if (!variantId) {
      toast.error("Product not available for checkout");
      return;
    }

    setIsBuying(true);
    try {
      const result = await directBuy(variantId, 1);
      if (!result.success) {
        toast.error(result.error || "Checkout failed");
      }
    } catch (err) {
      toast.error("Checkout failed");
    } finally {
      setIsBuying(false);
    }
  };

  // LOCKED STATE
  if (is_locked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="relative"
        data-testid={`product-card-${slug || handle}`}
      >
        <div className="relative aspect-square bg-neutral-100 overflow-hidden">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover blur-lg grayscale opacity-50"
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
            <div className="w-20 h-20 border-2 border-white/40 flex items-center justify-center mb-4">
              <Lock size={32} className="text-white/70" />
            </div>
            <p className="text-white text-xs font-bold tracking-[0.3em] uppercase">
              LOCKED
            </p>
            {unlock_message && (
              <p className="text-white/60 text-[10px] tracking-wide mt-2 text-center px-4">
                {unlock_message}
              </p>
            )}
          </div>
          <div className="absolute top-4 left-4">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase bg-black/70 text-white/70 px-3 py-1.5">
              {drop_order ? `DROP ${drop_order}` : "LOCKED"}
            </span>
          </div>
        </div>
        <div className="mt-5 opacity-40">
          <p className="text-neutral-400 text-[10px] font-bold tracking-[0.3em] uppercase">
            {drop_order ? `DROP ${String(drop_order).padStart(2, "0")}` : category}
          </p>
          <h3 className="text-lg font-black tracking-tighter uppercase mt-1">
            {name}
          </h3>
          <p className="text-neutral-400 text-sm mt-2">
            Unlocks when previous drop sells out
          </p>
        </div>
      </motion.div>
    );
  }

  // SOLD OUT STATE
  if (is_sold_out || totalRemaining <= 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        data-testid={`product-card-${slug || handle}`}
      >
        <div className="relative aspect-square bg-neutral-100 overflow-hidden">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover grayscale opacity-60"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-white text-2xl font-black tracking-[0.2em] uppercase">
              SOLD OUT
            </span>
          </div>
          <div className="absolute top-4 left-4">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase bg-red-600 text-white px-3 py-1.5">
              SOLD OUT
            </span>
          </div>
        </div>
        <div className="mt-5">
          <p className="text-neutral-400 text-[10px] font-bold tracking-[0.3em] uppercase">
            {drop_order ? `DROP ${String(drop_order).padStart(2, "0")}` : category}
          </p>
          <h3 className="text-lg font-black tracking-tighter uppercase mt-1">
            {name}
          </h3>
          <p className="text-red-600 text-sm font-bold mt-2">SOLD OUT</p>
        </div>
      </motion.div>
    );
  }

  // AVAILABLE STATE
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      data-testid={`product-card-${slug || handle}`}
    >
      {/* Image */}
      <Link to={`/product/${slug || handle}`} className="group block">
        <div className="relative aspect-square bg-neutral-100 overflow-hidden">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#FF4F00] animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase bg-white px-3 py-1.5">
              {drop_order ? "LIVE NOW" : "IN STOCK"}
            </span>
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>
      </Link>

      {/* Info */}
      <div className="mt-5">
        <p className="text-[#FF4F00] text-[10px] font-bold tracking-[0.3em] uppercase">
          {drop_order ? `DROP ${String(drop_order).padStart(2, "0")}` : category}
        </p>
        <h3 className="text-lg font-black tracking-tighter uppercase mt-1">
          {name}
        </h3>
        
        {/* Price & Color */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xl font-bold">Q{price}</span>
          {color && (
            <span className="text-xs text-neutral-500 uppercase">{color}</span>
          )}
        </div>

        {/* Remaining Stock */}
        <div className="mt-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-neutral-600">
            {totalRemaining} / {max_edition || 150} remaining
          </span>
        </div>

        {/* Size Selector with Inventory */}
        <div className="mt-4">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mb-2">
            SIZE — SELECT TO BUY
          </p>
          <div className="grid grid-cols-4 gap-1">
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
                    py-2 text-xs font-bold border transition-all
                    ${isSelected 
                      ? "bg-black text-white border-black" 
                      : isAvailable
                        ? "bg-white text-black border-black/20 hover:border-black"
                        : "bg-neutral-100 text-neutral-300 border-neutral-100 cursor-not-allowed line-through"
                    }
                  `}
                  data-testid={`size-${size}`}
                >
                  {size}
                  <span className="block text-[9px] font-normal mt-0.5">
                    {isAvailable ? `${qty}` : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* BUY Button */}
        <button
          onClick={handleBuy}
          disabled={!selectedSize || isBuying}
          className="mt-4 w-full bg-[#FF4F00] text-white py-3 text-xs font-bold tracking-[0.2em] uppercase hover:bg-black transition-colors disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          data-testid="buy-btn"
        >
          {isBuying ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              CHECKOUT...
            </>
          ) : selectedSize ? (
            "BUY NOW"
          ) : (
            "SELECT SIZE"
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default LiveProductCard;
