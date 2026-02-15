# Divermeter - Copilot Instructions

## Project Overview
Divermeter is a **Frosty-based** dashboard library for proto.io (backend-as-a-service). It provides an admin UI for browsing database schemas, managing classes, and viewing configurations. Built as a distributable npm package.

**CRITICAL: This is NOT a React project.** Do not import from 'react' or use React patterns.

## General Development Principles

### Always Verify Library APIs - Never Assume

**CRITICAL: Always check the actual documentation and implementation of libraries before using them. Do not make assumptions based on similar libraries.**

Key guidelines:

1. **Different libraries have different APIs** - Even if two libraries serve similar purposes (e.g., Frosty vs React), their APIs can be fundamentally different.

2. **Check before implementing**:
   - Read the library's documentation
   - Look at existing usage patterns in the codebase
   - Search for similar implementations in the project
   - When in doubt, examine the library's source code or type definitions

3. **Common assumption pitfalls**:
   - **Frosty ≠ React**: While both use JSX, their context APIs, hook behaviors, and patterns differ significantly
   - **Router implementations**: Custom routers (like ours) have different navigation methods than React Router
   - **Styling libraries**: Each has unique patterns for pseudo-selectors, animations, and responsive design
   - **State management**: Don't assume Redux/Zustand patterns apply to other solutions

4. **When learning a new library**:
   - Start with the library's getting started guide
   - Review type definitions for accurate API signatures
   - Look for official examples and migration guides
   - Test small examples before large implementations

**Example of API differences - Frosty vs React:**
```tsx
// ❌ WRONG: Assuming React's context API
import { createContext } from 'frosty';
const MyContext = createContext<Type | undefined>(undefined);
const MyProvider = ({ children }) => (
  <MyContext.Provider value={value}>{children}</MyContext.Provider>
);

// ✅ CORRECT: Using Frosty's actual context API
import { createContext } from 'frosty';
const MyContext = createContext<Type>();  // No default value
const MyProvider = ({ children }) => (
  <MyContext value={value}>{children}</MyContext>  {/* No .Provider */}
);
```

This principle applies to ALL libraries - always verify before implementing.

### Always Check Type Errors Immediately

**CRITICAL: Run type checking after writing or modifying ANY code. Never assume your code is correct without verification.**

Key guidelines:

1. **Check errors immediately** - Use `get_errors` tool after every code change, not just at the end
2. **Don't assume properties exist** - TypeScript will catch incorrect property access (e.g., `theme.colors.text` doesn't exist)
3. **Verify function signatures** - Check that you're passing the right types to functions
4. **Trust TypeScript errors** - If TypeScript reports an error, your code is wrong - fix it, don't ignore it
5. **Use autocomplete** - Let TypeScript guide you to available properties and methods

**Workflow:**
```
1. Write code
2. Immediately run get_errors tool on the file
3. Fix any type errors found
4. Repeat until no errors
5. Only then consider the code complete
```

**Why this matters:**
- Prevents runtime errors that TypeScript would have caught
- Catches API misunderstandings early (e.g., non-existent theme properties)
- Ensures code quality before user sees it
- Saves time - catching errors early is faster than debugging later

**Example - Wrong workflow:**
```tsx
// ❌ Write code assuming properties exist
const text = theme.colors.text;  // Doesn't exist!
const bg = theme.colors.background;  // Doesn't exist!
// ... continue writing more code ...
// User: "check the type errors" - NOW you find the mistakes
```

**Example - Correct workflow:**
```tsx
// ✅ Write code
const text = theme.colors.text;
// Immediately run get_errors
// Error: Property 'text' does not exist
// Fix immediately
const text = theme.colorContrast('#ffffff');
// Verify fix with get_errors
// No errors - continue
```

### Always Refactor Duplicated Code Immediately

**CRITICAL: If you discover duplicated code at ANY time, refactor it immediately. Do not wait or ask permission.**

Key guidelines:

1. **Proactive refactoring** - Eliminate duplication as soon as you spot it
2. **Any time means any time** - While reading, editing, debugging, or reviewing code
3. **Don't ask permission** - Refactoring duplication is always the right thing to do
4. **Extract to shared functions** - Create reusable functions with clear names
5. **Parameterize differences** - If code is similar but not identical, parameterize the variations

**When duplication occurs:**
- Same logic in multiple event handlers (e.g., `handleCopy` and keyboard shortcut handler)
- Repeated data transformations or validations
- Similar UI rendering patterns across components
- Identical utility logic scattered across files

**Benefits:**
- **Single source of truth** - Fix bugs once, not multiple times
- **Easier maintenance** - Update logic in one place
- **Better readability** - Clear function names express intent
- **Smaller codebase** - Less code to understand and maintain

**Example:**
```tsx
// ❌ WRONG: Duplicated copy logic in two handlers
const { handleCopy, handleKeyDown } = _useCallbacks({
  handleCopy: (e: ClipboardEvent) => {
    const selectedRows = state.selectedRows?.sort().filter(x => x < data.length) ?? [];
    const columnKeys = _.map(columns, col => _.isString(col) ? col : col.key);
    if (!_.isEmpty(selectedRows)) {
      e.preventDefault();
      // ... 20 more lines of logic
    }
  },
  handleKeyDown: (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      // SAME 25 lines duplicated here!
      const selectedRows = state.selectedRows?.sort().filter(x => x < data.length) ?? [];
      const columnKeys = _.map(columns, col => _.isString(col) ? col : col.key);
      // ... 20 more lines of identical logic
    }
  },
});

// ✅ CORRECT: Extract to shared function
const performCopy = (e: ClipboardEvent | KeyboardEvent) => {
  const selectedRows = state.selectedRows?.sort().filter(x => x < data.length) ?? [];
  const columnKeys = _.map(columns, col => _.isString(col) ? col : col.key);
  if (!_.isEmpty(selectedRows)) {
    e.preventDefault();
    // ... 20 lines of logic - defined ONCE
  }
};

const { handleCopy, handleKeyDown } = _useCallbacks({
  handleCopy: (e: ClipboardEvent) => performCopy(e),
  handleKeyDown: (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') performCopy(e);
  },
});
```

**This is not optional** - code duplication creates technical debt and makes the codebase harder to maintain. Always refactor it immediately.

