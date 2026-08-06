import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency: string = 'ر.س') {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${val.toLocaleString('ar-SA')} ${currency}`;
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
