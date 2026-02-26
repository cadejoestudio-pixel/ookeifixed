import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

const CartDrawer = ({ isOpen, onClose }) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const {
    cart,
    getProductById,
    updateCartItem,
    removeFromCart,
    getCartTotal,
    initiateCheckout,
  } = useCart();

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const result = await initiateCheckout();
      if (!result.success) {
        toast.error(result.error || result.message || "Checkout failed", {
          description: "Please try again or contact support",
        });
      }
    } catch (error) {
      toast.error("Checkout failed");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleUpdateQuantity = async (productId, variantSize, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      await removeFromCart(productId, variantSize);
      toast.success("Removed");
    } else {
      await updateCartItem(productId, variantSize, newQty);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-50"
            data-testid="cart-backdrop"
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col"
            data-testid="cart-drawer"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
              <h2 className="text-sm font-black tracking-tighter uppercase">CART</h2>
              <button
                onClick={onClose}
                className="p-2 hover:text-[#FF4F00] transition-colors"
                data-testid="close-cart-button"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-neutral-400 text-sm tracking-wide uppercase">
                    EMPTY
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.items.map((item, index) => {
                    const product = getProductById(item.product_id);
                    if (!product) return null;

                    // Get hero image
                    const heroImg = product.images?.find(img => img.type === "hero");
                    const imageUrl = heroImg?.url || product.images?.[0]?.url || product.images?.[0];

                    return (
                      <div
                        key={`${item.product_id}-${item.size}`}
                        className="flex gap-4"
                        data-testid={`cart-item-${index}`}
                      >
                        {/* Image */}
                        <div className="w-20 h-20 bg-neutral-50 flex-shrink-0 overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-bold uppercase tracking-tight truncate">
                            {product.name}
                          </h3>
                          <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wide">
                            {product.category} • SIZE {item.size}
                          </p>
                          <p className="text-sm font-bold mt-2">
                            Q{product.price.toFixed(0)}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.product_id,
                                  item.size,
                                  item.quantity,
                                  -1
                                )
                              }
                              className="w-7 h-7 border border-black/20 flex items-center justify-center hover:border-black transition-colors"
                              data-testid={`decrease-qty-${index}`}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-bold w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateQuantity(
                                  item.product_id,
                                  item.size,
                                  item.quantity,
                                  1
                                )
                              }
                              className="w-7 h-7 border border-black/20 flex items-center justify-center hover:border-black transition-colors"
                              data-testid={`increase-qty-${index}`}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.items.length > 0 && (
              <div className="px-6 py-6 border-t border-black/5">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
                    TOTAL
                  </span>
                  <span className="text-lg font-bold">
                    Q{getCartTotal().toFixed(0)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-[#FF4F00] text-white py-4 text-sm font-bold tracking-[0.2em] uppercase hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="checkout-button"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      PROCESSING...
                    </>
                  ) : (
                    "CHECKOUT"
                  )}
                </button>

                <p className="text-[9px] text-center text-neutral-400 mt-4 tracking-wider uppercase">
                  SECURE CHECKOUT VIA SHOPIFY
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CartDrawer;
