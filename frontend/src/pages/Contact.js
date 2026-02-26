import { useState } from "react";
import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import Header from "@/components/Header";
const BACKEND = process.env.REACT_APP_BACKEND_URL;
const API = BACKEND ? `${BACKEND.replace(/\/$/, "")}/api` : "";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Fill all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(`${API}/contact`, formData);
      setIsSubmitted(true);
      toast.success("Sent");
    } catch (error) {
      toast.error("Try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white"
      data-testid="contact-page"
    >
      <Header variant="solid" />

      {/* Hero */}
      <section className="pt-32 md:pt-40 pb-16 md:pb-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase">
              CONTACT
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24 md:pb-40 px-6 md:px-12">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {isSubmitted ? (
              <div className="text-center py-16">
                <p className="text-3xl font-black tracking-tighter uppercase mb-4">
                  RECEIVED
                </p>
                <p className="text-neutral-400 text-sm">
                  We'll get back to you.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8" data-testid="contact-form">
                <div>
                  <label className="block text-[10px] font-bold tracking-[0.3em] uppercase mb-3">
                    NAME
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border-b-2 border-black bg-transparent px-0 py-3 text-base focus:border-[#FF4F00] focus:outline-none"
                    data-testid="contact-name"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-[0.3em] uppercase mb-3">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border-b-2 border-black bg-transparent px-0 py-3 text-base focus:border-[#FF4F00] focus:outline-none"
                    data-testid="contact-email"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-[0.3em] uppercase mb-3">
                    MESSAGE
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full border-b-2 border-black bg-transparent px-0 py-3 text-base focus:border-[#FF4F00] focus:outline-none resize-none"
                    data-testid="contact-message"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-4 text-sm font-bold tracking-[0.2em] uppercase hover:bg-[#FF4F00] transition-colors disabled:opacity-50"
                  data-testid="contact-submit"
                >
                  {isSubmitting ? "..." : "SEND"}
                </button>
              </form>
            )}

            {/* Social */}
            <div className="mt-16 pt-12 border-t border-black/10">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-6">
                CONNECT
              </p>
              <a
                href="https://instagram.com/weareookei"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-sm font-bold hover:text-[#FF4F00] transition-colors"
                data-testid="contact-instagram"
              >
                <Instagram size={18} />
                @WEAREOOKEI
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-white border-t border-black/5">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-2xl font-black tracking-tighter mb-6">OOKEI</p>
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-neutral-400">
            WE KNOW YOU LOOKED
          </p>
        </div>
      </footer>
    </motion.div>
  );
};

export default Contact;
