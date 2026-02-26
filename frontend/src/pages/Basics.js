import { motion } from "framer-motion";
import Header from "@/components/Header";
import LiveProductCard from "@/components/LiveProductCard";
import { useLiveBasics } from "@/hooks/useLiveShopify";

const Basics = () => {
  const { basics, loading, error, refresh } = useLiveBasics(30000);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white"
      data-testid="basics-page"
    >
      <Header variant="solid" />

      {/* Hero */}
      <section className="pt-32 md:pt-40 pb-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-neutral-400 text-[10px] font-bold tracking-[0.4em] uppercase mb-4">
              CORE COLLECTION
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase">
              BASICS
            </h1>
            <p className="mt-6 text-neutral-500 text-sm tracking-wide">
              Essential pieces. Always available.
            </p>
          </motion.div>

          {/* Stock Status */}
          {basics.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-10 inline-flex items-center gap-4 bg-black text-white px-8 py-4"
            >
              <span className="w-2 h-2 bg-green-500" />
              <span className="text-sm font-bold tracking-widest uppercase">
                IN STOCK
              </span>
            </motion.div>
          )}

          {/* No Products Message */}
          {!loading && basics.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-10 text-center"
            >
              <p className="text-neutral-400 text-sm">
                No basics available yet. Products will appear when added to Shopify.
              </p>
              <button
                onClick={refresh}
                className="mt-4 text-xs text-[#FF4F00] font-bold tracking-wider uppercase hover:underline"
              >
                REFRESH
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Products Grid - LIVE DATA */}
      <section className="pb-24 md:pb-40 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 text-sm">Error loading products</p>
              <button
                onClick={refresh}
                className="mt-4 text-xs font-bold tracking-wider uppercase hover:underline"
              >
                RETRY
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {basics.map((product, index) => (
                <LiveProductCard 
                  key={product.id || product.slug} 
                  product={product} 
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Statement */}
      <section className="py-24 md:py-32 bg-black">
        <div className="text-center px-6">
          <p className="text-white text-3xl md:text-5xl font-black tracking-tighter">
            ESSENTIAL PIECES
          </p>
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase mt-6">
            PREMIUM QUALITY • ALWAYS AVAILABLE • CORE IDENTITY
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-white border-t border-black/5">
        <div className="text-center">
          <p className="text-2xl font-black tracking-tighter">OOKEI</p>
          <p className="text-[10px] text-neutral-400 tracking-[0.4em] uppercase mt-4">
            FOR THE ONES WHO SEE
          </p>
          <p className="text-[9px] text-neutral-300 tracking-wide mt-4">
            Auto-updates every 30 seconds
          </p>
        </div>
      </footer>
    </motion.div>
  );
};

export default Basics;
