import React, { useState, useRef, useEffect } from 'react';
import IconWrapper from './IconWrapper';

export interface Category {
    id: string;
    name: string;
    count: number;
}

export interface VerticalCategorySelectorProps {
    categories: Category[];
    activeCategory: string;
    onCategoryChange: (categoryId: string) => void;
    className?: string;
}

const VerticalCategorySelector: React.FC<VerticalCategorySelectorProps> = ({
    categories,
    activeCategory,
    onCategoryChange,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showTopArrow, setShowTopArrow] = useState(false);
    const [showBottomArrow, setShowBottomArrow] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const checkScrollButtons = () => {
        if (!scrollContainerRef.current || !containerRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

        setShowTopArrow(scrollTop > 0);
        setShowBottomArrow(scrollTop < scrollHeight - clientHeight - 1);
    };

    const scrollUp = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ top: -100, behavior: 'smooth' });
        }
    };

    const scrollDown = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ top: 100, behavior: 'smooth' });
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

    // Auto-scroll to active category when it changes
    useEffect(() => {
        if (scrollContainerRef.current && isExpanded) {
            const activeButton = scrollContainerRef.current.querySelector(`[data-category="${activeCategory}"]`) as HTMLElement;
            if (activeButton) {
                const container = scrollContainerRef.current;
                const buttonTop = activeButton.offsetTop;
                const buttonHeight = activeButton.offsetHeight;
                const containerHeight = container.clientHeight;
                const scrollTop = container.scrollTop;

                // Check if button is fully visible
                if (buttonTop < scrollTop || buttonTop + buttonHeight > scrollTop + containerHeight) {
                    container.scrollTo({
                        top: buttonTop - containerHeight / 2 + buttonHeight / 2,
                        behavior: 'smooth'
                    });
                }
            }
        }
    }, [activeCategory, isExpanded]);

    // Close expanded state when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        };

        if (isExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isExpanded]);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Collapsed State - Show only active category */}
            {!isExpanded && (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap text-center bg-gradient-to-b from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 cursor-pointer"
                >
                    <div className="flex flex-col items-center">
                        <span className="font-semibold">
                            {categories.find(cat => cat.id === activeCategory)?.name || 'Select Category'}
                        </span>
                        <span className="text-xs opacity-75">
                            ({categories.find(cat => cat.id === activeCategory)?.count || 0})
                        </span>
                    </div>
                </button>
            )}

            {/* Expanded State - Show all categories with scroll */}
            {isExpanded && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg z-20 overflow-visible">
                    {/* Top Arrow */}
                    {showTopArrow && (
                        <button
                            onClick={scrollUp}
                            className="absolute top-0 left-1/2 z-30 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110 dark:bg-gray-800/90 dark:hover:bg-gray-800"
                            aria-label="Scroll up"
                        >
                            <IconWrapper icon="↑" size="xs" className="text-gray-600 dark:text-gray-300" />
                        </button>
                    )}

                    {/* Bottom Arrow */}
                    {showBottomArrow && (
                        <button
                            onClick={scrollDown}
                            className="absolute bottom-0 left-1/2 z-30 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-110 dark:bg-gray-800/90 dark:hover:bg-gray-800"
                            aria-label="Scroll down"
                        >
                            <IconWrapper icon="↓" size="xs" className="text-gray-600 dark:text-gray-300" />
                        </button>
                    )}

                    {/* Scroll Container */}
                    <div
                        ref={scrollContainerRef}
                        className="overflow-y-auto scrollbar-hide max-h-32 overflow-x-visible"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <div className="flex flex-col space-y-1 p-1">
                            {categories.map((category) => (
                                <button
                                    title={category.name}
                                    key={category.id}
                                    data-category={category.id}
                                    onClick={() => {
                                        onCategoryChange(category.id);
                                        setIsExpanded(false);
                                    }}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 whitespace-nowrap text-center ${activeCategory === category.id
                                        ? "bg-gradient-to-b from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                                        }`}
                                >
                                    <div className="flex flex-col items-center w-full">
                                        <span className="font-semibold truncate w-full">{category.name}</span>
                                        <span className="text-xs opacity-75">({category.count})</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Custom scrollbar styles */}
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default VerticalCategorySelector; 