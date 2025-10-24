import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

const ScrambleText = ({
  text,
  className = "",
  scrambleChars = "!@#$%^&*)<>?_{}[]/+-",
  trigger = "load",
  delay = 0.8, // Default delay to coordinate with hero animation
}) => {
  const textRef = useRef();
  const originalText = text;

  useGSAP(
    () => {
      const element = textRef.current;
      let scrambleInterval;

      // Start with invisible text but preserve layout
      gsap.set(element, { opacity: 0 });
      // Set initial content to preserve width
      element.textContent = originalText;

      const scrambleEffect = () => {
        // Make text visible when scramble starts
        gsap.set(element, { opacity: 1 });

        const chars = originalText.split("");
        let iterations = 0;

        scrambleInterval = setInterval(() => {
          element.textContent = chars
            .map((char, index) => {
              if (index < iterations) {
                return originalText[index];
              }
              // Preserve spaces and punctuation, only scramble letters
              if (char === " ") return " ";
              if (char === ".") return ".";
              // Use similar width characters
              return scrambleChars[
                Math.floor(Math.random() * scrambleChars.length)
              ];
            })
            .join("");

          if (iterations >= originalText.length) {
            clearInterval(scrambleInterval);
            element.textContent = originalText;
          }

          iterations += 1 / 3;
        }, 50);
      };

      if (trigger === "load") {
        // Start scramble effect after specified delay
        gsap.delayedCall(delay, scrambleEffect);
      } else if (trigger === "hover") {
        // For hover, make visible immediately and add event listener
        gsap.set(element, { opacity: 1 });
        element.addEventListener("mouseenter", scrambleEffect);
      }

      return () => {
        if (scrambleInterval) clearInterval(scrambleInterval);
        if (trigger === "hover") {
          element.removeEventListener("mouseenter", scrambleEffect);
        }
      };
    },
    { scope: textRef }
  );

  return (
    <span ref={textRef} className={className}>
      {text}
    </span>
  );
};

export default ScrambleText;
