import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date | undefined | null): string {
    if (!value) return '';

    const d = typeof value === 'string' && !value.endsWith('Z') && !value.includes('+') 
      ? new Date(value + 'Z') 
      : new Date(value);
    
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    // Fallback for future dates due to small clock desync
    if (diff < 0) return 'just now';

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }
}
