# Component Documentation

This document describes the shadcn/ui component migration and usage patterns for the WFG (Worklog From Git) application.

## Overview

The WFG application has been migrated from custom CSS components to shadcn/ui components, providing:
- Consistent design system
- Built-in accessibility features
- Better TypeScript support
- Radix UI primitives for robust functionality

## Migrated Components

### GitFilterForm

**Location**: `src/components/GitFilterForm.tsx`

**Description**: Client component for filtering Git commits with form validation and submission to Server Actions.

**shadcn/ui Components Used**:
- `Card`, `CardHeader`, `CardTitle`, `CardContent` - Form container
- `Button` - Submit and reset buttons
- `Input` - Text and date inputs
- `Label` - Form field labels

**Key Features**:
- Form validation with error handling
- Loading states with disabled inputs
- Responsive design with proper spacing
- Accessibility compliance with ARIA labels

**Usage Example**:
```tsx
<GitFilterForm
  onCommitsResult={handleCommitsResult}
  onSummariesResult={handleSummariesResult}
  onError={handleError}
  onLoading={handleLoading}
/>
```

**Accessibility Features**:
- Proper form associations with `htmlFor` attributes
- Required field validation
- Focus management with `focus-visible` styles
- Screen reader compatible labels

### DailySummariesView

**Location**: `src/components/DailySummariesView.tsx`

**Description**: Server component for displaying daily summaries with Thai date formatting and AI enhancement support.

**shadcn/ui Components Used**:
- `Card`, `CardHeader`, `CardTitle`, `CardContent` - Main container and individual summary cards
- `Badge` - AI enhancement indicators

**Key Features**:
- Multiple display states (loading, error, empty, content)
- AI enhancement badges with custom styling
- Responsive card layout
- Thai Buddhist calendar support

**Usage Example**:
```tsx
<DailySummariesView
  summaries={summaries}
  loading={loading}
  error={error}
  aiEnabled={true}
/>
```

**AI Enhancement Indicators**:
- Blue badge for AI-enhanced summaries
- Custom styling with `bg-blue-100 text-blue-800`
- Icon integration for visual clarity

### RefreshButton

**Location**: `src/components/RefreshButton.tsx`

**Description**: Interactive button for refreshing summary data with loading states.

**shadcn/ui Components Used**:
- `Button` - Primary action button with loading states

**Key Features**:
- Loading state management
- Disabled state handling
- Server Action integration
- Error boundary support

### LoadingSpinner

**Location**: `src/components/LoadingSpinner.tsx`

**Description**: Reusable loading indicator with multiple size variants.

**shadcn/ui Components Used**:
- `Skeleton` - Loading placeholder component

**Key Features**:
- Multiple size variants (sm, md, lg, xl)
- Customizable text and styling
- Accessibility-compliant animations

### ErrorBoundary

**Location**: `src/components/ErrorBoundary.tsx`

**Description**: React Error Boundary with user-friendly error display.

**shadcn/ui Components Used**:
- `Alert`, `AlertTitle`, `AlertDescription` - Error message display
- `Button` - Error recovery actions

**Key Features**:
- Graceful error handling
- User-friendly error messages
- Recovery action buttons
- Development vs production error display

### AIStatusIndicator

**Location**: `src/components/AIStatusIndicator.tsx`

**Description**: Status indicator for AI service availability and configuration.

**shadcn/ui Components Used**:
- `Badge` - Status indicators
- `Alert`, `AlertTitle`, `AlertDescription` - Detailed status messages
- `Skeleton` - Loading states

**Key Features**:
- Real-time status monitoring
- Configuration validation
- Service health indicators
- Detailed error reporting

### FormValidation

**Location**: `src/components/FormValidation.tsx`

**Description**: Reusable form validation components and utilities.

**shadcn/ui Components Used**:
- `Alert`, `AlertTitle`, `AlertDescription` - Validation messages
- `Button` - Form actions
- `Input`, `Label` - Form fields

**Key Features**:
- Multiple validation message types
- Reusable form field components
- Notification banner system
- Accessibility-compliant validation

### GitCommitsList

**Location**: `src/components/GitCommitsList.tsx`

**Description**: Display component for Git commit data with filtering and sorting.

**shadcn/ui Components Used**:
- `Card`, `CardHeader`, `CardTitle`, `CardContent` - Commit containers
- `Badge` - Repository and branch indicators
- `Alert` - Error states
- `Skeleton` - Loading states

**Key Features**:
- Commit data visualization
- Repository and branch badges
- Date formatting with Thai calendar
- Responsive grid layout

## Design System Integration

### Color Scheme
- Primary: Blue-based theme for actions and highlights
- Secondary: Gray-based theme for supporting elements
- Success: Green for positive states
- Error: Red for error states
- Warning: Yellow for warning states

### Typography
- Consistent font sizing with Tailwind CSS classes
- Proper heading hierarchy
- Readable line heights and spacing

### Spacing
- Consistent padding and margins using Tailwind classes
- Proper component spacing with `space-y-*` utilities
- Responsive design with breakpoint-specific spacing

## Accessibility Guidelines

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Proper tab order throughout forms and components
- Focus indicators with `focus-visible` styles

### Screen Reader Support
- Proper ARIA labels and descriptions
- Semantic HTML structure
- Form field associations with labels

### Color Contrast
- WCAG AA compliant color combinations
- High contrast focus indicators
- Clear visual hierarchy

### Form Accessibility
- Required field indicators
- Error message associations
- Proper input labeling
- Validation feedback

## Migration Notes

### Breaking Changes
- Custom CSS classes replaced with shadcn/ui component props
- Some component APIs updated for better TypeScript support
- Color scheme standardized across components

### Benefits Achieved
- Reduced bundle size through tree-shaking
- Improved accessibility compliance
- Better TypeScript integration
- Consistent design language
- Easier maintenance and updates

### Performance Improvements
- Optimized component rendering
- Reduced CSS bundle size
- Better tree-shaking support
- Improved loading states

## Best Practices

### Component Usage
1. Always use the shadcn/ui components instead of custom implementations
2. Leverage component variants for different use cases
3. Maintain consistent spacing and typography
4. Use proper semantic HTML structure

### Styling
1. Use Tailwind utility classes for custom styling
2. Leverage shadcn/ui design tokens for consistency
3. Avoid inline styles when possible
4. Use responsive design patterns

### Accessibility
1. Always provide proper labels for form elements
2. Use semantic HTML elements
3. Ensure keyboard navigation works correctly
4. Test with screen readers

### Performance
1. Import only the components you need
2. Use proper loading states
3. Implement error boundaries
4. Optimize images and assets

## Future Enhancements

### Planned Improvements
- Dark mode support
- Additional component variants
- Enhanced animation support
- Better mobile responsiveness

### Component Roadmap
- Data table components
- Advanced form components
- Chart and visualization components
- Enhanced navigation components

## Troubleshooting

### Common Issues
1. **Import errors**: Ensure shadcn/ui components are properly installed
2. **Styling conflicts**: Check for conflicting CSS classes
3. **TypeScript errors**: Verify component prop types
4. **Accessibility warnings**: Review ARIA attributes and labels

### Support Resources
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Accessibility Guidelines](https://react.dev/learn/accessibility)
