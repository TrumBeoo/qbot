import { useEffect, useState, useRef } from 'react';
import { Text } from '@chakra-ui/react';
import './TypingText.css';

function TypingText({ text, speed = 30, chunkSize = 5, onDone, ...textProps }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsComplete(true);
      return;
    }

    setDisplayedText('');
    setIsComplete(false);
    indexRef.current = 0;

    const typeNextChunk = () => {
      if (indexRef.current < text.length) {
        const nextChunk = text.slice(indexRef.current, indexRef.current + chunkSize);
        setDisplayedText(prev => prev + nextChunk);
        indexRef.current += chunkSize;
        timeoutRef.current = setTimeout(typeNextChunk, speed);
      } else {
        setIsComplete(true);
        if (onDone) onDone();
      }
    };

    typeNextChunk();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, chunkSize, onDone]);

  return (
    <Text
      whiteSpace="pre-wrap"
      fontSize="md"
      lineHeight="1.6"
      fontFamily="inherit"
      {...textProps}
    >
      {displayedText}
      {!isComplete && <Text as="span" className="typing-cursor">|</Text>}
    </Text>
  );
}

export default TypingText;
