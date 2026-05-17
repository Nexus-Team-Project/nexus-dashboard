/**
 * cn: merges Tailwind CSS class names, resolving conflicts via tailwind-merge.
 * Accepts any mix of strings, undefined, false, and arrays (via clsx).
 * Input: any number of class values (string | undefined | false | null).
 * Output: merged class string with Tailwind conflicts resolved.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
