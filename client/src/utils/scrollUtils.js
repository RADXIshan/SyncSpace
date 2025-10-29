// Utility functions for smooth scrolling and WhatsApp-like scroll behavior

/**
 * Smooth scroll to bottom with optimized performance
 * @param {HTMLElement} element - The element to scroll
 * @param {boolean} instant - Whether to scroll instantly or smoothly
 */
export const scrollToBottom = (element, instant = false) => {
  if (!element) return;

  if (instant) {
    // Instant scroll for real-time messages
    element.scrollTop = element.scrollHeight;
  } else {
    // Smooth scroll for user-initiated actions
    element.scrollTo({
      top: element.scrollHeight,
      behavior: 'smooth'
    });
  }
};

/**
 * Check if user is near bottom of scroll container
 * @param {HTMLElement} element - The scroll container
 * @param {number} threshold - Distance from bottom to consider "near" (default: 100px)
 * @returns {boolean}
 */
export const isNearBottom = (element, threshold = 100) => {
  if (!element) return false;
  
  const { scrollTop, scrollHeight, clientHeight } = element;
  return scrollHeight - scrollTop - clientHeight < threshold;
};

/**
 * Optimized scroll to bottom using requestAnimationFrame
 * @param {HTMLElement} element - The element to scroll
 */
export const smoothScrollToBottom = (element) => {
  if (!element) return;

  requestAnimationFrame(() => {
    element.scrollTop = element.scrollHeight;
  });
};

/**
 * Auto-scroll behavior for new messages (WhatsApp-like)
 * Only scrolls if user is already near the bottom
 * @param {HTMLElement} element - The scroll container
 * @param {boolean} force - Force scroll even if not near bottom
 */
export const autoScrollOnNewMessage = (element, force = false) => {
  if (!element) return;

  if (force || isNearBottom(element)) {
    smoothScrollToBottom(element);
  }
};

/**
 * Debounced scroll handler to improve performance
 * @param {Function} callback - Function to call on scroll
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function}
 */
export const debounceScroll = (callback, delay = 100) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback.apply(null, args), delay);
  };
};

/**
 * Throttled scroll handler for better performance
 * @param {Function} callback - Function to call on scroll
 * @param {number} limit - Throttle limit in milliseconds
 * @returns {Function}
 */
export const throttleScroll = (callback, limit = 16) => {
  let inThrottle;
  
  return (...args) => {
    if (!inThrottle) {
      callback.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Smooth scroll to a specific message
 * @param {HTMLElement} messageElement - The message element to scroll to
 * @param {HTMLElement} container - The scroll container
 */
export const scrollToMessage = (messageElement, container) => {
  if (!messageElement || !container) return;

  const containerRect = container.getBoundingClientRect();
  const messageRect = messageElement.getBoundingClientRect();
  
  const scrollTop = container.scrollTop + messageRect.top - containerRect.top - 20; // 20px offset
  
  container.scrollTo({
    top: scrollTop,
    behavior: 'smooth'
  });
};

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @param {HTMLElement} container - Container element
 * @returns {boolean}
 */
export const isElementInViewport = (element, container) => {
  if (!element || !container) return false;

  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  return (
    elementRect.top >= containerRect.top &&
    elementRect.bottom <= containerRect.bottom
  );
};

/**
 * Get scroll percentage
 * @param {HTMLElement} element - The scroll container
 * @returns {number} Percentage (0-100)
 */
export const getScrollPercentage = (element) => {
  if (!element) return 0;

  const { scrollTop, scrollHeight, clientHeight } = element;
  const maxScroll = scrollHeight - clientHeight;
  
  if (maxScroll <= 0) return 100;
  
  return Math.round((scrollTop / maxScroll) * 100);
};

/**
 * Preserve scroll position during content updates
 * @param {HTMLElement} element - The scroll container
 * @param {Function} updateCallback - Function that updates content
 */
export const preserveScrollPosition = async (element, updateCallback) => {
  if (!element || !updateCallback) return;

  const { scrollTop, scrollHeight } = element;
  const wasAtBottom = isNearBottom(element, 50);

  await updateCallback();

  if (wasAtBottom) {
    // If user was at bottom, keep them at bottom
    smoothScrollToBottom(element);
  } else {
    // Otherwise, maintain relative position
    const newScrollHeight = element.scrollHeight;
    const heightDifference = newScrollHeight - scrollHeight;
    element.scrollTop = scrollTop + heightDifference;
  }
};