## Architecture & Key Dependencies

### JSX Runtime: Frosty (Not React)
- **This project uses Frosty, NOT React** - never import from 'react'
- Use `frosty` hooks: `useContext`, `useMemo`, `useResource`, `createContext`, `createPairs`
- Web-specific imports from `frosty/web`: `useLocation`
- TSConfig sets `jsxImportSource: "frosty"`

### Component Structure
```
src/
  index.tsx          # Main export: <Dashboard proto={client} />
  proto.tsx          # ProtoProvider context & hooks (useProto, useProtoSchema)
  components/      # Router, Menu, Theme providers
  pages/           # Browser, Config, Home pages
```

### Custom Router (Not React Router)
- Uses `path-to-regexp` for path matching
- Components: `<Routes>`, `<Route>`, `<Outlet>`
- Hooks: `useParams()` for URL parameters, `useLocation()` for navigation
- Navigate via `location.pushState({}, '/path')`
- See [src/components/router/index.tsx](src/components/router/index.tsx) for implementation

### Context Providers
1. **ProtoProvider** ([src/proto.tsx](src/proto.tsx)): Provides proto client and schema via context
   - Hooks: `useProto()` returns ProtoClient, `useProtoSchema()` returns schema object
   - Wraps `ThemeProvider` automatically
2. **ThemeProvider** ([src/components/theme/index.tsx](src/components/theme/index.tsx)): **Centralized theming system - USE THIS FOR ALL STYLES**
   - Hook: `useTheme()` - **MUST be called in every component that uses styles**
   - Accepts optional `theme` prop with partial `ThemeSettings` to override defaults
   - Uses deep merge (`_.merge`) to combine user settings with defaults
   - Provides both base theme values (colors, spacing, fontSize, etc.) and calculated component styles
   - **All components MUST use theme values - never hardcode styles**
   - Theme structure defined by `ThemeSettings` type exported from this file
   - User configuration allows customization of all visual aspects without modifying source code
3. **StyleProvider** ([src/components/style/index.tsx](src/components/style/index.tsx)): Caches derived styles and component-specific configurations
   - Hook: `useStyle()` - Returns cached style calculations based on theme
   - Provides derived colors (borders, dividers, interactive states, text colors)
   - Component-specific styles: menuItem, menuHeader, divider, listItem, button, alert, modal, datasheet
   - Uses `@o2ter/colors.js` for dynamic color derivations from theme
   - Currently used across menu, button, alert, modal, and datasheet components
   - **CRITICAL: Always audit and clean up StyleProvider when modifying components:**
     - Before removing any component or feature, check if it has styles in StyleProvider
     - Remove unused style properties and their intermediate calculation variables
     - Search codebase for `style.componentName.*` to verify property usage
     - Keep StyleProvider lean - unused styles add computation overhead on every render
     - See "StyleProvider Maintenance" section in Code Quality guidelines for audit process

**See "Context Providers Pattern" section below for how to create new providers correctly in Frosty.**

## Build & Development Workflow

### Building the Library
```bash
yarn rollup          # Builds dist/ (CJS + ESM + .d.ts)
yarn clean           # Removes dist/ before build
```
Output: `dist/index.js` (CJS), `dist/index.mjs` (ESM), `dist/index.d.ts` (types)

### Development & Testing
```bash
yarn start           # Runs frosty dev server (hot reload on http://localhost:8080)
./scripts/test       # Spins up PostgreSQL Docker + dev server
```
- Dev environment lives in `test/` directory
- `server.config.js` configures Frosty server (entry points, output path)
- Test server ([test/server.ts](test/server.ts)) sets up proto.io with PostgreSQL storage
- Test app ([test/app.tsx](test/app.tsx) → [test/main/index.tsx](test/main/index.tsx)) instantiates Dashboard with ProtoClient

### Docker Test Setup
The `./scripts/test` script:
1. Spins up PostgreSQL container with random name suffix
2. Sets environment variables (POSTGRES_DATABASE, USERNAME, PASSWORD)
3. Runs `yarn start` with Docker cleanup on exit
4. Uses credentials: `o2ter/o2ter`, master user: `admin/password`

## Code Conventions

### File Structure
- **All source files** include MIT license header (25 lines)
- Index files re-export components
- Use lodash (`import _ from 'lodash'`) for utilities

### Context Providers Pattern (Frosty-specific)

**CRITICAL: Frosty's context API differs from React.** Follow this exact pattern:

#### Creating a Context Provider
```tsx
import { createContext, useContext, useMemo, PropsWithChildren } from 'frosty';

// 1. Create context WITHOUT default value or undefined type
const MyContext = createContext<MyContextType>();

// 2. Create provider using <Context value={...}> directly (NOT Context.Provider)
export const MyProvider = ({ children }: PropsWithChildren<{}>) => {
  const value = useMemo(() => ({ /* calculated values */ }), [deps]);
  
  return (
    <MyContext value={value}>
      {children}
    </MyContext>
  );
};

// 3. Create hook with non-null assertion (using !)
export const useMyContext = () => useContext(MyContext)!;
```

#### Key Differences from React
- **NO `.Provider`** - Use `<Context value={...}>` directly
- **NO default value** - `createContext<Type>()` not `createContext<Type | undefined>(undefined)`
- **Non-null assertion in hook** - `useContext(Context)!` assumes context always exists
- **NO manual error checking** - Trust the context will be available when hook is called

#### Examples in Codebase
- **ProtoProvider** ([src/proto.tsx](src/proto.tsx)): 
  ```tsx
  const Context = createContext<ProtoContextType>();
  // Provider: <Context value={value}>{children}</Context>
  // Hook: useContext(Context)!.proto
  ```
- **ThemeProvider** ([src/components/theme/index.tsx](src/components/theme/index.tsx)):
  ```tsx
  const Context = createContext<ThemeSettings>();
  // Provider: <Context value={value}>{children}</Context>
  // Hook: useContext(Context) ?? defaultTheme
  ```
- **StyleProvider** ([src/components/style/index.tsx](src/components/style/index.tsx)):
  ```tsx
  const StyleContext = createContext<MenuStyle>();
  // Provider: <StyleContext value={style}>{children}</StyleContext>
  // Hook: useContext(StyleContext)!
  ```

