import { useEffect } from 'react';

export const useFavicon = (faviconUrl?: string) => {
  useEffect(() => {
    if (!faviconUrl) return;

    // Find existing favicon link elements
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    
    // Remove existing favicons
    existingFavicons.forEach(favicon => {
      favicon.remove();
    });

    // Create new favicon link element
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/x-icon';
    link.href = faviconUrl;
    
    // Add to document head
    document.head.appendChild(link);

    // Cleanup function
    return () => {
      const currentFavicon = document.querySelector(`link[href="${faviconUrl}"]`);
      if (currentFavicon) {
        currentFavicon.remove();
      }
    };
  }, [faviconUrl]);
};