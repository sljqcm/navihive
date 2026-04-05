/**
 * Highlighted Text Component
 * Renders text with highlighted search matches
 */

import React from 'react';
import { Box } from '@mui/material';

interface HighlightedTextProps {
  text: string;
  query: string;
  highlightStyle?: React.CSSProperties;
}

/**
 * Find all occurrences of query in text (case-insensitive)
 */
function findMatches(text: string, query: string): Array<{ start: number; end: number }> {
  if (!text || !query) return [];

  const matches: Array<{ start: number; end: number }> = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let startIndex = 0;
  while (startIndex < text.length) {
    const index = lowerText.indexOf(lowerQuery, startIndex);
    if (index === -1) break;

    matches.push({
      start: index,
      end: index + query.length,
    });

    startIndex = index + query.length;
  }

  return matches;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, query, highlightStyle }) => {
  if (!text) return null;
  if (!query) return <>{text}</>;

  const matches = findMatches(text, query);

  if (matches.length === 0) {
    return <>{text}</>;
  }

  const defaultHighlightStyle: React.CSSProperties = {
    backgroundColor: 'primary.main',
    color: 'primary.contrastText',
    padding: '0 2px',
    borderRadius: '2px',
    fontWeight: 'bold',
  };

  const finalStyle = highlightStyle || defaultHighlightStyle;

  // Build segments
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;

  matches.forEach((match, index) => {
    // Add text before match
    if (match.start > lastIndex) {
      segments.push(
        <React.Fragment key={`text-${index}`}>{text.slice(lastIndex, match.start)}</React.Fragment>
      );
    }

    // Add highlighted match
    segments.push(
      <Box component='span' key={`match-${index}`} sx={finalStyle}>
        {text.slice(match.start, match.end)}
      </Box>
    );

    lastIndex = match.end;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push(<React.Fragment key='text-end'>{text.slice(lastIndex)}</React.Fragment>);
  }

  return <>{segments}</>;
};

export default HighlightedText;
