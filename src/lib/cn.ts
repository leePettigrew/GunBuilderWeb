import { clsx, type ClassValue } from "clsx";

/** Class name combiner — the one true way to build conditional classes. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
