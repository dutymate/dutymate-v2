// Mobile app integration interfaces
declare global {
  interface Window {
    isMobileApp?: boolean;
    mobileApp?: {
      postMessage: (message: {
        type: string;
        path?: string;
        params?: Record<string, any>;
        message?: string;
        description?: string;
        toastType?: string;
      }) => void;
      requestAuthData: () => void;
      navigate: (path: string) => void;
      showToast: (message: string, description?: string, type?: string) => void;
    };
  }
}

export {};