### Styling & Theme System

**CRITICAL: ALWAYS use the theme system for ALL styles. Never hardcode values.**

#### Theme Usage
1. **Import and use the hook** in every component that needs styling:
   ```tsx
   import { useTheme } from '../components/theme';
   
   const MyComponent = () => {
     const theme = useTheme();
     // Now use theme values
   };
   ```

2. **Inline styles only** - No CSS modules or separate stylesheets
3. **All style values MUST come from theme** - Never use hardcoded colors, spacing, or font sizes
4. **Style objects use camelCase properties**

#### Available Theme Values
The `useTheme()` hook returns a complete theme object with:

**Core Theme Settings:**
- `theme.colors`: All color values
- `theme.spacing`: Spacing scale (`xs: 4`, `sm: 8`, `md: 12`, `lg: 16`, `xl: 24`)
- `theme.fontSize`: Font sizes (`xs: 12`, `sm: 14`, `md: 16`, `lg: 20`)
- `theme.borderRadius`: Border radius values (`sm: 2`, `md: 4`, `lg: 8`)
- `theme.fontWeight`: Font weights (`normal: 400`, `medium: 500`, `semibold: 600`)

**CRITICAL: Theme Color Properties**

**Always check [src/components/theme/index.tsx](src/components/theme/index.tsx) before using `theme.colors.*` properties!**

The `theme.colors` object contains:
- **Base colors**: `primary`, `tint`, `success`, `info`, `warning`, `error` (defined in defaultTheme)
- **Weight variants**: Each base color has variants like `primary-100` through `primary-900` (generated by useTheme)
- **Contrast function**: `theme.colorContrast(color)` - Returns best contrasting text color for a background

**Common mistakes:**
- ❌ `theme.colors.text` - **DOES NOT EXIST**
- ❌ `theme.colors.textSecondary` - **DOES NOT EXIST**  
- ❌ `theme.colors.background` - **DOES NOT EXIST**
- ❌ `theme.colors.border` - **DOES NOT EXIST**

**Create derived colors instead:**
```tsx
// Get text color that contrasts with background
const textColor = theme.colorContrast('#ffffff');

// Create secondary text with opacity
const textSecondary = withOpacity(textColor, 0.6);

// Use StyleProvider for complex derived colors
const style = useStyle();
const borderColor = style.divider.borderColor;
```

**Before using any theme property, verify it exists by:**
1. Checking the theme type definition in [src/components/theme/index.tsx](src/components/theme/index.tsx)
2. Using TypeScript autocomplete to see available properties
3. Running `get_errors` tool to catch type errors immediately

#### Color Mixing with @o2ter/colors.js
**IMPORTANT: Always use @o2ter/colors.js for color manipulation and mixing.**

When you need to:
- Mix colors together
- Lighten or darken colors
- Adjust opacity/alpha
- Create color variations

Use the `@o2ter/colors.js` library instead of writing custom color manipulation logic:
```tsx
import { 
  mixColor, shiftColor, tintColor, shadeColor, 
  colorContrast, rgba, getAlpha, getRed, getGreen, getBlue,
  normalizeColor, toHexString 
} from '@o2ter/colors.js';

// Mix two colors (weight: 0 = all color2, 1 = all color1)
const mixed = mixColor(theme.colors.primary, '#fafbfc', 0.5);

// Shift color lighter (negative) or darker (positive)
const lighter = shiftColor(theme.colors.primary, -0.3); // Lighten
const darker = shiftColor(theme.colors.primary, 0.3);   // Darken

// Tint (mix with white) or shade (mix with black)
const tinted = tintColor(theme.colors.primary, 0.2);  // Lighter
const shaded = shadeColor(theme.colors.primary, 0.2); // Darker

// Get best contrasting color for accessibility
const textColor = colorContrast(backgroundColor, '#000000', '#ffffff');

// Adjust opacity by extracting RGB and creating new RGBA
const normalizedColor = normalizeColor(theme.colors.primary);
if (normalizedColor) {
  const withOpacity = toHexString(rgba(
    getRed(normalizedColor),
    getGreen(normalizedColor),
    getBlue(normalizedColor),
    Math.round(255 * 0.5) // 50% opacity
  ), true);
}
```

**Available functions:**
- `mixColor(color1, color2, weight)` - Interpolate between two colors
- `shiftColor(color, weight)` - Shift lighter (negative) or darker (positive)
- `tintColor(color, weight)` - Mix with white to lighten
- `shadeColor(color, weight)` - Mix with black to darken
- `colorContrast(bg, dark, light, minRatio?)` - Find best contrasting color
- `normalizeColor(color)` - Parse color string to ColorValue
- `rgba(r, g, b, a?)` - Create color from RGBA components (0-255)
- `getRed/getGreen/getBlue/getAlpha(color)` - Extract color components
- `toHexString(color, includeAlpha?)` - Convert to hex string
- `luminance(color)` - Calculate relative luminance (WCAG 2.1)
- `contrastRatio(bg, fg)` - Calculate contrast ratio (WCAG 2.1)

This ensures:
- Consistent color manipulation across the codebase
- Proper color space calculations and WCAG-compliant contrast
- Type-safe color operations with ColorValue types

#### Theme Customization
Users can customize the theme by passing a partial `ThemeSettings` object to the Dashboard:
```tsx
<Dashboard 
  proto={client}
  theme={{
    colors: {
      primary: '#ff5722',
    },
    spacing: {
      md: 16,
      lg: 20,
    },
  }}
/>
```

#### Creating Harmonious Color Schemes
**CRITICAL: Always assume users provide random colors that may not be coordinated.**

When users provide theme colors (especially primary colors), you MUST derive a harmonious color palette using color theory principles and `@o2ter/colors.js`. Never use user-provided colors in isolation.

**Color Derivation Strategy:**
1. **Analyze the primary color's luminance** - Determine if it's light, middle, or dark
2. **Apply appropriate mixing strategy** based on luminance:
   - **Light colors** (luminance > 0.7): Use more shading, less tinting; darker interactive states
   - **Middle colors** (0.3 ≤ luminance ≤ 0.7): Balanced tinting and shading
   - **Dark colors** (luminance < 0.3): Use more tinting, less shading; lighter interactive states
