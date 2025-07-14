# IconWrapper Component

## Overview

The `IconWrapper` component is a generic solution for handling icons in React applications, specifically designed to solve the problem of parent styling affecting icon colors. It provides consistent icon rendering across different contexts while preserving the natural colors of emoji icons.

## Problem Solved

### The Issue

When using emoji icons (like 🌐, 🔒, 🛠️) in React components, they often inherit text colors from their parent elements. This becomes problematic when:

1. **Parent elements have different background colors** (gradients, colored backgrounds)
2. **Dark mode implementations** change text colors
3. **Button states** (hover, active, selected) modify text colors
4. **CSS inheritance** causes emoji colors to be overridden

### The Solution

The `IconWrapper` component provides:

- **Color preservation** for emoji icons using CSS properties that force original colors
- **Flexible variants** for different use cases (colored, monochrome, default)
- **Consistent API** for both emoji and React icons
- **Size standardization** across the application

## Features

### 1. Multiple Icon Types Support

- **Emoji icons**: 🌐, 🔒, 🛠️, 🚀, etc.
- **React icons**: Feather Icons, React Icons, etc.
- **Text icons**: Any string-based icons

### 2. Color Variants

- **`colored`**: Preserves original emoji colors (default for emojis)
- **`monochrome`**: Forces grayscale for consistent theming
- **`default`**: Standard behavior (inherits parent colors)

### 3. Size Options

- `xs`, `sm`, `md`, `lg`, `xl`, `2xl`
- Consistent sizing across different icon types

### 4. CSS Classes

- `.emoji-colored`: Forces emoji color preservation
- `.emoji-monochrome`: Applies grayscale filter
- Dark mode support included

## Usage

### Basic Usage

```tsx
import { IconWrapper } from '../ui';

// Emoji icon with color preservation
<IconWrapper icon="🌐" size="lg" variant="colored" />

// React icon
<IconWrapper icon={FiGlobe} size="lg" className="text-blue-600" />

// Text icon
<IconWrapper icon="★" size="md" color="#ffd700" />
```

### Advanced Usage

```tsx
// In a button with gradient background
<button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
  <IconWrapper
    icon="🚀"
    size="xl"
    variant="colored"
    className="mb-2"
  />
  Launch App
</button>

// In dark mode context
<div className="dark:bg-gray-800">
  <IconWrapper
    icon="🔒"
    size="lg"
    variant="colored"
  />
</div>

// Monochrome variant for consistent theming
<IconWrapper
  icon="⚙️"
  size="md"
  variant="monochrome"
  className="text-gray-600"
/>
```

## Props

| Prop             | Type                                            | Default     | Description                                      |
| ---------------- | ----------------------------------------------- | ----------- | ------------------------------------------------ |
| `icon`           | `string \| IconType`                            | -           | The icon to display (emoji, React icon, or text) |
| `size`           | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'`      | Size of the icon                                 |
| `className`      | `string`                                        | `''`        | Additional CSS classes                           |
| `variant`        | `'default' \| 'colored' \| 'monochrome'`        | `'default'` | Color handling variant                           |
| `color`          | `string`                                        | -           | Explicit color override                          |
| `preserveColors` | `boolean`                                       | `true`      | Legacy prop for backward compatibility           |

## CSS Classes

### `.emoji-colored`

Forces emoji icons to display with their original colors:

```css
.emoji-colored {
  color: initial !important;
  filter: none !important;
  -webkit-text-fill-color: initial !important;
  text-fill-color: initial !important;
  font-variant-emoji: emoji;
  font-feature-settings: "emoji";
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### `.emoji-monochrome`

Applies grayscale filter to emoji icons:

```css
.emoji-monochrome {
  filter: grayscale(100%);
  -webkit-filter: grayscale(100%);
}
```

## Migration Guide

### Before (Problematic)

```tsx
// ❌ Emoji inherits parent text color
<button className="bg-blue-500 text-white">
  <span className="text-2xl">🌐</span>
  HTTP
</button>
```

### After (Solution)

```tsx
// ✅ Emoji preserves original colors
<button className="bg-blue-500 text-white">
  <IconWrapper icon="🌐" size="2xl" variant="colored" />
  HTTP
</button>
```

## Best Practices

### 1. Use Appropriate Variants

- **`colored`**: For emoji icons that should maintain their natural colors
- **`monochrome`**: For consistent theming across the application
- **`default`**: For React icons or when you want standard inheritance

### 2. Consistent Sizing

Use the size prop instead of custom CSS classes:

```tsx
// ✅ Good
<IconWrapper icon="🌐" size="lg" />

// ❌ Avoid
<span className="text-lg">🌐</span>
```

### 3. Context-Aware Usage

Consider the context when choosing variants:

```tsx
// In colored backgrounds
<IconWrapper icon="🚀" variant="colored" />

// In monochrome designs
<IconWrapper icon="⚙️" variant="monochrome" className="text-gray-600" />
```

## Examples in URLBuilder

The `IconWrapper` component is used throughout the URLBuilder to solve the original problem:

### Protocol Options

```tsx
<IconWrapper
  icon={option.icon}
  size="2xl"
  className="mb-1 filter drop-shadow-sm"
  variant="colored"
/>
```

### Domain Suggestions

```tsx
<IconWrapper icon={suggestion.icon} size="lg" variant="colored" />
```

## Testing

The component includes comprehensive testing scenarios:

- Color preservation in different backgrounds
- Dark mode compatibility
- Size variations
- Different icon types
- Context switching

## Browser Support

- **Modern browsers**: Full support with hardware acceleration
- **Older browsers**: Graceful fallback to standard rendering
- **Mobile browsers**: Optimized for touch interfaces

## Performance

- **Lightweight**: Minimal overhead
- **Hardware accelerated**: Uses `transform: translateZ(0)` for better rendering
- **Efficient**: No unnecessary re-renders
- **Optimized**: Uses CSS properties for better performance
