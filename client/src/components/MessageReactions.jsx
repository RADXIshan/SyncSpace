import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import EmojiPicker from "./EmojiPicker";

const MessageReactions = ({
  reactions = [],
  onReactionClick,
  currentUserId,
  isOwnMessage = false,
  zIndex = 50,
  theme = "light", // "light" or "dark"
  containerBounds = null, // Optional container bounds for positioning
  useViewportPositioning = false, // Use fixed positioning relative to viewport
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ bottom: true, right: false, buttonRect: null });
  const emojiPickerRef = useRef(null);
  const plusButtonRef = useRef(null);

  // Calculate optimal position for emoji picker
  const calculatePickerPosition = () => {
    if (!plusButtonRef.current) return;

    const buttonRect = plusButtonRef.current.getBoundingClientRect();
    
    // Use container bounds if provided (for fixed positioned containers like meeting chat)
    const bounds = containerBounds || {
      width: window.innerWidth,
      height: window.innerHeight,
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight
    };
    
    // Emoji picker approximate dimensions
    const pickerWidth = 320;
    const pickerHeight = 400;
    
    // Add padding to prevent edge touching
    const padding = 16;
    
    // For viewport positioning, use full viewport bounds
    if (useViewportPositioning) {
      const spaceOnRight = window.innerWidth - buttonRect.right - padding;
      const spaceOnLeft = buttonRect.left - padding;
      const spaceAbove = buttonRect.top - padding;
      const spaceBelow = window.innerHeight - buttonRect.bottom - padding;
      
      // Determine horizontal position based on message type and available space
      let alignRight = false;
      
      if (isOwnMessage) {
        // For own messages, prefer left side of plus button
        alignRight = spaceOnLeft >= pickerWidth;
        if (!alignRight && spaceOnRight < pickerWidth) {
          alignRight = true; // Force left if no space on right either
        }
      } else {
        // For others' messages, prefer right side of plus button
        alignRight = spaceOnRight < pickerWidth && spaceOnLeft >= pickerWidth;
      }
      
      // Determine vertical position - prefer above if there's space
      const bottom = spaceAbove >= pickerHeight || spaceAbove > spaceBelow;
      
      setPickerPosition({ bottom, right: alignRight, buttonRect });
    } else {
      // Calculate available space within bounds
      const spaceOnRight = bounds.right - buttonRect.right - padding;
      const spaceOnLeft = buttonRect.left - bounds.left - padding;
      const spaceAbove = buttonRect.top - bounds.top - padding;
      const spaceBelow = bounds.bottom - buttonRect.bottom - padding;
      
      // Determine horizontal position based on message type and available space
      let alignRight = false; // This controls CSS positioning (right-0 vs left-0)
      
      if (isOwnMessage) {
        // For own messages, we want picker to appear on LEFT side of plus button
        // So we use right-0 positioning (align picker's right edge to button's left edge)
        alignRight = true;
        // But if there's not enough space on the left, fallback to normal left positioning
        if (spaceOnLeft < pickerWidth && spaceOnRight >= pickerWidth) {
          alignRight = false;
        }
      } else {
        // For others' messages, we want picker to appear on RIGHT side of plus button  
        // So we use left-0 positioning (align picker's left edge to button's right edge)
        alignRight = false;
        // But if there's not enough space on the right, fallback to right positioning
        if (spaceOnRight < pickerWidth && spaceOnLeft >= pickerWidth) {
          alignRight = true;
        }
      }
      
      // Determine vertical position - prefer above if there's space
      const bottom = spaceAbove >= pickerHeight || spaceAbove > spaceBelow;
      
      setPickerPosition({ bottom, right: alignRight });
    }
  };

  // Handle click outside for emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      // For viewport positioning, we need to check if the click is outside the picker
      // Since it's rendered in a portal, we can't use the ref container
      if (useViewportPositioning) {
        const pickerElement = document.querySelector(`[style*="z-index: ${zIndex + 10}"]`);
        if (
          pickerElement &&
          !pickerElement.contains(event.target) &&
          plusButtonRef.current &&
          !plusButtonRef.current.contains(event.target)
        ) {
          setShowEmojiPicker(false);
        }
      } else {
        if (
          emojiPickerRef.current &&
          !emojiPickerRef.current.contains(event.target) &&
          plusButtonRef.current &&
          !plusButtonRef.current.contains(event.target)
        ) {
          setShowEmojiPicker(false);
        }
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEmojiPicker, useViewportPositioning, zIndex]);

  // Group reactions by emoji
  const groupedReactions = (reactions || []).reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        users: [],
        hasCurrentUser: false,
      };
    }
    acc[reaction.emoji].count++;
    acc[reaction.emoji].users.push(reaction.user_name);
    if (reaction.user_id === currentUserId) {
      acc[reaction.emoji].hasCurrentUser = true;
    }
    return acc;
  }, {});

  const reactionGroups = Object.values(groupedReactions);

  // Always show the add reaction button, even if no reactions exist
  const hasReactions = reactionGroups.length > 0;

  return (
    <div
      className={`flex items-center gap-2 mt-1 flex-wrap ${
        isOwnMessage ? "justify-end" : "justify-start"
      }`}
    >
      {hasReactions &&
        reactionGroups.map((group) => (
          <button
            key={group.emoji}
            onClick={() => onReactionClick(group.emoji)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border-2 transition-all duration-200 transform hover:scale-105 cursor-pointer ${
              group.hasCurrentUser
                ? theme === "dark"
                  ? "bg-gradient-to-r from-purple-500/30 to-blue-500/30 border-purple-400/50 text-purple-200 shadow-md"
                  : "bg-gradient-to-r from-blue-100 to-purple-100 border-blue-300 text-blue-800 shadow-md"
                : theme === "dark"
                ? "bg-white/10 border-white/20 text-white/90 hover:bg-white/20 hover:border-white/30 shadow-sm"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
            }`}
            title={`${group.users.join(", ")} reacted with ${group.emoji}`}
          >
            <span className="text-base">{group.emoji}</span>
            <span className="font-semibold">{group.count}</span>
          </button>
        ))}

      {/* Add reaction button - always visible */}
      <div className="relative" ref={emojiPickerRef}>
        <button
          ref={plusButtonRef}
          onClick={() => {
            calculatePickerPosition();
            setShowEmojiPicker(!showEmojiPicker);
          }}
          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 transform hover:scale-110 shadow-sm cursor-pointer opacity-0 group-hover:opacity-100 ${
            theme === "dark"
              ? "bg-white/10 border-white/20 text-white/70 hover:bg-purple-500/30 hover:border-purple-400/50 hover:text-purple-300"
              : "bg-white border-gray-200 text-gray-500 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600"
          }`}
          title="Add reaction"
        >
          <Plus size={14} />
        </button>

        {showEmojiPicker && (
          useViewportPositioning ? (
            // Use portal for viewport positioning to avoid container clipping
            createPortal(
              <div 
                className="fixed"
                style={{
                  // Ensure picker never goes off-screen horizontally
                  maxWidth: 'min(320px, 90vw)',
                  // Use dynamic z-index (much higher for meeting chats)
                  zIndex: zIndex + 10,
                  // Fixed positioning relative to viewport
                  ...(pickerPosition.buttonRect ? {
                    ...(pickerPosition.bottom ? {
                      bottom: window.innerHeight - pickerPosition.buttonRect.top + 8
                    } : {
                      top: pickerPosition.buttonRect.bottom + 8
                    }),
                    ...(isOwnMessage ? {
                      // For own messages, position picker to the left of the button
                      right: window.innerWidth - pickerPosition.buttonRect.left + 8
                    } : {
                      // For others' messages, position picker to the right of the button but closer
                      left: pickerPosition.buttonRect.left - 16
                    })
                  } : {})
                }}
              >
                <EmojiPicker
                  onEmojiSelect={(emoji) => {
                    onReactionClick(emoji);
                    setShowEmojiPicker(false);
                  }}
                />
              </div>,
              document.body
            )
          ) : (
            // Regular absolute positioning within container
            <div 
              className="absolute"
              style={{
                // Ensure picker never goes off-screen horizontally
                maxWidth: 'min(320px, 90vw)',
                // Use dynamic z-index
                zIndex: zIndex + 10,
                // Relative positioning within container
                ...(pickerPosition.bottom ? { bottom: '100%', marginBottom: '8px' } : { top: '100%', marginTop: '8px' }),
                ...(pickerPosition.right ? { right: 0 } : { left: 0 }),
                // For right positioning on own messages, we want the picker to appear to the left
                ...(isOwnMessage && pickerPosition.right ? {
                  transform: 'translateX(-100%)',
                  right: 'auto',
                  left: '0'
                } : {})
              }}
            >
              <EmojiPicker
                onEmojiSelect={(emoji) => {
                  onReactionClick(emoji);
                  setShowEmojiPicker(false);
                }}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MessageReactions;
