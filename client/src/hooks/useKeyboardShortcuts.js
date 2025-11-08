import { useEffect } from 'react';

const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is typing in an input/textarea
      const isTyping = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
      
      for (const shortcut of shortcuts) {
        const { key, ctrl, shift, alt, callback, allowInInput } = shortcut;
        
        // Skip if typing and shortcut doesn't allow input
        if (isTyping && !allowInInput) continue;
        
        const ctrlMatch = ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shift ? e.shiftKey : !e.shiftKey;
        const altMatch = alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === key.toLowerCase();
        
        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          callback(e);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

export default useKeyboardShortcuts;
