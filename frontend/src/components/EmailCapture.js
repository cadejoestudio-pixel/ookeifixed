import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
const BACKEND = process.env.REACT_APP_BACKEND_URL;
const API = BACKEND ? BACKEND.replace(/\/$/, "") : "";


const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EmailCapture = ({ variant = "default" }) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(`${API}/subscribe`, {
        email,
        source: "homepage",
      });

      setIsSubscribed(true);
      toast.success("Welcome to the inner circle");
    } catch (error) {
      toast.error("Something went wrong. Try again.");
      console.error("Subscription error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${
          variant === "minimal" ? "" : "py-16 md:py-24 px-4 md:px-8"
        }`}
        data-testid="email-capture-success"
      >
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 border border-black mb-6">
            <Check size={20} />
          </div>
          <h3 className="text-xl md:text-2xl font-bold uppercase tracking-tight mb-2">
            You're In
          </h3>
          <p className="text-sm text-muted-foreground">
            The inner circle knows first. Watch your inbox.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className={`${
        variant === "minimal"
          ? ""
          : "py-16 md:py-24 px-4 md:px-8 border-t border-black/10"
      }`}
      data-testid="email-capture"
    >
      <div className="max-w-xl mx-auto">
        {variant !== "minimal" && (
          <div className="text-center mb-8">
            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-2">
              Join the inner circle
            </p>
            <h3 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
              Only the inner circle
              <br />
              knows first
            </h3>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full border-b border-black bg-transparent px-0 py-4 text-base md:text-lg focus:border-accent focus:outline-none placeholder:text-muted-foreground pr-12"
            disabled={isSubmitting}
            data-testid="email-input"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:text-accent transition-colors disabled:opacity-50"
            data-testid="email-submit"
            aria-label="Subscribe"
          >
            <ArrowRight size={20} />
          </button>
        </form>

        <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase tracking-wider">
          No spam. Drop alerts only.
        </p>
      </div>
    </div>
  );
};

export default EmailCapture;