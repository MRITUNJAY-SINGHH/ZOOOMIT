import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import { typography } from '../constants/theme';

const DEFAULT_KEYWORDS = [
  'groceries',
  'aata',
  'milk',
  'fresh fruits',
  'paneer',
  'vegetables',
  'snacks & sweets',
  'pure ghee'
];

export const TypewriterSearch = ({
  prefix = 'Search ',
  keywords = DEFAULT_KEYWORDS,
  style,
  prefixStyle,
  wordStyle,
  showCursor = true,
  typeSpeed = 85,
  deleteSpeed = 45,
  pauseDelay = 1800
}) => {
  const [displayText, setDisplayText] = useState(keywords[0] || '');
  const [cursorVisible, setCursorVisible] = useState(true);

  const stateRef = useRef({
    wordIndex: 0,
    charIndex: (keywords[0] || '').length,
    isDeleting: false,
    timeoutId: null
  });

  // Typing & deleting loop
  useEffect(() => {
    let active = true;

    const step = () => {
      if (!active) return;
      const { wordIndex, charIndex, isDeleting } = stateRef.current;
      const currentWord = keywords[wordIndex % keywords.length] || '';

      if (!isDeleting) {
        if (charIndex < currentWord.length) {
          const nextIndex = charIndex + 1;
          stateRef.current.charIndex = nextIndex;
          setDisplayText(currentWord.slice(0, nextIndex));
          stateRef.current.timeoutId = setTimeout(step, typeSpeed);
        } else {
          // Finished typing word, hold for reading
          stateRef.current.isDeleting = true;
          stateRef.current.timeoutId = setTimeout(step, pauseDelay);
        }
      } else {
        if (charIndex > 0) {
          const nextIndex = charIndex - 1;
          stateRef.current.charIndex = nextIndex;
          setDisplayText(currentWord.slice(0, nextIndex));
          stateRef.current.timeoutId = setTimeout(step, deleteSpeed);
        } else {
          // Finished deleting, switch to next word
          stateRef.current.isDeleting = false;
          stateRef.current.wordIndex = (wordIndex + 1) % keywords.length;
          stateRef.current.timeoutId = setTimeout(step, 240);
        }
      }
    };

    // Begin after initial hold
    stateRef.current.isDeleting = true;
    stateRef.current.timeoutId = setTimeout(step, pauseDelay);

    return () => {
      active = false;
      if (stateRef.current.timeoutId) {
        clearTimeout(stateRef.current.timeoutId);
      }
    };
  }, [keywords, typeSpeed, deleteSpeed, pauseDelay]);

  // Cursor blink
  useEffect(() => {
    if (!showCursor) return;
    const cursorInterval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, [showCursor]);

  return (
    <Text style={[styles.defaultText, style]} numberOfLines={1}>
      <Text style={[styles.prefixText, prefixStyle]}>{prefix}</Text>
      <Text style={[styles.wordText, wordStyle]}>{displayText}</Text>
      {showCursor && (
        <Text style={[styles.cursorText, { opacity: cursorVisible ? 0.75 : 0 }]}>|</Text>
      )}
    </Text>
  );
};

const styles = StyleSheet.create({
  defaultText: {
    fontSize: 14,
    fontFamily: typography?.family?.regular || 'Inter-Regular',
    color: '#64748B'
  },
  prefixText: {
    fontFamily: typography?.family?.regular || 'Inter-Regular',
    color: '#64748B'
  },
  wordText: {
    fontFamily: typography?.family?.regular || 'Inter-Regular',
    color: '#64748B'
  },
  cursorText: {
    fontSize: 14,
    color: '#FFC928',
    fontWeight: 'bold',
    marginLeft: 1
  }
});

export default TypewriterSearch;
