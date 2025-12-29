import { toast as sonnerToast } from 'sonner';

/**
 * Toast helpers wrapping sonner with consistent styling
 */

export const toast = {
  success: (message, options = {}) => {
    return sonnerToast.success(message, {
      duration: 4000,
      ...options,
    });
  },

  error: (message, options = {}) => {
    return sonnerToast.error(message, {
      duration: 5000,
      ...options,
    });
  },

  info: (message, options = {}) => {
    return sonnerToast.info(message, {
      duration: 4000,
      ...options,
    });
  },

  warning: (message, options = {}) => {
    return sonnerToast.warning(message, {
      duration: 4000,
      ...options,
    });
  },

  promise: (promise, options) => {
    return sonnerToast.promise(promise, options);
  },

  loading: (message, options = {}) => {
    return sonnerToast.loading(message, options);
  },

  dismiss: (toastId) => {
    return sonnerToast.dismiss(toastId);
  },
};