3. **Generate complementary colors** using color theory:
   - **Secondary colors**: Mix primary with complementary hues for accent colors
   - **Tints and shades**: Create lighter/darker variations for hierarchy
   - **Neutral colors**: Derive grays by mixing primary with its complement for cohesion
4. **Ensure sufficient contrast** - Use `colorContrast()` for text/background pairs
5. **Create interactive state colors** - Derive hover, active, and disabled states based on luminance

**Example Color Derivation:**
```tsx
import { mixColor, shiftColor, tintColor, shadeColor, colorContrast, luminance, normalizeColor } from '@o2ter/colors.js';

// User provides random primary color
const userPrimary = '#ff5722'; // Random orange

// Step 1: Analyze luminance to determine color brightness
const primaryColor = normalizeColor(userPrimary);
const primaryLuminance = primaryColor ? luminance(primaryColor) : 0.5;

// Categorize: light (> 0.7), middle (0.3-0.7), dark (< 0.3)
const isLight = primaryLuminance > 0.7;
const isDark = primaryLuminance < 0.3;
const isMiddle = !isLight && !isDark;

// Step 2: Derive harmonious palette with luminance-aware mixing
const primary = userPrimary;
const secondary = shiftColor(primary, 0.33); // Shift hue for accent

// Adjust semantic colors based on primary luminance
const success = isLight 
  ? mixColor(primary, '#059669', 0.4) // Darker green for light primary
  : mixColor(primary, '#10b981', 0.3); // Standard green blend

const danger = isLight
  ? mixColor(primary, '#dc2626', 0.7) // Darker red for light primary
  : mixColor(primary, '#ef4444', 0.7); // Standard red blend

const warning = isLight
  ? shadeColor(shiftColor(primary, 0.15), 0.1) // Darken for light primary
  : tintColor(shiftColor(primary, 0.15), 0.2); // Lighten for dark primary

// Derive backgrounds with luminance-aware tinting
const background = isLight
  ? mixColor(primary, '#ffffff', 0.05) // Stronger tint for light colors
  : mixColor(primary, '#ffffff', 0.02); // Subtle tint for dark colors

const surface = isLight
  ? mixColor(primary, '#f1f5f9', 0.08)
  : mixColor(primary, '#f8f9fa', 0.03);

// Derive neutrals by mixing primary with its complement
const complement = shiftColor(primary, 0.5); // Opposite on color wheel
const textPrimary = mixColor(complement, '#1a1a1a', 0.85); // Near-black with subtle complement
const textSecondary = mixColor(complement, '#6b7280', 0.7);
const border = mixColor(primary, '#e5e7eb', 0.1);

// Interactive states: luminance-aware approach
const primaryHover = isLight
  ? shadeColor(primary, 0.2) // More shading for light colors
  : isDark
    ? tintColor(primary, 0.15) // More tinting for dark colors
    : shadeColor(primary, 0.15); // Balanced for middle colors

const primaryActive = isLight
  ? shadeColor(primary, 0.3)
  : isDark
    ? tintColor(primary, 0.25)
    : shadeColor(primary, 0.25);

const primaryDisabled = isLight
  ? tintColor(primary, 0.4) // Subtle tint for light colors
  : isDark
    ? shadeColor(primary, 0.5) // Darken dark colors when disabled
    : tintColor(primary, 0.6); // Standard tint for middle colors
```

**Key Principles:**
- **Never use arbitrary color values** - All colors must relate to the user's base color(s)
- **Mix, don't pick** - Always derive new colors by mixing existing ones
- **Maintain consistent color temperature** - If primary is warm, keep derivatives warm
- **Test contrast ratios** - Use `colorContrast()` to ensure WCAG compliance
- **Think in color systems** - Create tints (lighter), shades (darker), and tones (mixed with gray)

**Color Theory Guidelines:**
- **Analogous colors**: Adjacent on color wheel (harmonious, low contrast)
- **Complementary colors**: Opposite on wheel (high contrast, vibrant)
- **Triadic colors**: Three evenly spaced colors (balanced, colorful)
- **Split-complementary**: Base + two adjacent to complement (dynamic but harmonious)

When implementing themes, always derive a complete, cohesive color system from whatever random colors users provide, ensuring the result looks professionally designed.

#### Styling Checklist
Before writing any styled component, ensure:
- [ ] You've imported and called `useTheme()` at the component top
- [ ] All colors come from `theme.colors.*`
- [ ] All spacing come from `theme.spacing.*`
- [ ] All font sizes come from `theme.fontSize.*`
- [ ] All border radii come from `theme.borderRadius.*`
- [ ] All font weights come from `theme.fontWeight.*`
- [ ] Use `@o2ter/colors.js` for any color mixing, opacity adjustments, or color variations
- [ ] No magic numbers or hardcoded style values
- [ ] Use Icon component (`<Icon name="..." size="..." />`) instead of inline SVG or Unicode symbols

#### Pseudo-Selectors in Inline Styles
**CRITICAL: Frosty supports CSS pseudo-selectors directly in inline styles.**

Use pseudo-selectors like `:hover`, `:active`, `:focus` instead of manual event handlers:

```tsx
// ✅ CORRECT: Use pseudo-selectors in inline styles
<div style={{
  color: theme.colors.text,
  backgroundColor: 'transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.colors.primaryLight,
    transform: 'translateX(2px)',
  },
  '&:active': {
    backgroundColor: theme.colors.primaryDark,
  },
}} />

// ❌ WRONG: Don't manually manage hover state with event handlers
<div 
  style={{ color: theme.colors.text }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = theme.colors.primaryLight;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
  }}
/>
```

**Key Points:**
- **Use `&:hover`, `&:active`, `&:focus`** for interactive states
- **Supports nested selectors** like `&:hover > span` or `& > .child`
- **More declarative and maintainable** than event handlers
- **Better performance** - CSS handles the state changes
- **Works with transitions** - Smooth animations between states
- **Example**: See [src/components/menu/index.tsx](src/components/menu/index.tsx) for MenuItem and list item hover effects

**Conditional Pseudo-Selectors:**
```tsx
<div style={{
  // Base styles
  color: isActive ? activeColor : normalColor,
  // Only add hover effect when not active
  ...(!isActive && {
    '&:hover': {
      backgroundColor: hoverColor,
    },
  }),
}} />
```

