import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  cursorClassName?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 50,
  delay = 500,
  className = '',
  cursorClassName = 'w-[2px] h-[1em] bg-black inline-block align-middle ml-[2px]'
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const timeoutId = setTimeout(() => {
      setIsTyping(true);
      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(intervalId);
          setIsTyping(false);
        }
      }, speed);

      // Clean up interval if component unmounts while typing
      return () => clearInterval(intervalId);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [isVisible, text, speed, delay]);

  return (
    <span className={className} ref={containerRef}>
      {displayedText}
      {/* Blinking cursor effect */ }
      <span 
        className={`${cursorClassName} ${isTyping ? 'opacity-100' : 'animate-pulse opacity-70'}`}
        style={{ display: isVisible ? 'inline-block' : 'none' }}
      ></span>
    </span>
  );
};
