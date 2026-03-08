// ============================================================================
// TOAST NOTIFICATION UTILITIES
// Convenient helpers for showing toast notifications
// ============================================================================

import toast from 'react-hot-toast';

export const showToast = {
  /**
   * Show success toast
   */
  success: (message: string) => {
    toast.success(message);
  },

  /**
   * Show error toast
   */
  error: (message: string) => {
    toast.error(message);
  },

  /**
   * Show info toast
   */
  info: (message: string) => {
    toast(message, {
      icon: 'ℹ️',
      style: {
        border: '1px solid #3b82f6',
      },
    });
  },

  /**
   * Show warning toast
   */
  warning: (message: string) => {
    toast(message, {
      icon: '⚠️',
      style: {
        border: '1px solid #f59e0b',
      },
    });
  },

  /**
   * Show loading toast (returns toast ID for dismissal)
   */
  loading: (message: string) => {
    return toast.loading(message);
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  /**
   * Promise toast - shows loading, then success/error based on promise result
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },
};

// Export default for convenience
export default showToast;