#### Animations with Inline Keyframes
**CRITICAL: Frosty supports CSS animations directly in inline styles using the `keyframes` property.**

When you need animations, use inline keyframes instead of injecting CSS:

```tsx
// ✅ CORRECT: Use inline keyframes with Frosty
<div style={{
  animation: '1s ease-in-out infinite',
  keyframes: {
    '0%': { opacity: 0, transform: 'translateY(-10px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' },
  },
}} />

// ❌ WRONG: Don't inject CSS or create <style> tags
const injectKeyframes = () => {
  const style = document.createElement('style');
  style.textContent = '@keyframes ...';
  document.head.appendChild(style);
};
```

**Key Points:**
- **Use `keyframes` property** directly in inline styles
- **No CSS injection needed** - Frosty handles keyframes internally
- **Animation property format**: `'<duration> <timing-function> <iteration-count>'`
- **Keyframe keys** are strings: `'0%'`, `'50%'`, `'100%'`, or keywords like `'from'`, `'to'`
- **Example component**: See [src/components/spinner/index.tsx](src/components/spinner/index.tsx) for a complete implementation

**Spinner Component Example:**
```tsx
export const Spinner = ({ color = 'currentColor', speed = 0.6 }: SpinnerProps) => (
  <span style={{
    display: 'block',
    width: '100%',
    height: '100%',
    border: '2px solid transparent',
    borderTopColor: color,
    borderRadius: '50%',
    animation: `${speed}s linear infinite`,
    keyframes: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
  }} />
);
```

This approach keeps all styling in JavaScript/TypeScript, maintains type safety, and avoids DOM manipulation.

#### SVG Icons for UI Symbols
**CRITICAL: Use the Icon component for all UI icons. Do not create inline SVGs.**

All SVG icons in the codebase are consolidated into the Icon component ([src/components/icon/index.tsx](src/components/icon/index.tsx)). Always use `<Icon name="..." size="..." />` instead of inline SVG markup.

```tsx
// ✅ CORRECT: Use Icon component
import { Icon } from '../components/icon';
<button onClick={handleClose}>
  <Icon name="close" size="xs" />
</button>

// ❌ WRONG: Don't create inline SVG
<button onClick={handleClose}>
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M9.5 2.5L2.5 9.5M2.5 2.5L9.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
</button>

// ❌ WRONG: Don't use Unicode symbols
<button>✕</button>
<button>🔍</button>
```

**See "Icon Component" section below for complete documentation on available icons and usage.**

**Adding New Icons:**

When you need to add a new icon that doesn't exist in the Icon component:
1. Add the icon definition to the `iconPaths` object in [src/components/icon/index.tsx](src/components/icon/index.tsx)
2. Add the icon name to the `IconName` type
3. Update the `isStrokeIcon()` or `isFillIcon()` function if needed
4. Use the new icon: `<Icon name="newIconName" size="md" />`

All icons should use `currentColor` to inherit theme colors and follow consistent sizing patterns.

#### Icon Component
**CRITICAL: Always use the Icon component instead of inline SVG for all icons in the codebase.**

The Icon component ([src/components/icon/index.tsx](src/components/icon/index.tsx)) provides a centralized, type-safe way to use all SVG icons throughout the application.

**Available Icons:**
```tsx
type IconName =
  | 'close'           // X icon for closing/removing (12x12 base)
  | 'closeFilled'     // Filled X icon for dismissing alerts (20x20 base)
  | 'search'          // Magnifying glass icon (16x16 base)
  | 'sortAsc'         // Upward triangle for ascending sort (12x12 base)
  | 'sortDesc'        // Downward triangle for descending sort (12x12 base)
  | 'chevronLeft'     // Left arrow for previous (12x12 base)
  | 'chevronRight'    // Right arrow for next (12x12 base)
  | 'chevronDoubleLeft'  // Double left arrow for first page (12x12 base)
  | 'chevronDoubleRight' // Double right arrow for last page (12x12 base)
  | 'success'         // Checkmark in circle for success alerts (20x20 base)
  | 'info'            // Info 'i' in circle for info alerts (20x20 base)
  | 'warning'         // Triangle with exclamation for warnings (20x20 base)
  | 'error'           // X in circle for error alerts (20x20 base);

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | number;
```

**Size mapping:**
- `xs`: 12px
- `sm`: 14px
- `md`: 16px
- `lg`: 20px
- Custom: Any number for pixel size

**Usage:**
```tsx
import { Icon } from '../components/icon';

// Basic usage
<Icon name="close" size="xs" />

// With custom size
<Icon name="search" size={18} />

// With inline styles
<Icon name="chevronRight" size="sm" style={{ marginLeft: 4 }} />

// In buttons
<button onClick={handleClose}>
  <Icon name="close" size="sm" />
</button>
```

**Benefits:**
- **Type safety** - Icon names are type-checked
- **Consistent sizing** - Predefined size scale
- **Automatic stroke/fill** - Icons automatically use stroke or fill based on type
- **Theme integration** - All icons use `currentColor` to inherit theme colors
- **Single source of truth** - Update an icon once, changes everywhere
- **Better maintainability** - No duplicate SVG code scattered across files

**When to use:**
- **Always** - Use Icon component for all icons throughout the codebase
- Replace inline SVGs with Icon component when refactoring
- Add new icons to the Icon component definition when needed

**Example - Refactoring inline SVG to Icon component:**
```tsx
// ❌ WRONG: Inline SVG
<button onClick={handleClose}>
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M9.5 2.5L2.5 9.5M2.5 2.5L9.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
</button>

// ✅ CORRECT: Use Icon component
<button onClick={handleClose}>
  <Icon name="close" size="xs" />
</button>
```

### TypeScript Patterns
- Strict mode enabled
- Component types: `ComponentType<Props>` from frosty
- Props with children: `PropsWithChildren<Props>`
- No `React.FC` or `React.ReactNode` (use frosty equivalents)

### Event Handlers Pattern: _useCallbacks + useEffect

**CRITICAL: Frosty's `_useCallbacks` and `useCallback` automatically capture the latest state/props without dependency arrays.**

**Key Difference from React:**
- **Frosty**: Callbacks always have access to current state/props automatically - NO dependency arrays needed
- **React**: Must manually specify dependencies or callbacks become stale

