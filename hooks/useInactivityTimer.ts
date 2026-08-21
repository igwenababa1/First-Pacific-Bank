import { useEffect, useRef } from 'react';

/**
 * A custom hook that detects user inactivity and triggers a callback.
 * @param onIdle The function to call when the user is idle.
 * @param idleTime The amount of time in milliseconds to wait before considering the user idle.
 * @param enabled A boolean to enable or disable the timer.
 */
export const useInactivityTimer = (onIdle: () => void, idleTime: number, enabled: boolean = true) => {
    const timeoutId = useRef<number | null>(null);

    const resetTimer = () => {
        if (timeoutId.current) {
            window.clearTimeout(timeoutId.current);
        }
        timeoutId.current = window.setTimeout(onIdle, idleTime);
    };

    const handleActivity = () => {
        resetTimer();
    };

    useEffect(() => {
        if (!enabled) {
            if (timeoutId.current) {
                window.clearTimeout(timeoutId.current);
            }
            return;
        }

        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
        
        resetTimer();

        events.forEach(event => window.addEventListener(event, handleActivity));

        // Cleanup function
        return () => {
            if (timeoutId.current) {
                window.clearTimeout(timeoutId.current);
            }
            events.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, [onIdle, idleTime, enabled]);
};