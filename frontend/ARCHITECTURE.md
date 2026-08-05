# AI Realtime Language Translator — Frontend Architecture (Vite + React on Cloudflare Workers)

This is the strict architecture for `ai-realtime-language-translator/frontend`. It is the entity based architecture of `Architecture-web.md` and `corpland-web/` translated from Next.js App Router to a Vite + React SPA served by Cloudflare Workers with Assets, scaffolded from the official React framework template. `Architecture-web.md` remains the governing philosophy; this document only changes what the framework swap forces to change and records what corpland-web already proved. When in doubt, open `corpland-web/` and mirror how it solved the same problem, then apply the substitution table in section 12.

The one sentence version: **routes are thin, entities own everything about themselves under `src/files/<entity>/`, shared primitives are wrapped once as `*Element`s, every API call flows through `handleApiAction`, and realtime state lives in entity contexts fed by one WebSocket provider.**

---

## 1. Stack

| Concern | corpland-web | This frontend |
|---|---|---|
| Framework | Next.js 15 App Router | Vite + React 19 SPA on Workers Assets |
| Routing | file system router | React Router, `createBrowserRouter`, thin route elements |
| Serving | Vercel | Worker (`worker/index.ts`) + `not_found_handling: "single-page-application"` |
| Styling | Tailwind v4 CSS-first + shadcn/ui | same |
| Motion | `motion` v12 | same, `lib/motion.ts` copied verbatim |
| HTTP | axios | same |
| Realtime | socket.io-client | native WebSocket to the backend RoomDO |
| Toast | sonner via `notify` | same |
| Storage | react-secure-storage + idb-keyval | same |
| Theme | next-themes | `providers/theme-provider.tsx` (class on `<html>`, system aware, same consumer API) |
| Env | `process.env.NEXT_PUBLIC_*` | `import.meta.env.VITE_*` |

Package manager is bun. Server state stays in entity contexts (the house `{ data, isLoading, hasFetched, refetch, upsert }` shape); form state stays in workflow hooks with imperative `notify` validation. No react-query, no form library — same as corpland-web.

---

## 2. Directory Layout (Repo Root)

```
frontend/
  wrangler.jsonc          Worker config, SPA not_found_handling
  vite.config.ts          react() + cloudflare() plugins
  worker/
    index.ts              Edge shell ONLY: sitemap.xml, robots.txt, health. Never product API logic —
                          the product backend is ../backend. The SPA never fetches from this worker.
  src/
    main.tsx              createRoot → RouterProvider
    app/                  Route layer. THIN wrappers only.
      router.tsx          createBrowserRouter: every route, layouts, lazy imports
      routes/             One file per route, renders a screen, nothing else
    files/                Entity modules (section 3). The heart of the app.
    components/
      ui/                 shadcn primitives, installed then customized in place
      elements/           OUR wrapped primitives, *Element suffix, theme aware, spring animated
      common/             composed pieces used by 2+ entities
      layouts/            Navbar, Footer, LayoutChrome, PageHeader
      styles/             building blocks for the /styles design system page
    context/              GLOBAL cross cutting contexts only (RoomSocketContext)
    providers/            theme-provider, motion-provider
    api/                  axios instances + interceptors. The only place base URLs exist.
    hooks/                global generic hooks (use-mobile, useOrigin)
    interfaces/           shared component prop interfaces (interfaces/components/...)
    constants/            routes.constants.ts, api.constants.ts, styleGuide.ts
    utils/                handleApiAction, handleError, notify, SecureStoreService, formatters
    lib/                  utils.ts (cn), motion.ts
    assets/               fonts, images
    index.css             Tailwind v4 config-in-CSS: tokens, dark block, typography utilities
```

Entities for this product: `auth`, `guest`, `room`, `message`, `language`, `config`. Placement rule unchanged: used by ONE entity → `src/files/<entity>/`; used by 2+ → the matching global folder; promote only when a second entity actually needs it.

---

## 3. Entity Modules

Identical to Architecture-web.md section 1:

```
src/files/<entity>/
  <entity>.service.ts      static class, one method per endpoint
  <entity>.context.tsx     Provider + use<Entity>Context, only if state is shared across screens
  use<Entity>.ts           workflow hook: form state, per action loading flags, actions
  <entity>.interface.ts    I<Entity> types + <Entity>ContextType
  <entity>.constants.ts    entity constants, socket event names
  <entity>.utils.ts        entity pure helpers
  components/              entity only components
  screens/                 full page views, PascalCase
  hooks/                   extra entity hooks
```

