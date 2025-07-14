import React from 'react';
import { IconType } from 'react-icons';

export interface IconWrapperProps {
    icon: string | IconType;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    className?: string;
    preserveColors?: boolean;
    color?: string;
    variant?: 'default' | 'colored' | 'monochrome';
}

const IconWrapper: React.FC<IconWrapperProps> = ({
    icon,
    size = 'md',
    className = '',
    preserveColors = true,
    color,
    variant = 'default'
}) => {
    // Size mapping
    const sizeClasses = {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl'
    };

    // Variant-based styling
    const variantClasses = {
        default: '',
        colored: 'emoji-colored',
        monochrome: 'emoji-monochrome'
    };

    // Check if icon is a React icon component
    const isReactIcon = typeof icon === 'function';

    // Check if icon is an emoji (contains emoji characters)
    const isEmoji = typeof icon === 'string' && /\p{Emoji}/u.test(icon);

    if (isReactIcon) {
        // For React icons, render the component
        const IconComponent = icon as IconType;
        return (
            <IconComponent
                className={`${sizeClasses[size]} ${className}`}
                style={color ? { color } : undefined}
            />
        );
    }

    if (isEmoji) {
        // For emoji icons, use a wrapper that preserves colors
        const baseClasses = `${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

        return (
            <span
                className={baseClasses}
                style={{
                    // Force emoji to display with its original colors when preserveColors is true
                    ...(preserveColors && variant === 'colored' && {
                        color: 'initial',
                        filter: 'none',
                        // Ensure emoji renders with its natural colors
                        WebkitTextFillColor: 'initial',
                        textFillColor: 'initial',
                        // Additional properties for better emoji rendering
                        fontVariantEmoji: 'emoji',
                        fontFeatureSettings: '"emoji"',
                        // Force hardware acceleration for better rendering
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden'
                    }),
                    ...(color && { color })
                }}
                role="img"
                aria-label="icon"
                data-emoji="true"
            >
                {icon}
            </span>
        );
    }

    // For regular text icons
    return (
        <span
            className={`${sizeClasses[size]} ${className}`}
            style={color ? { color } : undefined}
        >
            {icon}
        </span>
    );
};

export default IconWrapper; 