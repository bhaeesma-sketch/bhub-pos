import { useEffect, useRef } from 'react';

/**
 * Premium Smooth Scroll Hook with Momentum & Easing
 * Provides buttery-smooth scrolling with physics-based momentum
 */
export function useSmoothScroll(containerRef: React.RefObject<HTMLElement>, options?: {
    friction?: number;
    acceleration?: number;
    maxSpeed?: number;
}) {
    const {
        friction = 0.92,
        acceleration = 0.15,
        maxSpeed = 50
    } = options || {};

    const velocityRef = useRef(0);
    const targetScrollRef = useRef(0);
    const currentScrollRef = useRef(0);
    const rafRef = useRef<number>();

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let isScrolling = false;
        let scrollTimeout: NodeJS.Timeout;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();

            // Add velocity based on wheel delta
            velocityRef.current += e.deltaY * acceleration;

            // Clamp velocity to max speed
            velocityRef.current = Math.max(
                -maxSpeed,
                Math.min(maxSpeed, velocityRef.current)
            );

            // Start animation if not already running
            if (!isScrolling) {
                isScrolling = true;
                animate();
            }

            // Reset scrolling flag after delay
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
            }, 100);
        };

        const animate = () => {
            // Apply friction
            velocityRef.current *= friction;

            // Update target scroll position
            targetScrollRef.current += velocityRef.current;

            // Clamp to container bounds
            const maxScroll = container.scrollHeight - container.clientHeight;
            targetScrollRef.current = Math.max(0, Math.min(maxScroll, targetScrollRef.current));

            // Smooth interpolation to target
            const diff = targetScrollRef.current - currentScrollRef.current;
            currentScrollRef.current += diff * 0.1;

            // Apply scroll
            container.scrollTop = currentScrollRef.current;

            // Continue animation if velocity is significant
            if (Math.abs(velocityRef.current) > 0.1 || Math.abs(diff) > 0.1) {
                rafRef.current = requestAnimationFrame(animate);
            } else {
                isScrolling = false;
                velocityRef.current = 0;
            }
        };

        // Initialize scroll position
        currentScrollRef.current = container.scrollTop;
        targetScrollRef.current = container.scrollTop;

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            clearTimeout(scrollTimeout);
        };
    }, [containerRef, friction, acceleration, maxSpeed]);
}

/**
 * Parallax Scroll Effect Hook
 * Creates depth with different scroll speeds
 */
export function useParallax(speed: number = 0.5) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const handleScroll = () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * speed;
            element.style.transform = `translate3d(0, ${rate}px, 0)`;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [speed]);

    return ref;
}

/**
 * Scroll Reveal Animation Hook
 * Animates elements as they enter viewport
 */
export function useScrollReveal(options?: IntersectionObserverInit) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    element.classList.add('animate-slide-up');
                    element.style.opacity = '1';
                }
            },
            {
                threshold: 0.1,
                ...options
            }
        );

        element.style.opacity = '0';
        observer.observe(element);

        return () => observer.disconnect();
    }, [options]);

    return ref;
}

/**
 * Magnetic Button Effect Hook
 * Buttons follow cursor with smooth easing
 */
export function useMagneticEffect(strength: number = 0.3) {
    const ref = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const button = ref.current;
        if (!button) return;

        let animationFrame: number;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = button.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const deltaX = (e.clientX - centerX) * strength;
            const deltaY = (e.clientY - centerY) * strength;

            if (animationFrame) cancelAnimationFrame(animationFrame);

            animationFrame = requestAnimationFrame(() => {
                button.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            });
        };

        const handleMouseLeave = () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);

            animationFrame = requestAnimationFrame(() => {
                button.style.transform = 'translate(0, 0)';
            });
        };

        button.addEventListener('mousemove', handleMouseMove);
        button.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            button.removeEventListener('mousemove', handleMouseMove);
            button.removeEventListener('mouseleave', handleMouseLeave);
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [strength]);

    return ref;
}

/**
 * Ripple Effect Hook
 * Material Design ripple on click
 */
export function useRipple() {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const createRipple = (e: MouseEvent) => {
            const ripple = document.createElement('span');
            const rect = element.getBoundingClientRect();

            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            ripple.classList.add('ripple');

            element.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        };

        element.addEventListener('click', createRipple as EventListener);
        return () => element.removeEventListener('click', createRipple as EventListener);
    }, []);

    return ref;
}

/**
 * Stagger Animation Hook
 * Animates children with delay
 */
export function useStaggerAnimation(delay: number = 50) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = ref.current;
        if (!container) return;

        const children = Array.from(container.children) as HTMLElement[];

        children.forEach((child, index) => {
            child.style.opacity = '0';
            child.style.transform = 'translateY(20px)';

            setTimeout(() => {
                child.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                child.style.opacity = '1';
                child.style.transform = 'translateY(0)';
            }, index * delay);
        });
    }, [delay]);

    return ref;
}