When setting up document-level or persistent event listeners, use this pattern:

#### The Pattern
```tsx
import { _useCallbacks, useEffect, useRef } from 'frosty';
import { useDocument } from 'frosty/web';

const MyComponent = ({ onAction, data }) => {
  const ref = useRef<HTMLElement>();
  const doc = useDocument();

  // 1. Define all handlers in _useCallbacks with their dependencies
  const {
    handleClick,
    handleKeyDown,
    handleMouseMove,
  } = _useCallbacks({
    handleClick: (e: MouseEvent) => {
      // Handler has access to current props/state via closure
      if (data.length > 0) {
        onAction?.(data[0]);
      }
    },
    handleKeyDown: (e: KeyboardEvent) => {
      // Another handler with prop dependencies
      console.log('Key pressed:', e.key);
    },
    handleMouseMove: (e: MouseEvent) => {
      // Handler can access refs
      if (ref.current?.contains(e.target as Node)) {
        // Do something
      }
    },
  });

  // 2. Register listeners with empty dependency array
  useEffect(() => {
    doc.addEventListener('click', handleClick);
    doc.addEventListener('keydown', handleKeyDown);
    doc.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      doc.removeEventListener('click', handleClick);
      doc.removeEventListener('keydown', handleKeyDown);
      doc.removeEventListener('mousemove', handleMouseMove);
    };
  }, []); // Empty deps - _useCallbacks handles updates

  return <div ref={ref}>Content</div>;
};
```

#### Key Points
- **Use `_useCallbacks`** to define event handlers that need access to current props/state
- **Handlers automatically update** - In Frosty, callbacks ALWAYS capture latest state/props (no deps needed)
- **useEffect with empty deps** - Register listeners once, they always call latest handler version
- **Always clean up** - Return cleanup function from useEffect to remove listeners
- **Document-level listeners** - Use `useDocument()` from `frosty/web` for document events
- **Ref access in handlers** - Handlers can safely access refs without causing re-registration
- **No dependency arrays** - Unlike React, Frosty's `_useCallbacks` and `useCallback` don't need deps

#### Why This Pattern?
- **Prevents listener thrashing** - Listeners aren't removed/re-added on every render
- **Always current** - Handlers have access to latest props/state automatically (Frosty feature)
- **Memory safe** - Cleanup function ensures no listener leaks
- **Type-safe** - Full TypeScript support for event types
- **Simpler than React** - No need to manage dependency arrays manually

#### Real Example
See [src/components/datasheet/index.tsx](src/components/datasheet/index.tsx) for a complete implementation:
```tsx
const {
  handleMouseDown,
  handleMouseUp,
  handleCopy,
  handlePaste,
  handleKeyDown,
} = _useCallbacks({
  handleMouseDown: (e: MouseEvent) => {
    setState(currentState => {
      // Access latest state via functional update
      if (!_.isNil(currentState.editing)) {
        // Complex logic with current state
      }
      return newState;
    });
  },
  // ... more handlers
});

useEffect(() => {
  doc.addEventListener('mousedown', handleMouseDown);
  doc.addEventListener('mouseup', handleMouseUp);
  doc.addEventListener('copy', handleCopy);
  doc.addEventListener('paste', handlePaste);
  doc.addEventListener('keydown', handleKeyDown);
  
  return () => {
    doc.removeEventListener('mousedown', handleMouseDown);
    doc.removeEventListener('mouseup', handleMouseUp);
    doc.removeEventListener('copy', handleCopy);
    doc.removeEventListener('paste', handlePaste);
    doc.removeEventListener('keydown', handleKeyDown);
  };
}, []); // Handlers update automatically via _useCallbacks
```

#### When NOT to Use This Pattern
- **Simple inline handlers** - Use regular inline functions for onClick, onChange, etc.
- **Direct element events** - For events on JSX elements, use inline handlers
- **Single-use callbacks** - Use `useCallback` for memoizing individual callbacks (no deps needed in Frosty)

This pattern is specifically for:
- Document-level or window-level event listeners
- Event listeners that need to be registered once but access changing data
- Complex event handling logic that needs current state/props

#### Helper Functions Inside _useCallbacks
**IMPORTANT: Don't wrap helper functions in `useMemo` when they're only used inside `_useCallbacks`.**

Since `_useCallbacks` manages dependencies automatically and always provides handlers with current closures, helper functions defined outside can be regular functions:

```tsx
// ✅ CORRECT: Regular function, no useMemo needed
const encodeClipboard = (e: ClipboardEvent, data: any[][]) => {
  const encoders = { ...defaultEncoders, ...customEncoders };
  // ... encoding logic
};

const { handleCopy } = _useCallbacks({
  handleCopy: (e: ClipboardEvent) => {
    // This handler has access to latest encodeClipboard
    encodeClipboard(e, selectedData);
  },
});

// ❌ WRONG: Unnecessary useMemo
const encodeClipboard = useMemo(() => (e: ClipboardEvent, data: any[][]) => {
  const encoders = { ...defaultEncoders, ...customEncoders };
  // ... encoding logic
}, [customEncoders]);
```

**Why not useMemo?**
- `_useCallbacks` already captures latest values - handlers always call the current version of helper functions
- Helper function is recreated on each render, but it doesn't matter because `_useCallbacks` provides stable references
- Adding `useMemo` adds complexity without performance benefit in this pattern
- The event listeners registered in `useEffect` don't change, they just call the latest handler from `_useCallbacks`
- **Frosty's callbacks auto-capture latest state** - Unlike React, no manual dependency management needed

**When to use useMemo for helpers:**
- Helper function is passed as a prop to child components (prevents unnecessary re-renders)
- Helper function is used in dependency arrays of other hooks
- Helper function is expensive to create and not used with `_useCallbacks`

### Proto.io Integration
- Dashboard requires `ProtoClient` as prop: `<Dashboard proto={protoClient} />`
- Schema fetched asynchronously via `proto.schema({ master: true })`
- Menu dynamically lists schemas from proto backend
- Pages route to `/classes/:schema` for browsing specific schemas

## Code Quality & Maintenance Guidelines

### Using StyleProvider for Component Styles

**CRITICAL: When creating or modifying components with styles, always use the StyleProvider system.**

