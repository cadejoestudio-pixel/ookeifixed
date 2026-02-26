import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";

// Pages
import Portal from "@/pages/Portal";
import Drops from "@/pages/Drops";
import Basics from "@/pages/Basics";
import ProductPage from "@/pages/ProductPage";
import Archive from "@/pages/Archive";
import About from "@/pages/About";
import Contact from "@/pages/Contact";

// Context
import { CartProvider } from "@/context/CartContext";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Portal />} />
            <Route path="/drops" element={<Drops />} />
            <Route path="/drop" element={<Drops />} />
            <Route path="/basics" element={<Basics />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </AnimatePresence>
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