One normalization over corpland-web, applied everywhere from day one: **services always unwrap and return `response.data`** (the `OrderService` style), typed against the backend envelope `{ success, message, data, count? }`. The `auth.service.ts` raw-axios-promise style and the resulting `response.data?.data.user` chains are not ported.

```ts
class RoomService {
  static async createInstantRoom(payload: ICreateInstantRoom): Promise<IApiResult<IRoom>> {
    const response = await TRANSLATOR_API.post("/rooms/instant", payload);
    return response.data;
  }
  static async getMessages(roomId: string, cursor?: string): Promise<IApiResult<IMessage[]>> {
    const response = await TRANSLATOR_API.get(`/rooms/${roomId}/messages`, { params: { cursor } });
    return response.data;
  }
}
export default RoomService;
```

Workflow hooks are unchanged from the house pattern: one `useState` per field, one loading flag PER action, guard clause validation with `notify` before calling, every call through `handleApiAction`, navigation on success via the router, shared results written into the entity context.

---

## 4. Routes: Thin, Central, Constant

`src/app/router.tsx` is the single route table — the translation of the `app/` directory:

```tsx
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: ROUTES.HOME, element: <LandingRoute /> },
      { path: ROUTES.ROOM, element: <RoomRoute /> },
      { path: ROUTES.STYLES, element: <StylesRoute /> },
      { path: "*", element: <NotFoundRoute /> },
    ],
  },
]);
```

A route file stays as thin as a corpland-web `page.tsx` — params are read here and passed down, and the document title is set here (the `metadata` export replacement):

```tsx
const RoomRoute = () => {
  const { code } = useParams();
  useDocumentTitle("Room | Translator");
  return <Room code={code!} />;
};
export default RoomRoute;
```

Rules carried over: no logic, no state, no fetching in route files; navigation only through `constants/routes.constants.ts` (`ROUTES` object `as const` plus builder functions like `roomRoute(code)`), never string literals. `useDocumentTitle` lives in `hooks/` and is the only extra thing a route may carry.

Page transitions replace Next's `template.tsx`: `RootLayout` wraps its `<Outlet />` in `AnimatePresence mode="wait"` with `key={location.pathname}` and `SPRING.card`, so every route change is a visible springy transition.

---

## 5. Screens, Hooks, Contexts

Unchanged from Architecture-web.md sections 3.2, 3.3, 3.5 — corpland-web is the reference implementation:

- Screens compose elements, common components, and entity components; pull everything from `use<Entity>()` and contexts; never call a service.
- Contexts exist only for state that is shared across screens or updated in real time (`auth`, `room`, `message`). The shape is `createContext<T | undefined>(undefined)` + Provider + throwing `use<Entity>Context()`; state carries `{ data, isLoading, hasFetched, refetch, upsert*, find* }` — `hasFetched` distinguishes skeleton from empty state.
- WebSocket listeners that update entity state live in the entity context, subscribed in `useEffect` with cleanup, using event name constants from `<entity>.constants.ts`.
- Background context fetches use bare try/catch with silent failure; only user initiated actions go through `handleApiAction` and toast.

The provider tree lives in `RootLayout` (the `app/layout.tsx` translation), same ordering law — socket before auth, entity providers after auth:

```
ThemeProvider → RoomSocketProvider → AuthProvider → GuestProvider → RoomProvider → MessageProvider
  → MotionProvider → TooltipProvider → LayoutChrome → <Outlet />
+ Toaster as a sibling
```

---

## 6. The Pipeline: `utils/index.ts`

`handleApiAction`, `handleError`, `notify`, `SecureStoreService`, and the formatters port from `corpland-web/utils/index.ts` with their exact APIs — hooks written against corpland-web work here unchanged. Two known quirks are fixed in the ported copy, without changing the signature: the duplicated `setLoading(false)` in catch+finally collapses into finally alone, and `onSuccess` is invoked outside the try so a rendering bug in a success handler is never toasted as an API failure. The built-in "Try Again" toast action stays.

Hard rules unchanged: no bare try/catch around service calls in hooks, no direct toast library imports (`notify` only), no direct `localStorage` (`SecureStoreService` only).

---

## 7. API Layer: `src/api/index.ts`

The only place axios instances and base URLs exist. Base URLs come from `import.meta.env.VITE_*`, never hardcoded:

