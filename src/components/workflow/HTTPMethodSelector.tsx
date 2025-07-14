import React from "react";
import { FiZap, FiArrowRight } from "react-icons/fi";
import { Button, IconWrapper } from "../ui";
import { HTTP_METHODS, METHOD_ICONS } from "../../constants/requestConfig";

export interface HTTPMethodSelectorProps {
    selectedMethod: string;
    onMethodChange: (method: string) => void;
    className?: string;
    compact?: boolean;
    showLabel?: boolean;
}

const HTTPMethodSelector: React.FC<HTTPMethodSelectorProps> = ({
    selectedMethod,
    onMethodChange,
    className = "",
    compact = false,
    showLabel = true,
}) => {
    const containerClass = compact
        ? "p-2 border border-gray-200 shadow-sm bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg dark:from-gray-700 dark:to-gray-800 dark:border-gray-600"
        : "p-4 border border-gray-200 shadow-sm bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl dark:from-gray-700 dark:to-gray-800 dark:border-gray-600";

    return (
        <div className={`${containerClass} ${className}`}>
            {showLabel && (
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                            <FiZap className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">HTTP Method</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Select method</div>
                </div>
            )}

            {/* Scrollable Method Container */}
            <div className="relative w-full group">
                {/* Left Arrow */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        const container = document.getElementById('http-methods-scroll');
                        if (container) {
                            container.scrollBy({ left: -200, behavior: 'smooth' });
                        }
                    }}
                    className="!absolute !left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:shadow-xl"
                    title="Scroll left"
                >
                    <FiArrowRight className="w-3 h-3 text-gray-600 rotate-180 dark:text-gray-300" />
                </Button>

                {/* Right Arrow */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        const container = document.getElementById('http-methods-scroll');
                        if (container) {
                            container.scrollBy({ left: 200, behavior: 'smooth' });
                        }
                    }}
                    className="!absolute !right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:shadow-xl"
                    title="Scroll right"
                >
                    <FiArrowRight className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                </Button>

                {/* Scrollable Content */}
                <div
                    id="http-methods-scroll"
                    className={`flex items-center w-full space-x-2 overflow-x-auto scrollbar-hide scroll-smooth ${compact ? 'px-4' : 'px-6'}`}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {HTTP_METHODS.map((option) => {
                        const isSelected = selectedMethod === option.value;
                        const icon = METHOD_ICONS[option.value] || '🔗';
                        return (
                            <button
                                key={option.value}
                                onClick={() => onMethodChange(option.value)}
                                className={`relative ${compact ? 'px-2 py-1' : 'px-3 py-2'} rounded-lg font-semibold ${compact ? 'text-xs' : 'text-sm'} transition-all duration-300 transform hover:scale-105 group overflow-hidden flex-shrink-0 ${isSelected
                                    ? `${option.color} shadow-lg shadow-opacity-25`
                                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                                    }`}
                                data-testid={`http-method-${option.value.toLowerCase()}`}
                            >
                                <div className={`absolute inset-0 transition-opacity duration-300 ${isSelected ? 'opacity-10' : 'opacity-0 group-hover:opacity-5'
                                    }`}>
                                    <div className="absolute top-0 right-0 w-8 h-8 bg-current rounded-full opacity-20 translate-x-4 -translate-y-4"></div>
                                    <div className="absolute bottom-0 left-0 w-6 h-6 bg-current rounded-full opacity-20 -translate-x-3 translate-y-3"></div>
                                </div>
                                <span className="flex relative z-10 items-center space-x-1">
                                    <IconWrapper icon={icon} size={compact ? 'sm' : 'lg'} variant="colored" />
                                    {!compact && <span>{option.label}</span>}
                                    {compact && <span className="hidden sm:inline">{option.label}</span>}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Scroll Indicator */}
                {!compact && (
                    <div className="flex justify-center mt-2 space-x-1">
                        <button
                            onClick={() => {
                                const container = document.getElementById('http-methods-scroll');
                                if (container) {
                                    container.scrollTo({ left: 0, behavior: 'smooth' });
                                }
                            }}
                            className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200 cursor-pointer"
                            title="Scroll to beginning"
                        />
                        <button
                            onClick={() => {
                                const container = document.getElementById('http-methods-scroll');
                                if (container) {
                                    container.scrollTo({ left: container.scrollWidth / 2, behavior: 'smooth' });
                                }
                            }}
                            className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200 cursor-pointer"
                            title="Scroll to middle"
                        />
                        <button
                            onClick={() => {
                                const container = document.getElementById('http-methods-scroll');
                                if (container) {
                                    container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
                                }
                            }}
                            className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200 cursor-pointer"
                            title="Scroll to end"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default HTTPMethodSelector; 