/**
 * Returns a debounced copy of a value that only updates after the caller
 * has stopped changing it for the specified delay.
 * Used to prevent a search API call firing on every keystroke.
 */
import { useEffect, useState } from 'react';

/**
 * Debounces a rapidly-changing value.
 * Input: value to track and debounce delay in milliseconds.
 * Output: the last stable value after the delay has passed.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
