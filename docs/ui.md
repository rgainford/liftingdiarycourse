# UI Coding Standards

This document outlines the mandatory UI coding standards for the liftingdiarycourse project.

## Component Library: shadcn/ui

**CRITICAL RULE: ONLY shadcn/ui components shall be used for ALL UI elements in this project.**

### Mandatory Requirements

1. **NO Custom Components**: Custom UI components are **STRICTLY PROHIBITED**. All UI elements must use shadcn/ui components.

2. **shadcn/ui Only**: Every button, input, dialog, card, form element, or any other UI component must come from the shadcn/ui library.

3. **Component Installation**: Before implementing any UI feature, ensure the required shadcn/ui components are installed:
   ```bash
   npx shadcn@latest add [component-name]
   ```

4. **No Exceptions**: There are **NO EXCEPTIONS** to this rule. If a specific UI pattern is needed, it must be achieved using existing shadcn/ui components or by composing multiple shadcn/ui components together.

### Available shadcn/ui Components

Install components as needed from the shadcn/ui library:
- Accordion
- Alert
- Alert Dialog
- Avatar
- Badge
- Button
- Calendar
- Card
- Checkbox
- Collapsible
- Combobox
- Command
- Context Menu
- Data Table
- Date Picker
- Dialog
- Drawer
- Dropdown Menu
- Form
- Hover Card
- Input
- Label
- Menubar
- Navigation Menu
- Popover
- Progress
- Radio Group
- Select
- Separator
- Sheet
- Skeleton
- Slider
- Switch
- Table
- Tabs
- Textarea
- Toast
- Toggle
- Tooltip
- And many more...

Refer to [shadcn/ui documentation](https://ui.shadcn.com/) for the complete list.

### Component Composition

If a specific UI pattern is not available as a single shadcn/ui component, compose multiple shadcn/ui components together. For example:
- Combine `Card`, `Button`, and `Input` components to create complex forms
- Use `Dialog` with `Form` components for modal forms
- Compose `Table` with `Badge` and `Button` for data tables with actions

### Styling

- Use Tailwind CSS classes for layout and spacing
- Respect the design tokens defined in `globals.css`
- Maintain consistency with shadcn/ui's default styling
- Override styles only when absolutely necessary and only through Tailwind classes

## Date Formatting

**Library: date-fns**

All date formatting must be done using the `date-fns` library.

### Required Date Format

Dates must be formatted with ordinal day indicators followed by abbreviated month and full year:

**Format Pattern**: `do MMM yyyy`

**Examples**:
- `1st Sep 2025`
- `2nd Aug 2025`
- `3rd Jan 2026`
- `4th Jun 2024`
- `21st Dec 2024`
- `22nd Nov 2025`
- `23rd Oct 2026`

### Implementation

```typescript
import { format } from 'date-fns';

// Format a date
const formattedDate = format(new Date(), 'do MMM yyyy');
// Output: "24th Dec 2025"
```

### Installation

If date-fns is not already installed:
```bash
npm install date-fns
```

### Consistency

- **Always** use the `do MMM yyyy` format for displaying dates to users
- **Never** use alternative date formats unless explicitly specified for a particular use case
- For date inputs, use shadcn/ui's Date Picker component with date-fns for formatting

## Code Review Checklist

Before submitting any UI code, ensure:

- [ ] ALL UI components are from shadcn/ui (no custom components)
- [ ] No custom Button, Input, Card, or other UI primitives have been created
- [ ] All dates are formatted using date-fns with the `do MMM yyyy` pattern
- [ ] Styling is done via Tailwind CSS
- [ ] Components are properly composed when complex patterns are needed

## Enforcement

**Any pull request containing custom UI components will be rejected immediately.**

This standard ensures:
- Consistent UI/UX across the entire application
- Accessibility compliance (shadcn/ui components are accessible by default)
- Reduced maintenance burden
- Faster development through reusable components
- Type-safe component APIs
- Consistent date formatting throughout the application
