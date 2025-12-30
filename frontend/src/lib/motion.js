/**
 * Motion utilities for Framer Motion animations
 * Respects prefers-reduced-motion user preference
 */

// Check if user prefers reduced motion
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Page transition variants
export const pageVariants = {
  initial: {
    opacity: 0,
    y: prefersReducedMotion() ? 0 : 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: prefersReducedMotion() ? 0.01 : 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: prefersReducedMotion() ? 0 : -10,
    transition: {
      duration: prefersReducedMotion() ? 0.01 : 0.15,
      ease: 'easeIn',
    },
  },
};

// Fade in up animation
export const fadeUp = {
  initial: {
    opacity: 0,
    y: prefersReducedMotion() ? 0 : 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: prefersReducedMotion() ? 0.01 : 0.3,
      ease: 'easeOut',
    },
  },
};

// Fade in animation
export const fadeIn = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: prefersReducedMotion() ? 0.01 : 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: prefersReducedMotion() ? 0.01 : 0.15,
    },
  },
};

// Scale in animation
export const scaleIn = {
  initial: {
    opacity: 0,
    scale: prefersReducedMotion() ? 1 : 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: prefersReducedMotion() ? 0.01 : 0.15,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: prefersReducedMotion() ? 1 : 0.95,
    transition: {
      duration: prefersReducedMotion() ? 0.01 : 0.1,
      ease: 'easeIn',
    },
  },
};

// Stagger children animation
export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: prefersReducedMotion() ? 0 : 0.1,
    },
  },
};

// Slide in from right (for modals/drawers)
export const slideInRight = {
  initial: {
    x: prefersReducedMotion() ? 0 : '100%',
    opacity: prefersReducedMotion() ? 1 : 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: prefersReducedMotion() ? 0.01 : 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    x: prefersReducedMotion() ? 0 : '100%',
    opacity: prefersReducedMotion() ? 1 : 0,
    transition: {
      duration: prefersReducedMotion() ? 0.01 : 0.2,
      ease: 'easeIn',
    },
  },
};

// Slide in from bottom (for mobile sheets)
export const slideInBottom = {
  initial: {
    y: prefersReducedMotion() ? 0 : '100%',
    opacity: prefersReducedMotion() ? 1 : 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: prefersReducedMotion() ? 0.01 : 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    y: prefersReducedMotion() ? 0 : '100%',
    opacity: prefersReducedMotion() ? 1 : 0,
    transition: {
      duration: prefersReducedMotion() ? 0.01 : 0.2,
      ease: 'easeIn',
    },
  },
};

// Collapse animation for expandable sections
export const collapse = {
  initial: {
    height: 0,
    opacity: 0,
  },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: {
        duration: prefersReducedMotion() ? 0.01 : 0.3,
      },
      opacity: {
        duration: prefersReducedMotion() ? 0.01 : 0.2,
        delay: prefersReducedMotion() ? 0 : 0.1,
      },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: {
        duration: prefersReducedMotion() ? 0.01 : 0.25,
      },
      opacity: {
        duration: prefersReducedMotion() ? 0.01 : 0.15,
      },
    },
  },
};

// Message send animation (for input area during send)
export const messageSend = {
  initial: { opacity: 1, scale: 1 },
  sending: {
    opacity: 0.5,
    scale: 0.98,
    transition: {
      duration: prefersReducedMotion() ? 0.01 : 0.15,
      ease: 'easeOut',
    },
  },
  sent: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: prefersReducedMotion() ? 0.01 : 0.2,
      ease: 'easeOut',
    },
  },
};

// Enhanced message entrance animation
export const messageEnter = {
  initial: {
    opacity: 0,
    y: prefersReducedMotion() ? 0 : 20,
    scale: prefersReducedMotion() ? 1 : 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: prefersReducedMotion() ? 0.01 : 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: prefersReducedMotion() ? 0 : -10,
    transition: {
      duration: prefersReducedMotion() ? 0.01 : 0.2,
    },
  },
};
