import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";

const Header = ({ variant = "default" }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isCartOpen, setIsCartOpen, getCartItemCount } = useCart();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const navLinks = [
    { href: "/drops", label: "DROPS" },
    { href: "/basics", label: "BASICS" },
    { href: "/archive", label: "ARCHIVE" },
    { href: "/about", label: "ABOUT" },
    { href: "/contact", label: "CONTACT" },
  ];

  const cartItemCount = getCartItemCount();

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled || variant === "solid"
            ? "bg-white/95 backdrop-blur-sm border-b border-black/5"
            : "bg-transparent"
        }`}
        data-testid="header"
      >
        <nav className="flex items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="text-sm font-black tracking-tighter uppercase hover:text-[#FF4F00] transition-colors"
            data-testid="logo-link"
          >
            OOKEI
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-[10px] font-bold tracking-[0.2em] uppercase hover:text-[#FF4F00] transition-colors ${
                  location.pathname === link.href || 
                  (link.href === "/drops" && location.pathname.startsWith("/product"))
                    ? "text-[#FF4F00]" 
                    : ""
                }`}
                data-testid={`nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:text-[#FF4F00] transition-colors"
              data-testid="cart-button"
              aria-label="Open cart"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF4F00] text-white text-[9px] font-bold flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden text-[10px] font-bold tracking-[0.2em] uppercase hover:text-[#FF4F00] transition-colors"
              data-testid="menu-button"
            >
              MENU
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-white z-50 flex flex-col"
            data-testid="mobile-menu"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
              <span className="text-sm font-black tracking-tighter uppercase">
                OOKEI
              </span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:text-[#FF4F00] transition-colors"
                data-testid="close-menu-button"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 flex flex-col justify-center px-6 gap-6">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Link
                    to={link.href}
                    className={`text-3xl font-black tracking-tighter uppercase hover:text-[#FF4F00] transition-colors ${
                      location.pathname === link.href ? "text-[#FF4F00]" : ""
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="px-6 py-8 border-t border-black/5">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400">
                FOR THE ONES WHO SEE
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Header;