#### When to Add Styles to StyleProvider
Add component-specific styles to StyleProvider ([src/components/style/index.tsx](src/components/style/index.tsx)) when:
- Component needs multiple derived colors from the theme
- Styles are used across multiple parts of a component
- Complex color calculations are required (mixing, opacity, luminance-based logic)
- Component will be reused and needs consistent theming

#### StyleProvider Pattern
```tsx
// In src/components/style/index.tsx
const createStyles = (theme: ReturnType<typeof useTheme>) => {
  // Calculate component-specific styles
  const myComponentBg = mixColor(theme.colors.primary, '#F6F8FF', 0.05);
  const myComponentBorder = mixColor(theme.colors.primary, '#DDD', 0.1);
  
  return {
    // ... other styles
    myComponent: {
      background: myComponentBg,
      borderColor: myComponentBorder,
      hoverBackground: withOpacity(theme.colors.primary, 0.1),
    },
  };
};

// In your component
import { useStyle } from '../style';

const MyComponent = () => {
  const style = useStyle();
  
  return (
    <div style={{
      backgroundColor: style.myComponent.background,
      borderColor: style.myComponent.borderColor,
      '&:hover': {
        backgroundColor: style.myComponent.hoverBackground,
      },
    }}>
      Content
    </div>
  );
};
```

#### Benefits of StyleProvider
- **Performance**: Styles calculated once, cached, and reused
- **Consistency**: All components use same color derivation logic
- **Maintainability**: Theme changes automatically propagate to all components
- **Type Safety**: Full TypeScript support for style properties

### Code Cleanliness Checklist

Before submitting code, verify:

#### 1. No Hardcoded Values
- [ ] No hardcoded colors (e.g., `'#FF5722'`, `'white'`, `'rgba(0,0,0,0.5)'`)
- [ ] No hardcoded spacing values (use `theme.spacing.*`)
- [ ] No hardcoded font sizes (use `theme.fontSize.*`)
- [ ] No magic numbers in styles

#### 2. No Unused Code
- [ ] Remove unused imports (e.g., `useMemo`, `useState` if not used)
- [ ] Remove unused variables and constants
- [ ] Remove commented-out code
- [ ] Remove debug console.log statements

#### 2.5. No Code Duplication
**CRITICAL: Always extract duplicated code into shared functions.**

**PROACTIVE REFACTORING: If you discover duplicated code at any time during development, refactor it immediately. Do not wait or ask permission - eliminate duplication as soon as you spot it.**

- [ ] **Scan for duplicated code blocks** - If the same logic appears in multiple places, extract it
- [ ] **Create shared functions** - Extract common patterns into reusable functions
- [ ] **DRY principle** - Don't Repeat Yourself - each piece of logic should exist in one place
- [ ] **Check before and after changes** - When modifying code, look for duplication opportunities
- [ ] **Refactor on discovery** - Whenever you encounter duplicated code while reading, editing, or debugging, refactor it immediately

**Example - Duplicated encoding logic:**
```tsx
// ❌ WRONG: Same encodeClipboard function defined in handleCopy AND handleKeyDown
const { handleCopy, handleKeyDown } = _useCallbacks({
  handleCopy: (e: ClipboardEvent) => {
    const encodeClipboard = (e, data) => { /* 25 lines of encoding logic */ };
    encodeClipboard(e, selectedData);
  },
  handleKeyDown: (e: KeyboardEvent) => {
    const encodeClipboard = (e, data) => { /* SAME 25 lines duplicated! */ };
    encodeClipboard(e, selectedData);
  },
});

// ✅ CORRECT: Extract to shared function
const encodeClipboard = (e: ClipboardEvent | KeyboardEvent, data: any[][]) => {
  /* 25 lines of encoding logic - defined ONCE */
};

const { handleCopy, handleKeyDown } = _useCallbacks({
  handleCopy: (e: ClipboardEvent) => encodeClipboard(e, selectedData),
  handleKeyDown: (e: KeyboardEvent) => encodeClipboard(e, selectedData),
});
```

**Benefits of eliminating duplication:**
- **Single source of truth** - Bug fixes and improvements only need to be made once
- **Maintainability** - Changes don't need to be synchronized across multiple locations
- **Readability** - Intent is clearer when logic isn't obscured by repetition
- **Smaller file size** - Less code to load and parse

**When to extract:**
- Code block appears 2+ times (even if slightly different - parameterize the differences)
- Logic is complex enough that a descriptive function name would aid understanding
- Pattern is likely to be reused elsewhere in the future

#### 3. Type Errors
- [ ] **RUN `get_errors` IMMEDIATELY after writing/modifying code**
- [ ] All TypeScript errors are resolved
- [ ] No property access errors (e.g., accessing non-existent theme properties)
- [ ] Function signatures match their definitions
- [ ] No type assertions (`as any`) used to bypass errors

#### 4. Consistent Style Pattern
- [ ] All components with styles import and call `useTheme()`
- [ ] Components with complex styles use `useStyle()` and StyleProvider
- [ ] Color manipulations use `@o2ter/colors.js` functions
- [ ] Pseudo-selectors (`&:hover`) used instead of manual event handlers for styling

#### 5. StyleProvider Maintenance
**CRITICAL: Always audit StyleProvider when modifying or removing components/features.**

When modifying or removing components:
- [ ] Check if their styles in StyleProvider are still being used
- [ ] Remove unused style properties to prevent bloat
- [ ] Update style calculations if theme dependencies change
- [ ] Keep StyleProvider lean with only actively used styles
- [ ] Search for property usage across codebase: `grep -r "style\.componentName\.propertyName" src/`
- [ ] Remove any intermediate calculation variables that are no longer needed

**Why This Matters:**
- Unused styles add unnecessary computation overhead on every theme change
- Dead code in StyleProvider creates maintenance burden
- Bloated style objects increase memory footprint
- Future developers may think unused properties are required

**How to Audit:**
1. **Search for usage**: Use grep/search to find `style.componentName.*` patterns
2. **Check intermediate variables**: Look for variables only used to calculate removed properties
3. **Remove calculations**: Delete color mixing, opacity, and other derivations for unused properties
4. **Test**: Verify no compilation errors and visual consistency remains

### Example: Converting Hardcoded Styles to StyleProvider

