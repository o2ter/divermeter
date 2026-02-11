# DiVerMeter - Copilot Instructions

## Project Overview
DiVerMeter is a **Frosty-based** dashboard library for proto.io (backend-as-a-service). It provides an admin UI for browsing database schemas, managing classes, and viewing configurations. Built as a distributable npm package.

**CRITICAL: This is NOT a React project.** Do not import from 'react' or use React patterns.

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
   - Component-specific styles: menuItem, menuHeader, divider, listItem
   - Uses `@o2ter/colors.js` for dynamic color derivations from theme
   - Currently used primarily in menu components, but provides general-purpose UI styles
   - **IMPORTANT: Maintain StyleProvider** - When modifying components or removing features:
     - Check if styles in StyleProvider are still being used
     - Remove unused style properties and calculations to avoid bloat
     - Update style calculations when theme dependencies change
     - Keep StyleProvider lean and only include actively used styles

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
- Exports at bottom: `export const Component = ...` then `export default Component`
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
const mixed = mixColor(theme.colors.primary, theme.colors.secondary, 0.5);

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

#### Styling Checklist
Before writing any styled component, ensure:
- [ ] You've imported and called `useTheme()` at the component top
- [ ] All colors come from `theme.colors.*`
- [ ] All spacing comes from `theme.spacing.*`
- [ ] All font sizes come from `theme.fontSize.*`
- [ ] All border radii come from `theme.borderRadius.*`
- [ ] All font weights come from `theme.fontWeight.*`
- [ ] Use `@o2ter/colors.js` for any color mixing, opacity adjustments, or color variations
- [ ] No magic numbers or hardcoded style values

### TypeScript Patterns
- Strict mode enabled
- Component types: `ComponentType<Props>` from frosty
- Props with children: `PropsWithChildren<Props>`
- No `React.FC` or `React.ReactNode` (use frosty equivalents)

### Proto.io Integration
- Dashboard requires `ProtoClient` as prop: `<Dashboard proto={protoClient} />`
- Schema fetched asynchronously via `proto.schema({ master: true })`
- Menu dynamically lists schemas from proto backend
- Pages route to `/classes/:schema` for browsing specific schemas

## Common Pitfalls

1. **Don't import from 'react'** - Use `frosty` instead
2. **Don't use React context pattern** - Frosty uses `<Context value={...}>` directly, NOT `<Context.Provider value={...}>`
3. **Context creation** - Use `createContext<Type>()` without default value, not `createContext<Type | undefined>(undefined)`
4. **Don't hardcode styles** - Always use `useTheme()` hook for all style values. Never use magic numbers or literal color values.
5. **Router navigation** - Use `location.pushState()`, not `navigate()` or `history.push()`
6. **Context access** - Always call hooks inside components, not in conditionals
7. **Build before publishing** - Run `yarn rollup` to generate dist/ artifacts
8. **Path separators** - Use forward slashes `/` in all configs, even on Windows
9. **ProtoProvider wrapping** - Dashboard handles this internally; test apps must wrap with ProtoProvider manually
10. **Missing theme imports** - Every component with styles needs `import { useTheme } from '../components/theme'`
11. **StyleProvider maintenance** - When modifying or removing menu components, always check StyleProvider ([src/components/style/index.tsx](src/components/style/index.tsx)) and remove any unused style calculations. Dead code in style providers creates unnecessary performance overhead and maintenance burden.

## Key Files to Reference
- [src/index.tsx](src/index.tsx) - Main Dashboard export
- [src/proto.tsx](src/proto.tsx) - Proto context and providers
- [src/components/theme/index.tsx](src/components/theme/index.tsx) - Complete theming system (ThemeProvider, useTheme, ThemeSettings type)
- [src/components/style/index.tsx](src/components/style/index.tsx) - StyleProvider for cached menu styles (example of Frosty context pattern)
- [src/components/router/index.tsx](src/components/router/index.tsx) - Custom router implementation
- [src/components/menu/index.tsx](src/components/menu/index.tsx) - Dynamic menu from schema
- [test/server.ts](test/server.ts) - Example proto.io service setup
- [rollup.config.mjs](rollup.config.mjs) - Build configuration
