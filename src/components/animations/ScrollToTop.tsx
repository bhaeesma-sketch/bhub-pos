import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

const ScrollToTop = ({ scrollContainer }: { scrollContainer?: HTMLElement | null }) => {
  const [visible, setVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const target = scrollContainer || window;
    const handleScroll = () => {
      const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      const scrollHeight = scrollContainer
        ? scrollContainer.scrollHeight - scrollContainer.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      setScrollProgress(Math.min(progress, 1));
      setVisible(scrollTop > 300);
    };
    target.addEventListener('scroll', handleScroll, { passive: true });
    return () => target.removeEventListener('scroll', handleScroll);
  }, [scrollContainer]);

  const scrollToTop = () => {
    const target = scrollContainer || window;
    target.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference - scrollProgress * circumference;

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.3, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.3, y: 40 }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full flex items-center justify-center cursor-pointer group"
          aria-label="Scroll to top"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {/* Animated ring showing scroll progress */}
          <svg
            className="absolute inset-0 -rotate-90"
            width="56"
            height="56"
            viewBox="0 0 56 56"
          >
            {/* Background track */}
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="hsl(var(--primary) / 0.15)"
              strokeWidth="2.5"
            />
            {/* Progress arc */}
            <motion.circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.1, ease: 'linear' }}
              style={{
                filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.5))',
              }}
            />
          </svg>

          {/* Pulsing glow ring on hover */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: '1.5px solid hsl(var(--primary) / 0.3)',
            }}
            animate={{
              boxShadow: [
                '0 0 0px hsl(var(--primary) / 0)',
                '0 0 12px hsl(var(--primary) / 0.3)',
                '0 0 0px hsl(var(--primary) / 0)',
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Arrow icon */}
          <ArrowUp className="h-5 w-5 text-primary relative z-10 group-hover:text-primary-foreground transition-colors duration-200" />

          {/* Hover fill */}
          <motion.div
            className="absolute inset-[3px] rounded-full bg-primary"
            initial={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
