import React, { useState, useRef, useEffect } from 'react';
import IconWrapper from './IconWrapper';
import { IconType } from 'react-icons';

export interface TabSection {
    id: string;
    label: string;
    icon: IconType;
    className?: string; // Optional custom className for styling
}

export interface ResponsiveTabSelectorProps {
    sections: TabSection[];
    activeSection: string;
    onSectionChange: (sectionId: string) => void;
    className?: string;
    useCustomStyling?: boolean; // Flag to use custom styling instead of default
}

const ResponsiveTabSelector: React.FC<ResponsiveTabSelectorProps> = ({
    sections,
    activeSection,
    onSectionChange,
    className = '',
    useCustomStyling = false
}) => {
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const checkScrollButtons = () => {
        if (!scrollContainerRef.current || !containerRef.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

        // Only show arrows if there's actually content to scroll
        const hasScrollableContent = scrollWidth > clientWidth;

        setShowLeftArrow(hasScrollableContent && scrollLeft > 0);
        setShowRightArrow(hasScrollableContent && scrollLeft < scrollWidth - clientWidth - 2);
    };

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        // Small delay to ensure DOM has updated
        const timer = setTimeout(() => {
            checkScrollButtons();
        }, 0);

        window.addEventListener('resize', checkScrollButtons);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkScrollButtons);
        };
    }, [sections]); // Re-check when sections change

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', checkScrollButtons);
            return () => scrollContainer.removeEventListener('scroll', checkScrollButtons);
        }
        return undefined;
    }, [checkScrollButtons]);

    // Auto-scroll to active section when it changes
    useEffect(() => {
        if (scrollContainerRef.current) {
            const activeButton = scrollContainerRef.current.querySelector(`[data-section="${activeSection}"]`) as HTMLElement;
            if (activeButton) {
                const container = scrollContainerRef.current;
                const buttonLeft = activeButton.offsetLeft;
                const buttonWidth = activeButton.offsetWidth;
                const containerWidth = container.clientWidth;
                const scrollLeft = container.scrollLeft;

                // Check if button is fully visible
                if (buttonLeft < scrollLeft || buttonLeft + buttonWidth > scrollLeft + containerWidth) {
                    container.scrollTo({
                        left: buttonLeft - containerWidth / 2 + buttonWidth / 2,
                        behavior: 'smooth'
                    });
                }
            }
        }
    }, [activeSection]);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Left Arrow */}
            {showLeftArrow && (
                <button
                    onClick={scrollLeft}
                    className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110 dark:bg-gray-800/90 dark:hover:bg-gray-800"
                    aria-label="Scroll left"
                >
                    <IconWrapper icon="←" size="sm" className="text-gray-600 dark:text-gray-300" />
                </button>
            )}

            {/* Right Arrow */}
            {showRightArrow && (
                <button
                    onClick={scrollRight}
                    className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110 dark:bg-gray-800/90 dark:hover:bg-gray-800"
                    aria-label="Scroll right"
                >
                    <IconWrapper icon="→" size="sm" className="text-gray-600 dark:text-gray-300" />
                </button>
            )}

            {/* Scroll Container */}
            <div
                ref={scrollContainerRef}
                className="overflow-x-auto scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <div className="flex justify-around p-2 space-x-1 min-w-max">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            data-section={section.id}
                            onClick={() => onSectionChange(section.id)}
                            className={`flex items-center px-6 py-3 space-x-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap ${useCustomStyling && section.className
                                ? `${section.className} ${activeSection === section.id ? "bg-opacity-100 shadow-md" : "bg-opacity-30 dark:bg-opacity-30 hover:bg-opacity-50"}`
                                : activeSection === section.id
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                        >
                            <IconWrapper icon={section.icon} size="sm" />
                            <span>{section.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom scrollbar styles */}
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default ResponsiveTabSelector; 