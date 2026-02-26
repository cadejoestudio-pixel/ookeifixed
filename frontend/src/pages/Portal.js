import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useLiveProducts } from "@/hooks/useLiveShopify";
import LiveProductCard from "@/components/LiveProductCard";
const BACKEND = process.env.REACT_APP_BACKEND_URL;
const API = BACKEND ? `${BACKEND.replace(/\/$/, "")}/api` : "";

// Brand Assets
const ASSETS = {
  heroDropScene: "https://customer-assets.emergentagent.com/job_ookei-gallery/artifacts/8waoxalu_hf_20260224_011808_15dae314-eae5-4d20-8c44-bf9e8f6fd735.jpeg",
  mascot: "https://customer-assets.emergentagent.com/job_ookei-gallery/artifacts/iv5rnllc_Personaje%20Final%20gordo.png",
};

const Portal = () => {
  const [isEntering, setIsEntering] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const navigate = useNavigate();
  
  // Live Shopify data with auto-refresh every 30 seconds
  const { products, drops, basics, loading, lastUpdated, refresh } = useLiveProducts(30000);

  // Calculate pieces left from first unlocked drop
  const firstUnlockedDrop = drops.find(d => !d.is_locked);
  const piecesLeft = firstUnlockedDrop?.total_inventory || 0;
  const maxEdition = firstUnlockedDrop?.max_edition || 150;

  const handleEnter = () => {
    setIsEntering(true);
    setTimeout(() => {
      navigate("/drops");
    }, 1200);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setIsSubscribing(true);
    try {
      await axios.post(`${API}/subscribe`, { email, source: "portal" });
      setIsSubscribed(true);
      toast.success("You're in");
    } catch (error) {
      toast.error("Try again");
    } finally {
      setIsSubscribing(false);
    }
  };

  // Define which drops are locked (future drops)
  const isDropLocked = (dropNumber) => dropNumber > 1;

  return (
    <>
      {/* ============ PORTAL TRANSITION ============ */}
      <AnimatePresence>
        {isEntering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <p className="text-white text-5xl md:text-7xl font-black tracking-tighter">
                OOKEI
              </p>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="h-px bg-white/30 mt-4"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white" data-testid="portal-page">
        
        {/* ============ FULL SCREEN HERO ============ */}
        <section className="h-screen relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            <img
              src={ASSETS.heroDropScene}
              alt="OOKEI Drop"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          {/* Centered Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Brand */}
              <h1 className="text-white text-7xl md:text-9xl lg:text-[12rem] font-black tracking-tighter leading-none">
                OOKEI
              </h1>
              
              {/* Drop Label */}
              <p className="text-white/60 text-base md:text-lg tracking-[0.5em] uppercase mt-4">
                DROP 001
              </p>
            </motion.div>

            {/* Dynamic Counter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-16"
            >
              <div className="inline-flex items-center gap-4 border border-white/20 bg-white/5 backdrop-blur-sm px-8 py-4">
                <span className="w-3 h-3 bg-[#FF4F00] animate-pulse" />
                <span className="text-white text-lg md:text-xl font-bold tracking-wider">
                  {piecesLeft} PIECES LEFT
                </span>
              </div>
            </motion.div>

            {/* ENTER Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="mt-12"
            >
              <button
                onClick={handleEnter}
                className="relative bg-white text-black px-20 md:px-24 py-5 md:py-6 text-base md:text-lg font-black tracking-[0.3em] uppercase overflow-hidden group"
                data-testid="enter-portal-btn"
              >
                <span className="relative z-10 group-hover:text-white transition-colors duration-500">
                  ENTER
                </span>
                <div className="absolute inset-0 bg-[#FF4F00] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              </button>
            </motion.div>

            {/* Micro Text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="text-white/40 text-[10px] tracking-[0.4em] uppercase mt-8"
            >
              NOT FOR EVERYONE
            </motion.p>
          </div>

          {/* Scroll Line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-px h-16 bg-gradient-to-b from-white/40 to-transparent"
            />
          </motion.div>
        </section>

        {/* ============ DROPS GRID WITH LIVE DATA ============ */}
        <section className="py-24 md:py-40 px-6 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <p className="text-[#FF4F00] text-[10px] font-bold tracking-[0.4em] uppercase mb-4">
                COLLECTION
              </p>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
                ALL DROPS
              </h2>
              {drops.length > 0 && (
                <p className="text-neutral-400 text-xs mt-4">
                  {piecesLeft} / {maxEdition} remaining • Auto-updates every 30s
                </p>
              )}
            </motion.div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin" />
              </div>
            ) : drops.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-neutral-400 text-sm">
                  No drops available yet. Add products with "drop" tag in Shopify.
                </p>
                <button
                  onClick={refresh}
                  className="mt-4 text-xs text-[#FF4F00] font-bold tracking-wider uppercase hover:underline"
                >
                  REFRESH
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* ============ BASICS SECTION WITH LIVE DATA ============ */}
        <section className="py-24 md:py-40 px-6 md:px-12 bg-neutral-50" data-testid="basics-section">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <p className="text-neutral-400 text-[10px] font-bold tracking-[0.4em] uppercase mb-4">
                CORE COLLECTION
              </p>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
                BASICS
              </h2>
              <p className="text-neutral-500 text-sm mt-4">
                Essential pieces. Always available.
              </p>
            </motion.div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin" />
              </div>
            ) : basics.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-neutral-400 text-sm">
                  No basics available yet. Add products with "basics" tag in Shopify.
                </p>
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

            {/* View All Basics Link */}
            {basics.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-center mt-16"
              >
                <Link
                  to="/basics"
                  className="inline-block border-2 border-black px-12 py-4 text-sm font-bold tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-colors"
                  data-testid="view-all-basics-btn"
                >
                  VIEW ALL BASICS
                </Link>
              </motion.div>
            )}
          </div>
        </section>

        {/* ============ STATEMENT ============ */}
        <section className="py-32 md:py-48 bg-black">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center px-6"
          >
            <p className="text-white text-4xl md:text-6xl lg:text-8xl font-black tracking-tighter">
              ONLY 150 EXIST
            </p>
            <p className="text-white/40 text-sm md:text-base tracking-[0.3em] uppercase mt-6">
              PER DROP • NO RESTOCK • EVER
            </p>
          </motion.div>
        </section>

        {/* ============ EMAIL CAPTURE ============ */}
        <section className="py-32 md:py-40 bg-white">
          <div className="max-w-md mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {isSubscribed ? (
                <div data-testid="email-success">
                  <p className="text-4xl font-black tracking-tighter uppercase">
                    YOU'RE IN
                  </p>
                  <p className="text-neutral-400 text-sm mt-4">
                    Watch your inbox for drop alerts.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-3xl md:text-4xl font-black tracking-tighter uppercase mb-12">
                    GET EARLY ACCESS
                  </p>

                  <form onSubmit={handleSubscribe} data-testid="email-form">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="YOUR EMAIL"
                      className="w-full border-b-2 border-black bg-transparent px-0 py-4 text-center text-sm tracking-[0.2em] uppercase focus:border-[#FF4F00] focus:outline-none placeholder:text-neutral-300"
                      data-testid="email-input"
                    />
                    <button
                      type="submit"
                      disabled={isSubscribing}
                      className="mt-8 w-full bg-black text-white py-5 text-sm font-bold tracking-[0.3em] uppercase hover:bg-[#FF4F00] transition-colors disabled:opacity-50"
                      data-testid="email-submit"
                    >
                      {isSubscribing ? "..." : "NOTIFY ME"}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className="py-16 bg-black">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <p className="text-white text-3xl font-black tracking-tighter mb-6">
              OOKEI
            </p>
            <p className="text-white/30 text-[10px] tracking-[0.4em] uppercase">
              FOR THE ONES WHO SEE
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Portal;
