import React, { forwardRef } from 'react';

export interface ToggleProps {
    // Core functionality
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    readOnly?: boolean;

    // Styling props
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
    colorScheme?: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'teal' | 'pink' | 'gray';

    // Layout and content
    label?: string;
    description?: string;
    position?: 'left' | 'right'; // Label position

    // Visual enhancements
    showIcon?: boolean;
    loading?: boolean;
    glow?: boolean;
    rounded?: boolean;

    // Accessibility and testing
    id?: string;
    name?: string;
    'data-testid'?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;

    // Styling
    className?: string;
    style?: React.CSSProperties;

    // Events
    onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}

const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(({
    checked = false,
    onChange,
    disabled = false,
    readOnly = false,
    size = 'md',
    variant = 'default',
    colorScheme = 'blue',
    label,
    description,
    position = 'right',
    showIcon = true,
    loading = false,
    glow = false,
    rounded = true,
    id,
    name,
    'data-testid': dataTestId,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    className = '',
    style,
    onFocus,
    onBlur,
    onKeyDown,
    ...props
}, ref) => {

    // Handle toggle change
    const handleToggle = () => {
        if (disabled || readOnly || loading) return;
        onChange?.(!checked);
    };

    // Handle keyboard events
    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            handleToggle();
        }
        onKeyDown?.(event);
    };

    // Size variants
    const sizeClasses = {
        sm: {
            track: 'h-4 w-7',
            thumb: 'h-3 w-3',
            translate: 'translate-x-3',
            text: 'text-xs',
            spacing: 'space-x-2'
        },
        md: {
            track: 'h-5 w-9',
            thumb: 'h-4 w-4',
            translate: 'translate-x-4',
            text: 'text-sm',
            spacing: 'space-x-3'
        },
        lg: {
            track: 'h-6 w-11',
            thumb: 'h-5 w-5',
            translate: 'translate-x-5',
            text: 'text-base',
            spacing: 'space-x-3'
        },
        xl: {
            track: 'h-7 w-14',
            thumb: 'h-6 w-6',
            translate: 'translate-x-7',
            text: 'text-lg',
            spacing: 'space-x-4'
        }
    };

    // Color scheme variants
    const colorSchemes = {
        blue: {
            checked: 'bg-gradient-to-r from-blue-500 to-blue-600',
            unchecked: 'bg-gray-200 dark:bg-gray-600',
            thumb: 'bg-white',
            focus: 'ring-blue-500/20 ring-4',
            glow: 'shadow-lg shadow-blue-500/25'
        },
        green: {
            checked: 'bg-gradient-to-r from-green-500 to-green-600',
            unchecked: 'bg-gray-200 dark:bg-gray-600',
            thumb: 'bg-white',
            focus: 'ring-green-500/20 ring-4',
            glow: 'shadow-lg shadow-green-500/25'
        },
        red: {
            checked: 'bg-gradient-to-r from-red-500 to-red-600',
            unchecked: 'bg-gray-200 dark:bg-gray-600',
            thumb: 'bg-white',
            focus: 'ring-red-500/20 ring-4',
            glow: 'shadow-lg shadow-red-500/25'
        },
        purple: {
            checked: 'bg-gradient-to-r from-purple-500 to-purple-600',
            unchecked: 'bg-gray-200 dark:bg-gray-600',
            thumb: 'bg-white',
            focus: 'ring-purple-500/20 ring-4',
            glow: 'shadow-lg shadow-purple-500/25'
        },
        orange: {
            checked: 'bg-gradient-to-r from-orange-500 to-orange-600',
            unchecked: 'bg-gray-200 dark:bg-gray-600',
            thumb: 'bg-white',
            focus: 'ring-orange-500/20 ring-4',
            glow: 'shadow-lg shadow-orange-500/25'
        },
        teal: {
            checked: 'bg-gradient-to-r from-teal-500 to-teal-600',
            unchecked: 'bg-gray-200 dark:bg-gray-600',
            thumb: 'bg-white',
            focus: 'ring-teal-500/20 ring-4',
            glow: 'shadow-lg shadow-teal-500/25'
        },
        pink: {
            checked: 'bg-gradient-to-r from-pink-500 to-pink-600',
            unchecked: 'bg-gray-200 dark:bg-gray-600',
            thumb: 'bg-white',
            focus: 'ring-pink-500/20 ring-4',
            glow: 'shadow-lg shadow-pink-500/25'
        },
        gray: {
            checked: 'bg-gradient-to-r from-gray-500 to-gray-600',
            unchecked: 'bg-gray-200 dark:bg-gray-600',
            thumb: 'bg-white',
            focus: 'ring-gray-500/20 ring-4',
            glow: 'shadow-lg shadow-gray-500/25'
        }
    };

    const currentSize = sizeClasses[size];
    const currentColors = colorSchemes[colorScheme];

    // Build classes
    const trackClasses = `
    relative inline-flex items-center ${currentSize.track} 
    ${rounded ? 'rounded-full' : 'rounded-lg'}
    transition-all duration-300 ease-in-out
    ${checked ? currentColors.checked : currentColors.unchecked}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${glow && checked ? currentColors.glow : ''}
    focus:outline-none focus:${currentColors.focus}
    transform hover:scale-105 active:scale-95
    ${loading ? 'animate-pulse' : ''}
  `;

    const thumbClasses = `
    inline-block ${currentSize.thumb} ${currentColors.thumb}
    ${rounded ? 'rounded-full' : 'rounded'}
    shadow-lg transform transition-all duration-300 ease-in-out
    ${checked ? currentSize.translate : 'translate-x-0.5'}
    ${showIcon ? 'flex items-center justify-center' : ''}
    relative overflow-hidden
  `;

    const labelClasses = `
    ${currentSize.text} font-medium 
    ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}
    select-none cursor-pointer
  `;

    const descriptionClasses = `
    text-xs text-gray-500 dark:text-gray-400 mt-1
    ${disabled ? 'opacity-50' : ''}
  `;

    // Icons for checked/unchecked states
    const CheckIcon = () => (
        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
    );

    const CrossIcon = () => (
        <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
    );

    const LoadingIcon = () => (
        <div className="w-3 h-3 border-2 border-gray-300 rounded-full border-t-gray-600 animate-spin"></div>
    );

    // Render the toggle content
    const renderToggle = () => (
        <button
            ref={ref}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel || label}
            aria-describedby={ariaDescribedBy}
            id={id}
            name={name}
            data-testid={dataTestId}
            disabled={disabled}
            className={`${trackClasses} ${className}`}
            style={style}
            onClick={handleToggle}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyDown={handleKeyDown}
            {...props}
        >
            {/* Track background with gradient overlay */}
            <div className="absolute inset-0 rounded-full">
                {checked && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/10 to-transparent"></div>
                )}
            </div>

            {/* Thumb */}
            <span className={thumbClasses}>
                {/* Thumb background gradient */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-gray-100"></div>

                {/* Icon */}
                {showIcon && !loading && (
                    <div className="relative z-10 transition-all duration-200">
                        {checked ? <CheckIcon /> : <CrossIcon />}
                    </div>
                )}

                {/* Loading state */}
                {loading && (
                    <div className="relative z-10">
                        <LoadingIcon />
                    </div>
                )}

                {/* Shine effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/40 via-transparent to-transparent opacity-60"></div>
            </span>

            {/* Ripple effect */}
            <div className="absolute inset-0 transition-all duration-300 rounded-full">
                <div className={`absolute inset-0 rounded-full transition-all duration-300 ${checked ? 'bg-white/10' : 'bg-black/5'} scale-0 group-active:scale-100`}></div>
            </div>
        </button>
    );

    // Render with or without label
    if (label || description) {
        const content = (
            <>
                {position === 'left' && (
                    <div className="flex flex-col">
                        {label && (
                            <label
                                htmlFor={id}
                                className={labelClasses}
                                data-testid={dataTestId ? `${dataTestId}-label` : undefined}
                            >
                                {label}
                            </label>
                        )}
                        {description && (
                            <span
                                className={descriptionClasses}
                                data-testid={dataTestId ? `${dataTestId}-description` : undefined}
                            >
                                {description}
                            </span>
                        )}
                    </div>
                )}

                {renderToggle()}

                {position === 'right' && (
                    <div className="flex flex-col">
                        {label && (
                            <label
                                htmlFor={id}
                                className={labelClasses}
                                data-testid={dataTestId ? `${dataTestId}-label` : undefined}
                            >
                                {label}
                            </label>
                        )}
                        {description && (
                            <span
                                className={descriptionClasses}
                                data-testid={dataTestId ? `${dataTestId}-description` : undefined}
                            >
                                {description}
                            </span>
                        )}
                    </div>
                )}
            </>
        );

        return (
            <div
                className={`flex items-center ${currentSize.spacing} ${disabled ? 'opacity-60' : ''}`}
                data-testid={dataTestId ? `${dataTestId}-container` : undefined}
            >
                {content}
            </div>
        );
    }

    return renderToggle();
});

Toggle.displayName = 'Toggle';

export default Toggle; 