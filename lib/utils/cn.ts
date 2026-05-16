import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes intelligently.
 *
 * Combines `clsx` (conditional class composition) with `tailwind-merge`
 * (conflict resolution) so that later classes win.
 *
 * @example
 *   cn('px-4 py-2', condition && 'px-6')
 *   // → 'py-2 px-6'  (px-4 is dropped, px-6 wins)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
