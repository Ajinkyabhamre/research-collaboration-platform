import React from 'react';
import { TopNav } from './TopNav';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { pageVariants } from '../../lib/motion';

export const AppShell = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-appBg">
      <TopNav />
      <main className="pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
