import React, { useState, useRef, useEffect } from 'react';
import IconWrapper from './IconWrapper';
import { SectionId } from '../../types/core';

export interface Section {
    id: SectionId;
    label: string;
}

interface ResponsiveWorkflowSelectorProps {
    sections: Section[];
    activeSection: SectionId;
    onSectionChange: (sectionId: SectionId) => void;
    className?: string;
}

const ResponsiveWorkflowSelector: React.FC<ResponsiveWorkflowSelectorProps> = ({
    sections,
    activeSection,
    onSectionChange,
    className = ''
}) => {
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const checkScrollButtons = () => {
        if (!scrollContainerRef.current || !containerRef.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
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
        checkScrollButtons();
        window.addEventListener('resize', checkScrollButtons);
        return () => window.removeEventListener('resize', checkScrollButtons);
    }, []);

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
                <div className="flex p-2 space-x-1 min-w-max">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            data-section={section.id}
                            onClick={() => onSectionChange(section.id)}
                            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 whitespace-nowrap ${activeSection === section.id
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            {section.label}
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

export default ResponsiveWorkflowSelector; 