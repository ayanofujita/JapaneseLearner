import { useState, useEffect, useRef } from "react";
import { PlayIcon, RotateCcw } from "lucide-react";

interface KanjiStrokeAnimationProps {
  kanji: string;
  size?: number;
  strokeColor?: string;
  strokeWidth?: number;
  animationDuration?: number;
}

export default function KanjiStrokeAnimation({
  kanji,
  size = 120,
  strokeColor = "currentColor",
  strokeWidth = 3,
  animationDuration = 1.5,
}: KanjiStrokeAnimationProps) {
  const [loading, setLoading] = useState(true);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const animationTimeouts = useRef<number[]>([]);

  // Clear all animation timeouts when component unmounts
  useEffect(() => {
    return () => {
      animationTimeouts.current.forEach((id) => window.clearTimeout(id));
      animationTimeouts.current = [];
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setSvgContent(null);
    setIsPlaying(false);
    setHasPlayed(false);

    // Clear any existing timeouts
    animationTimeouts.current.forEach((id) => window.clearTimeout(id));
    animationTimeouts.current = [];

    const fetchSvg = async () => {
      try {
        // Get kanji code point in hex
        const kanjiCode = kanji.charCodeAt(0).toString(16).padStart(5, "0");

        // Fetch SVG directly from GitHub
        const githubUrl = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${kanjiCode}.svg`;

        const response = await fetch(githubUrl);

        if (!response.ok) {
          setLoading(false);
          return;
        }

        // Get the SVG text content
        const svgText = await response.text();

        // Extract just the SVG element using regex
        const svgMatch = svgText.match(/<svg[^>]*>[\s\S]*<\/svg>/);

        if (!svgMatch) {
          console.error("Could not extract SVG element from response");
          setLoading(false);
          return;
        }

        // Get the matched SVG
        const extractedSvg = svgMatch[0];

        // Process the SVG to add classes for animation
        let processedSvg = extractedSvg
          // Set width and height
          .replace(/width="[^"]+"/, `width="${size}"`)
          .replace(/height="[^"]+"/, `height="${size}"`)
          // Add stroke path class
          .replace(/<path /g, '<path class="kanji-stroke" ')
          // Add number text class
          .replace(/<text /g, '<text class="stroke-number" ');

        setSvgContent(processedSvg);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching kanji SVG:", err);
        setLoading(false);
      }
    };

    fetchSvg();
  }, [kanji, size]);

  const playAnimation = () => {
    // Clear any existing timeouts
    animationTimeouts.current.forEach((id) => window.clearTimeout(id));
    animationTimeouts.current = [];

    setIsPlaying(true);

    // Find all stroke paths and animate them sequentially
    setTimeout(() => {
      const paths = document.querySelectorAll(".kanji-stroke");
      const numbers = document.querySelectorAll(".stroke-number");

      // Reset all paths and numbers
      paths.forEach((path) => {
        // Reset the path
        path.removeAttribute("style");
        path.setAttribute(
          "style",
          `
          fill: none;
          stroke: ${strokeColor};
          stroke-width: ${strokeWidth};
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
        `,
        );
      });

      numbers.forEach((text) => {
        text.setAttribute("style", "opacity: 0;");
      });

      // Animate each path
      paths.forEach((path, index) => {
        // Animate this path after a delay based on its index
        const timeoutId = window.setTimeout(
          () => {
            path.style.transition = `stroke-dashoffset ${animationDuration}s ease`;
            path.style.strokeDashoffset = "0";

            // Show the corresponding number
            if (numbers[index]) {
              numbers[index].style.transition = "opacity 0.5s ease";
              numbers[index].style.opacity = "1";
            }

            // When last stroke is done, set playing to false
            if (index === paths.length - 1) {
              const finalTimeoutId = window.setTimeout(
                () => {
                  setIsPlaying(false);
                  setHasPlayed(true);
                },
                animationDuration * 1000 + 100,
              );
              animationTimeouts.current.push(finalTimeoutId);
            }
          },
          index * ((animationDuration * 1000) / 2),
        );

        animationTimeouts.current.push(timeoutId);
      });
    }, 100);
  };

  // If no SVG content is available, just display the kanji character
  if (!svgContent && !loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.7,
        }}
      >
        {kanji}
      </div>
    );
  }

  return (
    <div
      className="relative kanji-animation-wrapper"
      style={{ width: size, height: size }}
    >
      <style>
        {`
          @keyframes drawStroke {
            to {
              stroke-dashoffset: 0;
            }
          }

          .animation-button {
            position: absolute;
            top: 5px;
            right: 5px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background 0.2s ease;
            z-index: 10;
          }

          .animation-button:hover {
            background: rgba(0, 0, 0, 0.2);
          }

          .animation-button svg {
            width: 16px;
            height: 16px;
          }

          .play-full-button {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 8px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s ease;
            z-index: 5;
          }

          .kanji-animation-wrapper:hover .play-full-button {
            opacity: 1;
          }
        `}
      </style>

      {loading ? (
        <div className="flex items-center justify-center text-muted-foreground h-full w-full">
          <span className="text-sm">Loading...</span>
        </div>
      ) : (
        <div className="kanji-animation-container">
          <div dangerouslySetInnerHTML={{ __html: svgContent || "" }} />

          {!isPlaying && !hasPlayed && (
            <div
              onClick={playAnimation}
              className="play-full-button"
              aria-label="Play animation"
            >
              <PlayIcon className="w-12 h-12 text-primary opacity-80" />
            </div>
          )}

          {(isPlaying || hasPlayed) && (
            <button
              onClick={playAnimation}
              className="animation-button"
              aria-label="Replay animation"
            >
              <RotateCcw className="text-primary" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
