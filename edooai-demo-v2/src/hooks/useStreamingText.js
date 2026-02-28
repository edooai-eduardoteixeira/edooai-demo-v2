import { useState, useRef, useCallback } from 'react';

export function useStreamingText() {
  const [lines, setLines] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [actionTrigger, setActionTrigger] = useState(null);
  const cancelRef = useRef(false);

  const streamSequence = useCallback(async (sequence) => {
    setIsStreaming(true);
    cancelRef.current = false;

    for (const item of sequence) {
      if (cancelRef.current) break;

      if (item.type === 'pause') {
        await new Promise((r) => setTimeout(r, item.duration));
      } else if (item.type === 'action') {
        setActionTrigger(item.action);
        // Small delay for the action to register
        await new Promise((r) => setTimeout(r, 100));
      } else if (item.type === 'text') {
        // Stream text character by character
        const text = item.text;
        const charDelay = item.duration / text.length;

        let built = '';
        for (let i = 0; i < text.length; i++) {
          if (cancelRef.current) break;
          built += text[i];
          setCurrentText(built);
          await new Promise((r) => setTimeout(r, charDelay));
        }

        // Move completed text to lines
        setLines((prev) => [...prev, text]);
        setCurrentText('');
      }
    }

    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setLines([]);
    setCurrentText('');
    setIsStreaming(false);
    setActionTrigger(null);
  }, []);

  return {
    lines,
    currentText,
    isStreaming,
    actionTrigger,
    streamSequence,
    reset,
  };
}
