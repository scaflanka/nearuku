import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * A hook to smoothly animate a displayed speed value to a target speed.
 * Optimized for high-frequency (1-2 Hz) GPS speed updates.
 * 
 * @param apiSpeed The target speed value in km/h.
 * @param duration The animation transition duration in milliseconds (default: 600ms).
 */
export const useSmoothSpeed = (apiSpeed: number, duration: number = 600) => {
  const [displaySpeed, setDisplaySpeed] = useState(0);

  const currentDisplayRef = useRef(0);
  const requestRef = useRef<number | undefined>(undefined);

  const animate = useCallback(
    (from: number, to: number, startTime: number, time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Cubic ease-out for a premium, organic fluid transition
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const next = from + (to - from) * easedProgress;
      const rounded = Math.round(next);

      currentDisplayRef.current = rounded;
      setDisplaySpeed(rounded);

      if (progress < 1) {
        requestRef.current = requestAnimationFrame((t) =>
          animate(from, to, startTime, t)
        );
      }
    },
    [duration]
  );

  useEffect(() => {
    // High-frequency GPS updates are already filtered natively by Mapbox.
    // We immediately trigger the smooth transition to the new target.
    const finalTarget = apiSpeed;

    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }

    const snapStart = currentDisplayRef.current;
    const startTime = performance.now();

    requestRef.current = requestAnimationFrame((t) =>
      animate(snapStart, finalTarget, startTime, t)
    );

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [apiSpeed, animate]);

  return displaySpeed;
};
