import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Header from "@/components/Header";
const BACKEND = process.env.REACT_APP_BACKEND_URL;
const API = BACKEND ? `${BACKEND.replace(/\/$/, "")}/api` : "";

// Brand Assets
const ASSETS = {
  packagingTubes: "https://customer-assets.emergentagent.com/job_ookei-gallery/artifacts/15b5ndn1_hf_20260211_103001_27a6a15d-74b4-4a12-aecc-071fb13c534b.jpeg",
};

const Archive = () => {
  const archiveItems = [
    {
      id: "genesis",
      drop: "DROP 000",
      name: "GENESIS",
      description: "Friends & family only",
      date: "DEC 2024",
      pieces: 50,
      status: "SOLD OUT",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white"
      data-testid="archive-page"
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
              ARCHIVE
            </h1>
            <p className="mt-6 text-neutral-400 text-sm tracking-wide">
              Once they're gone, they're gone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Archive List */}
      <section className="pb-24 md:pb-40 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          {/* Current Drop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between py-8 border-t border-black/10"
          >
            <div>
              <p className="text-xl md:text-2xl font-black tracking-tighter uppercase">
                DROP 001
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                OOKEI SHIRT 001 & 002
              </p>
            </div>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF4F00] px-4 py-2 border border-[#FF4F00]">
              AVAILABLE
            </span>
          </motion.div>

          {/* Past Drops */}
          {archiveItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: (index + 1) * 0.1 }}
              className="flex items-center justify-between py-8 border-t border-black/10"
              data-testid={`archive-item-${item.id}`}
            >
              <div>
                <p className="text-xl md:text-2xl font-black tracking-tighter uppercase text-neutral-300">
                  {item.drop}
                </p>
                <p className="text-sm text-neutral-300 mt-1">
                  {item.name} — {item.pieces} PIECES
                </p>
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-300">
                {item.status}
              </span>
            </motion.div>
          ))}

          {/* Future */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-between py-8 border-t border-black/10 opacity-30"
          >
            <div>
              <p className="text-xl md:text-2xl font-black tracking-tighter uppercase">
                DROP 002
              </p>
            </div>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
              TBA
            </span>
          </motion.div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-24 md:py-32 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-2xl md:text-4xl font-black tracking-tighter">
            THE ARCHIVE IS PROOF
            <br />
            <span className="text-neutral-300">YOU WERE THERE FIRST</span>
          </p>
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

export default Archive;
