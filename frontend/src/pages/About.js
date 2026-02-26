import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";

// Brand Assets
const ASSETS = {
  mascot: "https://customer-assets.emergentagent.com/job_ookei-gallery/artifacts/iv5rnllc_Personaje%20Final%20gordo.png",
  packagingTubes: "https://customer-assets.emergentagent.com/job_ookei-gallery/artifacts/15b5ndn1_hf_20260211_103001_27a6a15d-74b4-4a12-aecc-071fb13c534b.jpeg",
};

const About = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white"
      data-testid="about-page"
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
              MANIFESTO
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-24 md:pb-40 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-16"
          >
            {/* Statement */}
            <div>
              <p className="text-2xl md:text-4xl font-black tracking-tighter leading-tight">
                OOKEI IS NOT A BRAND.
                <br />
                <span className="text-neutral-400">IT'S A STATEMENT.</span>
              </p>
            </div>

            {/* Body */}
            <div className="space-y-8 text-neutral-500 text-base md:text-lg leading-relaxed">
              <p>
                We create for the ones who question. The ones who look twice. 
                The ones who understand that clothing is more than fabric—it's a conversation.
              </p>
              <p>
                Every drop is a chapter. Every piece is numbered. 
                When they're gone, they're gone. No restocks. No apologies.
              </p>
            </div>

            {/* Values */}
            <div className="pt-12 border-t border-black/10">
              <div className="grid grid-cols-2 gap-8 md:gap-12">
                <div>
                  <p className="text-3xl md:text-4xl font-black">150</p>
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mt-2">
                    PIECES PER DROP
                  </p>
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-black">0</p>
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-400 mt-2">
                    RESTOCKS EVER
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mascot Section */}
      <section className="py-24 md:py-32 bg-neutral-50">
        <div className="max-w-md mx-auto px-6 text-center">
          <img
            src={ASSETS.mascot}
            alt="OOKEI Character"
            className="w-48 h-48 mx-auto object-contain mb-8"
          />
          <p className="text-2xl md:text-3xl font-black tracking-tighter">
            FOR THE ONES
            <br />
            <span className="text-neutral-300">WHO SEE</span>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-md mx-auto px-6 text-center">
          <Link
            to="/drop"
            className="inline-block bg-black text-white px-12 py-5 text-sm font-bold tracking-[0.2em] uppercase hover:bg-[#FF4F00] transition-colors"
            data-testid="about-cta"
          >
            VIEW DROP 001
          </Link>
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

export default About;
