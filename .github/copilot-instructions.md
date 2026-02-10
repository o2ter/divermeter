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
2. **ThemeProvider** ([src/dashboard/components/theme/index.tsx](src/dashboard/components/theme/index.tsx)): Configurable theming system
   - Hook: `useTheme()` returns complete theme object
   - Accepts `theme` prop with partial `ThemeSettings` to override defaults
   - All styles are configurable: colors, spacing, fontSize, borderRadius, fontWeight, plus component-specific styles (menuItem, menuHeader, divider, listItem)
   - Use deep merge for theme customization

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

### Styling
- Inline styles only (no CSS modules or separate stylesheets)
- Style objects with camelCase properties
- All theme values accessed via `useTheme()` hook
- Theme is fully customizable - all component styles (menuItem, menuHeader, divider, listItem) are part of ThemeSettings
- Example: `style={{ padding: theme.menuItem.padding, fontSize: theme.fontSize.sm }}`

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
2. **Router navigation** - Use `location.pushState()`, not `navigate()` or `history.push()`
3. **Context access** - Always call hooks inside components, not in conditionals
4. **Build before publishing** - Run `yarn rollup` to generate dist/ artifacts
5. **Path separators** - Use forward slashes `/` in all configs, even on Windows
6. **ProtoProvider wrapping** - Dashboard handles this internally; test apps must wrap with ProtoProvider manually

## Key Files to Reference
- [src/index.tsx](src/index.tsx) - Main Dashboard export
- [src/proto.tsx](src/proto.tsx) - Proto context and providers
- [src/dashboard/components/router/index.tsx](src/dashboard/components/router/index.tsx) - Custom router implementation
- [src/dashboard/components/menu/index.tsx](src/dashboard/components/menu/index.tsx) - Dynamic menu from schema
- [test/server.ts](test/server.ts) - Example proto.io service setup
- [rollup.config.mjs](rollup.config.mjs) - Build configuration