**Before (Hardcoded):**
```tsx
const MyComponent = () => {
  const borderColor = mixColor(theme.colors.primary, '#DDD', 0.1);
  const bg = 'white';
  const hoverBg = 'rgba(33, 133, 208, 0.15)';
  
  return <div style={{ borderColor, backgroundColor: bg }} />;
};
```

**After (Using StyleProvider):**
```tsx
// In src/components/style/index.tsx
const myComponentBorder = mixColor(theme.colors.primary, '#DDD', 0.1);
const myComponentBg = theme.colorContrast(theme.colors.primary) === '#ffffff' 
  ? '#ffffff' 
  : mixColor(theme.colors.primary, '#ffffff', 0.02);
const myComponentHoverBg = withOpacity(theme.colors.tint, 0.15);

return {
  myComponent: {
    borderColor: myComponentBorder,
    bg: myComponentBg,
    hoverBg: myComponentHoverBg,
  },
};

// In component
import { useStyle } from '../style';

const MyComponent = () => {
  const style = useStyle();
  
  return (
    <div style={{
      borderColor: style.myComponent.borderColor,
      backgroundColor: style.myComponent.bg,
      '&:hover': {
        backgroundColor: style.myComponent.hoverBg,
      },
    }} />
  );
};
```

### Refactoring Workflow
1. **Identify hardcoded values** - Search for hex colors, rgba, hardcoded numbers
2. **Add to StyleProvider** - Calculate derived colors in `createStyles()`
3. **Update components** - Replace hardcoded values with `style.*` references
4. **Remove unused imports** - Clean up color manipulation imports from components
5. **Test** - Verify no compilation errors and visual consistency
6. **Verify** - Check that all components respond to theme changes

## Common Pitfalls

1. **Always check type errors FIRST** - Run `get_errors` tool immediately after writing or modifying code. NEVER assume your code is correct. TypeScript errors reveal API misunderstandings, non-existent properties, and incorrect function usage. Fix all errors before proceeding.
2. **Don't assume library APIs** - ALWAYS verify the actual API documentation before use. Libraries with similar purposes (like Frosty vs React) often have fundamentally different APIs. Check the docs, examine existing code patterns, and review type definitions. Never assume a library works like another one you know.
3. **Don't import from 'react'** - Use `frosty` instead. Frosty has its own implementation of hooks, context, and JSX runtime.
4. **Don't use React context pattern** - Frosty uses `<Context value={...}>` directly, NOT `<Context.Provider value={...}>`. This is a fundamental API difference.
5. **Context creation** - Use `createContext<Type>()` without default value, not `createContext<Type | undefined>(undefined)`. Frosty's context API differs from React.
6. **Don't hardcode styles** - Always use `useTheme()` hook for all style values. Never use magic numbers or literal color values.
7. **Check theme.colors properties exist** - ALWAYS verify theme properties exist in [src/components/theme/index.tsx](src/components/theme/index.tsx) before use. Properties like `theme.colors.text`, `theme.colors.textSecondary`, `theme.colors.background`, `theme.colors.border` **DO NOT EXIST**. Use `theme.colorContrast()` to derive text colors and `@o2ter/colors.js` functions to create color variations. Run `get_errors` tool immediately after writing code to catch type errors.
8. **Don't inject CSS** - Use inline `keyframes` property for animations instead of document.createElement('style') or DOM manipulation
9. **Don't use manual hover handlers** - Use `&:hover` pseudo-selectors in inline styles instead of onMouseEnter/onMouseLeave event handlers
10. **Don't use Unicode symbols or inline SVGs** - Use the Icon component (`<Icon name="close" size="xs" />`) for all UI icons. The Icon component provides type-safe, centralized icon management. Never create inline SVG markup or use Unicode symbols (✕, →, ←, 🔍, etc.) for UI elements. See [src/components/icon/index.tsx](src/components/icon/index.tsx) for available icons.
11. **Router navigation** - Use `location.pushState()`, not `navigate()` or `history.push()`. Our custom router has different APIs than React Router.
12. **Context access** - Always call hooks inside components, not in conditionals
13. **Build before publishing** - Run `yarn rollup` to generate dist/ artifacts
14. **Path separators** - Use forward slashes `/` in all configs, even on Windows
15. **ProtoProvider wrapping** - Dashboard handles this internally; test apps must wrap with ProtoProvider manually
16. **Missing theme imports** - Every component with styles needs `import { useTheme } from '../components/theme'`
17. **StyleProvider maintenance** - When modifying or removing ANY component, always audit StyleProvider ([src/components/style/index.tsx](src/components/style/index.tsx)) for unused styles. Search for `style.componentName.*` usage patterns across the codebase before and after changes. Remove unused style properties and intermediate calculation variables. Dead code in StyleProvider creates unnecessary computation overhead on every render and maintenance burden.
18. **Event handler dependencies** - Use `_useCallbacks` for document-level event listeners instead of `useCallback`. Register listeners with empty dependency array in `useEffect` - `_useCallbacks` handles updates automatically.

## Key Files to Reference
- [src/index.tsx](src/index.tsx) - Main Dashboard export
- [src/proto.tsx](src/proto.tsx) - Proto context and providers
- [src/components/theme/index.tsx](src/components/theme/index.tsx) - Complete theming system (ThemeProvider, useTheme, ThemeSettings type)
- [src/components/style/index.tsx](src/components/style/index.tsx) - StyleProvider for cached component styles (menu, button, alert, modal, datasheet) - ALWAYS audit when modifying components
- [src/components/icon/index.tsx](src/components/icon/index.tsx) - Reusable Icon component with all SVG icons (close, search, chevrons, sort, alerts)
- [src/components/spinner/index.tsx](src/components/spinner/index.tsx) - Reusable spinner component (example of inline keyframes)
- [src/components/router/index.tsx](src/components/router/index.tsx) - Custom router implementation
- [src/components/menu/index.tsx](src/components/menu/index.tsx) - Dynamic menu from schema
- [src/components/datasheet/index.tsx](src/components/datasheet/index.tsx) - DataSheet component (example of _useCallbacks + useEffect pattern for event listeners)
- [test/server.ts](test/server.ts) - Example proto.io service setup
- [rollup.config.mjs](rollup.config.mjs) - Build configuration
