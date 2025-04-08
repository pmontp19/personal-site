/**
 * Calculate reading time for a given text
 * @param content The content to calculate reading time for
 * @param wordsPerMinute Reading speed in words per minute (default: 225)
 * @returns Reading time in minutes as a string with "min" suffix
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 225): string {
  // Remove HTML tags if present
  const cleanText = content.replace(/<\/?[^>]+(>|$)/g, '');
  
  // Count words by splitting on whitespace
  const words = cleanText.trim().split(/\s+/).length;
  
  // Calculate reading time in minutes
  const minutes = Math.max(1, Math.round(words / wordsPerMinute));
  
  return `${minutes} min`;
}