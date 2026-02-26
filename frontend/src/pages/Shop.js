import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";

// Brand Assets
const ASSETS = {
  packagingTubes: "https://customer-assets.emergentagent.com/job_ookei-gallery/artifacts/15b5ndn1_hf_20260211_103001_27a6a15d-74b4-4a12-aecc-071fb13c534b.jpeg",
  mascot: "https://customer-assets.emergentagent.com/job_ookei-gallery/artifacts/iv5rnllc_Personaje%20Final%20gordo.png",
};

const Shop = () => {
  const { products, fetchProducts } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const activeProducts = products.filter((p) => p.is_active && !p.is_archived);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-white"
      data-testid="shop-page"
    >
      <Header variant="solid" />

      {/* Hero */}
      <section className="pt-32 md:pt-40 pb-16 md:pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-[#FF4F00] text-[10px] font-bold tracking-[0.4em] uppercase mb-4">
              NOW AVAILABLE
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase">
              DROP 001
            </h1>
            <p className="mt-6 text-neutral-500 text-sm md:text-base tracking-wide max-w-md mx-auto">
              150 pieces each. Hand-numbered. No restock.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 flex items-center justify-center gap-8 md:gap-12"
          >
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-[#FF4F00] animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase">
                LIVE
              </span>
            </div>
            <div className="w-px h-4 bg-black/20" />
            <span className="text-xs tracking-widest uppercase text-neutral-500">
              {activeProducts.reduce((sum, p) => sum + p.total_inventory, 0)} PIECES LEFT
            </span>
          </motion.div>
        </div>
      </section>

      {/* Products - Gallery Style */}
      <section className="pb-24 md:pb-40">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {activeProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                <Link
                  to={`/product/${product.slug}`}
                  className="group block"
                  data-testid={`product-card-${product.slug}`}
                >
                  {/* Product Image */}
                  <div className="relative aspect-[4/5] bg-neutral-50 overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    
                    {/* Edition Badge */}
                    <div className="absolute top-6 left-6">
                      <span className="text-[10px] font-bold tracking-[0.2em] uppercase bg-white px-4 py-2 border border-black/10">
                        /{product.max_edition}
                      </span>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                  </div>

                  {/* Product Info */}
                  <div className="mt-6">
                    <p className="text-[#FF4F00] text-[10px] font-bold tracking-[0.3em] uppercase mb-2">
                      {product.drop}
                    </p>
                    <h3 className="text-lg md:text-xl font-black tracking-tighter uppercase group-hover:text-[#FF4F00] transition-colors">
                      {product.name.split("—")[1]?.trim() || product.name}
                    </h3>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold">
                        ${product.price.toFixed(0)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#FF4F00] animate-pulse" />
                        <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-500">
                          {product.total_inventory} LEFT
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Strip */}
      <section className="py-24 md:py-32 bg-neutral-50">
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black tracking-tighter"
          >
            FOR THE ONES
            <br />
            <span className="text-neutral-300">WHO SEE</span>
          </motion.p>
        </div>

        {/* Image Grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-1">
          <div className="aspect-square overflow-hidden">
            <img
              src={ASSETS.packagingTubes}
              alt="OOKEI"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="aspect-square overflow-hidden bg-[#F5F5F0] flex items-center justify-center">
            <img
              src={ASSETS.mascot}
              alt="OOKEI"
              className="w-2/3 h-2/3 object-contain"
            />
          </div>
          <div className="aspect-square overflow-hidden">
            <img
              src={activeProducts[0]?.images[0] || ASSETS.packagingTubes}
              alt="OOKEI"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="aspect-square overflow-hidden">
            <img
              src={activeProducts[1]?.images[0] || ASSETS.packagingTubes}
              alt="OOKEI"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-white border-t border-black/5">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-2xl font-black tracking-tighter mb-6">OOKEI</p>
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-neutral-400">
            WE KNOW YOU LOOKED
          </p>
          <p className="text-xs text-neutral-300 mt-6">
            © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </motion.div>
  );
};

export default Shop;
