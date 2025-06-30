# UI Components Library

A comprehensive collection of reusable UI components designed specifically for BiSTool, featuring consistent styling, dark mode support, and accessibility features.

## Features

- 🎨 **Consistent Design System** - All components follow the same design patterns
- 🌙 **Dark Mode Support** - Automatic theme switching with proper contrast
- ♿ **Accessibility** - ARIA labels, keyboard navigation, and screen reader support
- 📱 **Responsive** - Mobile-first design with flexible layouts
- ⚡ **Performance** - Optimized rendering and minimal bundle size
- 🎯 **TypeScript** - Full type safety with comprehensive interfaces

## Components

### Button

A versatile button component with multiple variants, sizes, and states.

```tsx
import { Button } from "../components/ui";

<Button variant="primary" size="md" icon={FiPlus}>
  Add Item
</Button>;
```

**Props:**

- `variant`: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline'
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `icon`: React icon component
- `iconPosition`: 'left' | 'right'
- `loading`: boolean
- `fullWidth`: boolean
- `disabled`: boolean

### Card

A container component for grouping related content with different styling options.

```tsx
import { Card } from "../components/ui";

<Card variant="elevated" padding="lg" interactive>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>;
```

**Props:**

- `variant`: 'default' | 'elevated' | 'outlined' | 'gradient'
- `padding`: 'none' | 'sm' | 'md' | 'lg' | 'xl'
- `interactive`: boolean
- `onClick`: function

### Input

A form input component with various states and styling options.

```tsx
import { Input } from "../components/ui";

<Input
  label="Email Address"
  placeholder="Enter your email"
  icon={FiMail}
  fullWidth
  error={hasError}
  helperText="Please enter a valid email"
/>;
```

**Props:**

- `variant`: 'default' | 'outlined' | 'filled'
- `size`: 'sm' | 'md' | 'lg'
- `icon`: React icon component
- `iconPosition`: 'left' | 'right'
- `error`: boolean
- `success`: boolean
- `fullWidth`: boolean
- `label`: string
- `helperText`: string

### Select

A dropdown select component with customizable options.

```tsx
import { Select } from "../components/ui";

<Select
  label="Choose Option"
  options={[
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
  ]}
  placeholder="Select an option"
  fullWidth
/>;
```

**Props:**

- `variant`: 'default' | 'outlined' | 'filled'
- `size`: 'sm' | 'md' | 'lg'
- `icon`: React icon component
- `error`: boolean
- `success`: boolean
- `fullWidth`: boolean
- `label`: string
- `helperText`: string
- `options`: SelectOption[]
- `placeholder`: string

### Textarea

A multi-line text input component.

```tsx
import { Textarea } from "../components/ui";

<Textarea
  label="Description"
  placeholder="Enter description..."
  rows={4}
  resize="vertical"
  fullWidth
/>;
```

**Props:**

- `variant`: 'default' | 'outlined' | 'filled'
- `size`: 'sm' | 'md' | 'lg'
- `error`: boolean
- `success`: boolean
- `fullWidth`: boolean
- `label`: string
- `helperText`: string
- `resize`: 'none' | 'vertical' | 'horizontal' | 'both'

### Badge

A small component for displaying status, labels, or counts.

```tsx
import { Badge } from "../components/ui";

<Badge variant="success" dot>
  Active
</Badge>;
```

**Props:**

- `variant`: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
- `size`: 'sm' | 'md' | 'lg'
- `dot`: boolean

### IconButton

A button component that displays only an icon.

```tsx
import { IconButton } from "../components/ui";

<IconButton
  variant="primary"
  size="md"
  icon={FiSettings}
  onClick={handleSettings}
/>;
```

**Props:**

- `variant`: 'default' | 'ghost' | 'outline' | 'primary' | 'success' | 'danger' | 'warning'
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `icon`: React icon component
- `loading`: boolean

### StatusIndicator

A component for displaying different status states.

```tsx
import { StatusIndicator } from "../components/ui";

<StatusIndicator status="success" showLabel />;
```

**Props:**

- `status`: 'idle' | 'loading' | 'success' | 'error' | 'warning' | 'info'
- `size`: 'sm' | 'md' | 'lg'
- `showLabel`: boolean
- `label`: string

### Divider

A component for visual separation between content sections.

```tsx
import { Divider } from '../components/ui';

<Divider variant="solid" />
<Divider orientation="vertical" variant="dashed" />
```

**Props:**

- `orientation`: 'horizontal' | 'vertical'
- `variant`: 'solid' | 'dashed' | 'dotted'
- `size`: 'sm' | 'md' | 'lg'

### Tooltip

A component for showing helpful information on hover.

```tsx
import { Tooltip } from "../components/ui";

<Tooltip content="This is helpful information" position="top">
  <Button>Hover me</Button>
</Tooltip>;
```

**Props:**

- `content`: string
- `position`: 'top' | 'bottom' | 'left' | 'right'
- `delay`: number (milliseconds)

## Usage Examples

### Form with Validation

```tsx
import { Input, Button, Card } from "../components/ui";

const ContactForm = () => {
  const [email, setEmail] = useState("");
  const [hasError, setHasError] = useState(false);

  return (
    <Card variant="elevated" padding="lg">
      <h2>Contact Us</h2>
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={hasError}
        helperText={hasError ? "Please enter a valid email" : ""}
        fullWidth
      />
      <Button variant="primary" fullWidth>
        Send Message
      </Button>
    </Card>
  );
};
```

### Status Dashboard

```tsx
import { Card, Badge, StatusIndicator, Divider } from "../components/ui";

const StatusDashboard = () => {
  return (
    <div className="space-y-4">
      <Card variant="elevated" padding="md">
        <div className="flex justify-between items-center">
          <h3>System Status</h3>
          <StatusIndicator status="success" showLabel />
        </div>
        <Divider className="my-4" />
        <div className="flex gap-2">
          <Badge variant="success">Online</Badge>
          <Badge variant="info">2.3.1</Badge>
        </div>
      </Card>
    </div>
  );
};
```

### Action Buttons

```tsx
import { Button, IconButton, Tooltip } from "../components/ui";

const ActionBar = () => {
  return (
    <div className="flex gap-2">
      <Button variant="primary" icon={FiPlus}>
        Add New
      </Button>

      <Tooltip content="Export data">
        <IconButton variant="outline" icon={FiDownload} />
      </Tooltip>

      <Tooltip content="Settings">
        <IconButton variant="ghost" icon={FiSettings} />
      </Tooltip>
    </div>
  );
};
```

## Best Practices

1. **Consistent Spacing**: Use the provided padding and margin classes for consistent spacing
2. **Accessibility**: Always provide meaningful labels and descriptions
3. **Loading States**: Use loading states to provide user feedback
4. **Error Handling**: Display clear error messages with the error prop
5. **Responsive Design**: Use fullWidth prop for mobile-friendly layouts
6. **Theme Consistency**: Components automatically adapt to dark/light mode

## Customization

All components use Tailwind CSS classes and can be customized by:

1. **Extending Classes**: Add custom classes via the `className` prop
2. **Theme Context**: Modify the theme context for global styling changes
3. **CSS Variables**: Override CSS custom properties for fine-grained control

## Contributing

When adding new components:

1. Follow the existing naming conventions
2. Include TypeScript interfaces for all props
3. Add dark mode support
4. Include accessibility features
5. Add to the demo component
6. Update this documentation

## Demo

See `UIComponentsDemo.tsx` for a complete showcase of all components and their variants.
