import { useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import LiveProductCard from "@/components/LiveProductCard";
import { useLiveDrops } from "@/hooks/useLiveShopify";

const Drops = () => {
  const { drops, loading, error, refresh } = useLiveDrops(30000);

  // Calculate total remaining from first unlocked drop
  const firstUnlockedDrop = drops.find(d => !d.is_locked);
  const totalRemaining = firstUnlockedDrop?.total_inventory || 0;
  const maxEdition = firstUnlockedDrop?.max_edition || 150;
  
  // Get current drop number
  const currentDropNum = firstUnlockedDrop?.drop_order || 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white"
      data-testid="drops-page"
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
            <p className="text-[#FF4F00] text-[10px] font-bold tracking-[0.4em] uppercase mb-4">
              {drops.length > 0 ? "AVAILABLE NOW" : "COMING SOON"}
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase">
              DROP {String(currentDropNum).padStart(3, "0")}
            </h1>
            <p className="mt-6 text-neutral-500 text-sm tracking-wide">
              Only {maxEdition} pieces exist. No restock.
            </p>
          </motion.div>

          {/* Live Counter */}
          {drops.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-10 inline-flex items-center gap-4 bg-black text-white px-8 py-4"
            >
              <span className="w-2 h-2 bg-[#FF4F00] animate-pulse" />
              <span className="text-sm font-bold tracking-widest uppercase">
                {totalRemaining} / {maxEdition} remaining
              </span>
            </motion.div>
          )}

          {/* No Products Message */}
          {!loading && drops.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-10 text-center"
            >
              <p className="text-neutral-400 text-sm">
                No drops available yet. Products will appear when added to Shopify.
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
              {drops.map((product, index) => (
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
            NEVER RESTOCK
          </p>
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase mt-6">
            WHEN IT'S GONE • IT'S GONE FOREVER
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

export default Drops;
