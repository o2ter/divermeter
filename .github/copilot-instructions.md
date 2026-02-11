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
  dashboard/
    index.tsx        # Main layout with Menu + Routes
    components/      # Router, Menu, Theme providers
    pages/           # Browser, Config, Home pages
```

### Custom Router (Not React Router)
- Uses `path-to-regexp` for path matching
- Components: `<Routes>`, `<Route>`, `<Outlet>`
- Hooks: `useParams()` for URL parameters, `useLocation()` for navigation
- Navigate via `location.pushState({}, '/path')`
- See [src/dashboard/components/router/index.tsx](src/dashboard/components/router/index.tsx) for implementation

### Context Providers
1. **ProtoProvider** ([src/proto.tsx](src/proto.tsx)): Provides proto client and schema via context
   - Hooks: `useProto()` returns ProtoClient, `useProtoSchema()` returns schema object
   - Wraps `ThemeProvider` automatically
2. **ThemeProvider** ([src/dashboard/components/theme/index.tsx](src/dashboard/components/theme/index.tsx)): **Centralized theming system - USE THIS FOR ALL STYLES**
   - Hook: `useTheme()` - **MUST be called in every component that uses styles**
   - Accepts optional `theme` prop with partial `ThemeSettings` to override defaults
   - Uses deep merge (`_.merge`) to combine user settings with defaults
   - Provides both base theme values (colors, spacing, fontSize, etc.) and calculated component styles
   - **All components MUST use theme values - never hardcode styles**
   - Theme structure defined by `ThemeSettings` type exported from this file
   - User configuration allows customization of all visual aspects without modifying source code

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
  - `primary`, `secondary`, `menuBackground`, `activeBackground`, `hoverBackground`
  - `borderColor`, `textPrimary`, `textSecondary`, `accentBorder`, `divider`
- `theme.spacing`: Spacing scale (`xs: 4`, `sm: 8`, `md: 12`, `lg: 16`, `xl: 24`)
- `theme.fontSize`: Font sizes (`xs: 12`, `sm: 14`, `md: 16`, `lg: 20`)
- `theme.borderRadius`: Border radius values (`sm: 2`, `md: 4`, `lg: 8`)
- `theme.fontWeight`: Font weights (`normal: 400`, `medium: 500`, `semibold: 600`)

**Calculated Component Styles:**
- `theme.menuItem`: Pre-calculated menu item styles (padding, fontSize, fontWeight, activeFontWeight, borderWidth)
- `theme.menuHeader`: Pre-calculated menu header styles (padding, fontSize, fontWeight, letterSpacing)
- `theme.divider`: Pre-calculated divider styles (margin, borderWidth)
- `theme.listItem`: Pre-calculated list item styles (padding, fontSize)

#### Styling Examples
```tsx
// Basic styling with theme
<div style={{
  padding: theme.spacing.md,
  backgroundColor: theme.colors.menuBackground,
  borderRadius: theme.borderRadius.md,
  color: theme.colors.textPrimary,
}}>Content</div>

// Using calculated component styles
<div style={{
  padding: theme.menuItem.padding,
  fontSize: theme.menuItem.fontSize,
  fontWeight: theme.menuItem.fontWeight,
}}>Menu Item</div>

// Hover/active states
<div style={{
  backgroundColor: isActive 
    ? theme.colors.activeBackground 
    : isHover 
    ? theme.colors.hoverBackground 
    : 'transparent',
  borderLeft: isActive ? `${theme.menuItem.borderWidth}px solid ${theme.colors.accentBorder}` : 'none',
}}>Interactive Item</div>
```

#### Theme Customization
Users can customize the theme by passing a partial `ThemeSettings` object to the Dashboard:
```tsx
<Dashboard 
  proto={client}
  theme={{
    colors: {
      primary: '#ff5722',
      menuBackground: '#fafafa',
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
2. **Don't hardcode styles** - Always use `useTheme()` hook for all style values. Never use magic numbers or literal color values.
3. **Router navigation** - Use `location.pushState()`, not `navigate()` or `history.push()`
4. **Context access** - Always call hooks inside components, not in conditionals
5. **Build before publishing** - Run `yarn rollup` to generate dist/ artifacts
6. **Path separators** - Use forward slashes `/` in all configs, even on Windows
7. **ProtoProvider wrapping** - Dashboard handles this internally; test apps must wrap with ProtoProvider manually
8. **Missing theme imports** - Every component with styles needs `import { useTheme } from '../components/theme'`

## Key Files to Reference
- [src/index.tsx](src/index.tsx) - Main Dashboard export
- [src/proto.tsx](src/proto.tsx) - Proto context and providers
- [src/dashboard/components/theme/index.tsx](src/dashboard/components/theme/index.tsx) - Complete theming system (ThemeProvider, useTheme, ThemeSettings type)
- [src/dashboard/components/router/index.tsx](src/dashboard/components/router/index.tsx) - Custom router implementation
- [src/dashboard/components/menu/index.tsx](src/dashboard/components/menu/index.tsx) - Dynamic menu from schema
- [test/server.ts](test/server.ts) - Example proto.io service setup
- [rollup.config.mjs](rollup.config.mjs) - Build configuration
