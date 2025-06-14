import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Box, IconButton, Tooltip } from '@mui/material';
import { FastForward as FastForwardIcon } from '@mui/icons-material';

interface StreamingTextProps {
  text: string;
  speed?: number; // milliseconds per character
  onComplete?: () => void;
  variant?: 'body1' | 'body2' | 'h6' | 'subtitle1';
  sx?: any;
  enableFormatting?: boolean; // Enable basic markdown-like formatting
  showSkipButton?: boolean; // Show skip animation button
}

const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  speed = 25, // Slightly faster for better UX
  onComplete,
  variant = 'body1',
  sx = {},
  enableFormatting = true,
  showSkipButton = true
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  // Skip animation and show full text
  const skipAnimation = useCallback(() => {
    setDisplayedText(text);
    setCurrentIndex(text.length);
    setIsComplete(true);
    setIsSkipped(true);
    onComplete?.();
  }, [text, onComplete]);

  // Format text with basic markdown-like styling
  const formatText = useCallback((text: string) => {
    if (!enableFormatting) return text;
    
    // Split text into parts and format
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\n)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Bold text
        return (
          <Box component="span" key={index} sx={{ fontWeight: 'bold' }}>
            {part.slice(2, -2)}
          </Box>
        );
      } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        // Italic text
        return (
          <Box component="span" key={index} sx={{ fontStyle: 'italic' }}>
            {part.slice(1, -1)}
          </Box>
        );
      } else if (part.startsWith('`') && part.endsWith('`')) {
        // Code text
        return (
          <Box 
            component="span" 
            key={index} 
            sx={{ 
              fontFamily: 'monospace',
              backgroundColor: 'grey.100',
              padding: '2px 4px',
              borderRadius: '4px',
              fontSize: '0.9em'
            }}
          >
            {part.slice(1, -1)}
          </Box>
        );
      } else if (part === '\n') {
        // Line break
        return <br key={index} />;
      } else {
        // Regular text
        return part;
      }
    });
  }, [enableFormatting]);

  useEffect(() => {
    if (isSkipped) return;
    
    if (currentIndex < text.length) {
      // Variable speed based on character type
      let charSpeed = speed;
      const currentChar = text[currentIndex];
      
      // Slower for punctuation to create natural pauses
      if (['.', '!', '?'].includes(currentChar)) {
        charSpeed = speed * 3;
      } else if ([',', ';', ':'].includes(currentChar)) {
        charSpeed = speed * 2;
      } else if (currentChar === ' ') {
        charSpeed = speed * 0.5; // Faster for spaces
      }

      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, charSpeed);

      return () => clearTimeout(timer);
    } else if (currentIndex === text.length && !isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, onComplete, isComplete, isSkipped]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
    setIsSkipped(false);
  }, [text]);

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      {/* Skip Button */}
      {showSkipButton && !isComplete && displayedText.length > 50 && (
        <Box sx={{ position: 'absolute', top: -8, right: -8, zIndex: 1 }}>
          <Tooltip title="Skip animation">
            <IconButton 
              size="small" 
              onClick={skipAnimation}
              sx={{ 
                backgroundColor: 'background.paper',
                boxShadow: 1,
                '&:hover': { backgroundColor: 'grey.100' }
              }}
            >
              <FastForwardIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Typography 
        variant={variant} 
        component="div"
        sx={{ 
          lineHeight: 1.7, 
          whiteSpace: 'pre-wrap',
          minHeight: '1.5em', // Prevent layout shift
          '& p': { margin: 0, marginBottom: 1 },
          '& ul, & ol': { marginLeft: 2, marginBottom: 1 },
          '& li': { marginBottom: 0.5 }
        }}
      >
        {enableFormatting ? formatText(displayedText) : displayedText}
        {!isComplete && (
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              width: '2px',
              height: '1.2em',
              backgroundColor: 'primary.main',
              marginLeft: '2px',
              animation: 'blink 1s infinite',
              verticalAlign: 'text-bottom',
              '@keyframes blink': {
                '0%, 50%': { opacity: 1 },
                '51%, 100%': { opacity: 0 },
              },
            }}
          />
        )}
      </Typography>
    </Box>
  );
};

export default StreamingText; 