- `TRANSLATOR_API` → the product backend (`VITE_TRANSLATOR_API_URL`, the Hono Worker in `../backend`)
- `corplandAccountsAPI` → the shared Corpland ID backend (`VITE_CORPLAND_ID_API_URL`), in `files/auth/auth.api.ts`

Every instance gets both interceptors — and this port closes the two corpland-web gaps: the product instance DOES get the 401 response interceptor (corpland-web's `APIv2` never refreshes), and `handleTokenRefresh` dedupes concurrent refreshes behind a single in-flight promise. The `_retry` guard, token save, and request replay stay as in `utils/api.utils.ts`. Guest tokens ride the same `Authorization: Bearer` header; the request interceptor prefers the user access token and falls back to the stored guest token.

The `typeof window` SSR guards are dropped — this is a pure SPA.

---

## 8. Realtime: One Socket Provider, Native WebSocket

The backend's realtime is a Durable Object per room speaking native WebSocket (`GET /rooms/:roomId/ws?token=...`), not socket.io — so `context/RoomSocketContext.tsx` reimplements the corpland-web `SocketContext` contract over `WebSocket`:

- Exposes `{ socket, isSocketConnected, joinRoom, leaveRoom, sendEvent }` via `useRoomSocket()`. One connection per joined room, owned here and nowhere else.
- Reconnection mirrors the corpland-web instance config: exponential backoff 1s → 8s, infinite attempts, plus forced reconnect on browser `online` and tab visibility regain.
- Wire format is the backend event envelope `{ event, payload }`; the provider parses once and re-emits through a tiny local emitter so entity contexts subscribe with the same `on/off` idiom used in `order.context.tsx`.
- Event names come from `files/message/message.constants.ts` and match the backend contract exactly: `message:new`, `message:updated`, `message:deleted`, `message:seen`, `message:reaction`, `room:updated`, `typing:start`, `typing:stop`.

The optimistic send pattern is law on realtime surfaces, spec'd by cubbicles-mobile and Architecture-web.md section 7: insert with a `temp_` id and `status: "sending"`, reconcile via `upsertMessage` when the server echo arrives, never let a refetch wipe unsent optimistic items. Translation arrival is just `message:updated` upserting the `translations` map, which the MessageBubble swaps in with a shimmer.

---

## 9. Component System

Unchanged four tier system, one way imports only: `components/ui/` → `components/elements/` → `components/common/` → `files/<entity>/components/`.

- shadcn is installed via CLI with `components.json` set for Vite (`rsc: false`); every installed primitive is aligned to the design tokens and given spring enter/exit from `lib/motion.ts` before first use, edited in place so all consumers inherit it.
- Every primitive gets exactly one `*Element` wrapper (wrapper style or re-export barrel style, both as in corpland-web), props in `interfaces/components/elements/`. Feature code never imports `components/ui/` and never uses raw `<button>`, `<input>`, `<select>`, `<dialog>`.
- Start the element set by porting from corpland-web's 48: `ButtonElement`, `InputElement`, `SelectElement`, `ModalElement`, `SheetElement`, `LoadingElement`, `SkeletonElement`, `SegmentedTabsElement`, `EmptyState`, `SignedOutState`.
- Cross entity component imports are banned outright (corpland-web's `OrderCard` → venture `StatusBadge` leak is the counterexample): the moment a second entity needs a component, it moves to `common/`.

---

## 10. Design System, Theming, Motion

- `src/index.css` is the whole Tailwind v4 config, structured exactly like `corpland-web/app/globals.css`: `@import "tailwindcss"`, `@custom-variant dark`, `@theme inline` mapping, `:root`/`.dark` token blocks, typography utilities (`.text-display`, `.text-hero`, `.text-headline`, `.text-eyebrow`), spring easing utilities, and a global `prefers-reduced-motion` block. Tokens get this product's palette, but the token NAMES and structure match corpland-web so components port both ways.
- Fonts: Inter variable via `@font-face` in `index.css` onto `--font-sans` (replacing `next/font/local`).
- Dark mode: class strategy on `<html>`, system aware, persisted through `SecureStoreService`; consumers use the same `useTheme()` API shape as next-themes.
- Motion: `lib/motion.ts` copied verbatim from corpland-web (`SPRING.card/panel/snappy/press`, `fadeUp`, `fadeScale`, `staggerParent`, `TAP`, `HOVER_LIFT`). No inline one off transition objects in feature code. Page transitions (section 4) and component enter/exit (`AnimatePresence`) are required and must be visibly springy.
- The `/styles` page is mandatory and is the design system source of truth, built the corpland-web way: content as data in `constants/styleGuide.ts`, rendered by `components/styles/` blocks, listed in `BARE_ROUTES` so it renders without app chrome. `DESIGN.md` documents the tokens.
- Every screen is responsive from 360px to desktop; Tailwind breakpoints, no fixed pixel layouts.

---

## 11. Auth, Guests, Guards

- `AuthProvider` ports from `files/auth/auth.context.tsx`: fetch Corpland ID user then product profile on mount, expose `user`, `profile`, `isLoading`, `fetchCurrentUser`, `logoutUser`.
- `files/guest/` is the new entity corpland-web doesn't have: `useGuest` creates guest sessions (`POST /guests/sessions` with join code, display name, preferred language), stores the guest JWT, and `GuestProvider` exposes the active guest identity. The effective actor (user or guest) is resolved in one place, `files/auth/auth.utils.ts`, and everything downstream consumes that.
- Route guards follow the three corpland-web patterns, no middleware: layout guards that wait on `hasFetched` before `router` redirects, a reverse guard on the landing route, and inline `SignedOutState` where browsing should stay public. Rooms are guest friendly by design — joining via link/QR never demands an account.

---

## 12. Substitution Table (When Mirroring corpland-web)

| corpland-web (Next.js) | Here (Vite SPA) |
|---|---|
| `app/**/page.tsx` | `src/app/routes/*.tsx` + entry in `router.tsx` |
| `export const metadata` | `useDocumentTitle` in the route file |
| `template.tsx` transition | `AnimatePresence` keyed on `location.pathname` in `RootLayout` |
| `useRouter` / `usePathname` from `next/navigation` | `useNavigate` / `useLocation` from react-router |
| `<Link href>` from `next/link` | `<Link to>` from react-router |
| `next/image` | `<img>` with explicit dimensions |
| `next/font/local` | `@font-face` in `index.css` |
| `process.env.NEXT_PUBLIC_*` | `import.meta.env.VITE_*` (typed in `src/vite-env.d.ts`) |
| next-themes | `providers/theme-provider.tsx`, same consumer API |
| socket.io-client `SocketContext` | native WebSocket `RoomSocketContext`, same contract |
| `app/sitemap.ts`, `app/robots.ts` | `worker/index.ts` responses |
| `"use client"` directives, SSR `window` guards | dropped |

Known corpland-web gaps fixed at the start, not inherited: missing 401 interceptor on the product API, refresh race (no dedupe), inconsistent service return shapes, `handleApiAction`'s double `setLoading` and swallowed `onSuccess` throws, and the one cross entity component import.

---

## 13. Checklist: Adding a New Feature

1. Identify the entity. Existing → work inside its `src/files/<entity>/`. New → scaffold the module per section 3.
2. Check `components/elements/` and `components/common/` before creating anything. Extend, never duplicate.
3. Missing primitive → install the shadcn component, restyle to the tokens, add spring enter/exit, wrap as an `*Element`.
4. Add endpoint methods to `<entity>.service.ts` (unwrapped `response.data`, typed envelope).
5. Add types to `<entity>.interface.ts`.
6. Build actions in `use<Entity>.ts`: `handleApiAction`, per action loading flags, `notify` validation.
7. Shared or realtime state → `<entity>.context.tsx`, provider mounted in `RootLayout`, socket events subscribed there with cleanup.
8. Build the screen in `screens/`, responsive, both themes, springy enter/exit.
9. Add the route constant, the thin route file, and the `router.tsx` entry.
10. Anything repeated twice gets extracted immediately (element, common component, util, or hook).

## 14. Hard Rules

All eleven hard rules of Architecture-web.md section 11 apply verbatim, with these renames: `app/` route files → `src/app/` route files; axios lives only in `src/api/` and `files/auth/auth.api.ts`; storage/toast only via `SecureStoreService`/`notify`; no `components/ui/` imports, hardcoded tokens, or inline transitions in feature code. Additions for this repo:

- `worker/index.ts` never contains product logic; the SPA talks only to `../backend` and Corpland ID.
- No socket.io-client; all realtime through `RoomSocketContext`.
- No cross entity component imports; promote to `common/` first.
- No `VITE_*` variable read outside `src/api/` and `context/`.
- No new top level folders without updating this document.
