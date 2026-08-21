export const timeSince = (date: Date | number | string): string => {
    let timeStamp: number;

    if (typeof date === 'number') {
        timeStamp = date;
    } else if (date instanceof Date) {
        timeStamp = date.getTime();
    } else {
        timeStamp = new Date(date).getTime();
    }
    
    if (isNaN(timeStamp)) {
        return "";
    }

    const seconds = Math.floor((new Date().getTime() - timeStamp) / 1000);
    
    if (seconds < 5) return "just now";

    let interval = seconds / 31536000;
    if (interval > 1) {
        const years = Math.floor(interval);
        return `${years} year${years > 1 ? 's' : ''} ago`;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        const months = Math.floor(interval);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    interval = seconds / 86400;
    if (interval >= 1) {
        const days = Math.floor(interval);
        if (days === 1) return "yesterday";
        return `${days} days ago`;
    }
    interval = seconds / 3600;
    if (interval > 1) {
        const hours = Math.floor(interval);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    interval = seconds / 60;
    if (interval > 1) {
        const minutes = Math.floor(interval);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    return Math.floor(seconds) + " seconds ago";
};