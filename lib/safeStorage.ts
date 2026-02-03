// Safe localStorage wrapper that handles SecurityError in iframes
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
    return null;
  },
  
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  },
  
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  },
  
  clear: (): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.clear();
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  }
};
