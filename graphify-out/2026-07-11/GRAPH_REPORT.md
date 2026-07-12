# Graph Report - TecniControl  (2026-07-11)

## Corpus Check
- 175 files · ~386,238 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1182 nodes · 2336 edges · 70 communities (52 shown, 18 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 109 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8ef729d9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Capacitor and Core Dependencies|Capacitor and Core Dependencies]]
- [[_COMMUNITY_UI Component Alert Dialogs|UI Component Alert Dialogs]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Tasks and Spare Parts Management|Tasks and Spare Parts Management]]
- [[_COMMUNITY_UI Accordion and Badges Components|UI Accordion and Badges Components]]
- [[_COMMUNITY_Business Config and Multi User|Business Config and Multi User]]
- [[_COMMUNITY_Open Design System Schema|Open Design System Schema]]
- [[_COMMUNITY_Sidebar Navigation|Sidebar Navigation]]
- [[_COMMUNITY_Navigation and Keyboard Hooks|Navigation and Keyboard Hooks]]
- [[_COMMUNITY_Tasks and Spare Parts Management|Tasks and Spare Parts Management]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_UI Select Menu component|UI Select Menu component]]
- [[_COMMUNITY_Authentication and Users Management|Authentication and Users Management]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Encryption and Offline Sync Queue|Encryption and Offline Sync Queue]]
- [[_COMMUNITY_UI Dialogs and Forms|UI Dialogs and Forms]]
- [[_COMMUNITY_UI Select Menu component|UI Select Menu component]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_UI Dialogs and Forms|UI Dialogs and Forms]]
- [[_COMMUNITY_TypeScript Compiler Configuration|TypeScript Compiler Configuration]]
- [[_COMMUNITY_Authentication and Users Management|Authentication and Users Management]]
- [[_COMMUNITY_Tasks and Spare Parts Management|Tasks and Spare Parts Management]]
- [[_COMMUNITY_Capacitor and Core Dependencies|Capacitor and Core Dependencies]]
- [[_COMMUNITY_Navigation and Keyboard Hooks|Navigation and Keyboard Hooks]]
- [[_COMMUNITY_Module components|Module components]]
- [[_COMMUNITY_Module menubar|Module menubar]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_UI Select Menu component|UI Select Menu component]]
- [[_COMMUNITY_Module OrdenCard|Module OrdenCard]]
- [[_COMMUNITY_Sidebar Navigation|Sidebar Navigation]]
- [[_COMMUNITY_Business Config and Multi User|Business Config and Multi User]]
- [[_COMMUNITY_UI Dialogs and Forms|UI Dialogs and Forms]]
- [[_COMMUNITY_Capacitor and Core Dependencies|Capacitor and Core Dependencies]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Client Management Modals|Client Management Modals]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Module WelcomeScreen|Module WelcomeScreen]]
- [[_COMMUNITY_Business Config and Multi User|Business Config and Multi User]]
- [[_COMMUNITY_UI Select Menu component|UI Select Menu component]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Module AnimatedList|Module AnimatedList]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Module UpgradePrompt|Module UpgradePrompt]]
- [[_COMMUNITY_Module AGENTS|Module AGENTS]]
- [[_COMMUNITY_Module not-found|Module not-found]]
- [[_COMMUNITY_Group page.tsx|Group page.tsx]]
- [[_COMMUNITY_Module splash|Module splash]]
- [[_COMMUNITY_Module sheet|Module sheet]]
- [[_COMMUNITY_Capacitor and Core Dependencies|Capacitor and Core Dependencies]]
- [[_COMMUNITY_Module postcss.config|Module postcss.config]]
- [[_COMMUNITY_Module icon-only|Module icon-only]]
- [[_COMMUNITY_Module collapsible|Module collapsible]]
- [[_COMMUNITY_Module popover|Module popover]]
- [[_COMMUNITY_UI Select Menu component|UI Select Menu component]]
- [[_COMMUNITY_Module cors|Module cors]]
- [[_COMMUNITY_Module pnpm-workspace|Module pnpm-workspace]]
- [[_COMMUNITY_Module checklist|Module checklist]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 94|Community 94]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 67 edges
2. `useAuth()` - 62 edges
3. `SidebarContext` - 32 edges
4. `SidebarContextProps` - 25 edges
5. `Cliente` - 24 edges
6. `OrdenMantenimiento` - 20 edges
7. `OfflineSyncProvider()` - 17 edges
8. `db` - 17 edges
9. `sanitizeOrdenPayload()` - 17 edges
10. `PARTE II: POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES (Habeas Data)` - 17 edges

## Surprising Connections (you probably didn't know these)
- `graphify` --semantically_similar_to--> `graphify`  [INFERRED] [semantically similar]
  AGENTS.md → CLAUDE.md
- `AppLayout()` --calls--> `useAuth()`  [INFERRED]
  src/app/(app)/layout.tsx → src/components/auth/AuthProvider.tsx
- `ClienteSelector` --semantically_similar_to--> `DispositivoSelector()`  [INFERRED] [semantically similar]
  src/components/forms/ClienteSelector.tsx → src/components/forms/DispositivoSelector.tsx
- `OfflineSyncProvider()` --semantically_similar_to--> `FirestoreSyncProvider()`  [INFERRED] [semantically similar]
  src/components/providers/OfflineSyncProvider.tsx → src/components/providers/FirestoreSyncProvider.tsx
- `Separator` --semantically_similar_to--> `Separator`  [INFERRED] [semantically similar]
  src/components/ui/basic/separator.tsx → src/components/ui/separator.tsx

## Import Cycles
- None detected.

## Communities (70 total, 18 thin omitted)

### Community 0 - "Capacitor and Core Dependencies"
Cohesion: 0.03
Nodes (68): dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor-community/contacts, @capacitor-community/file-opener, @capacitor-community/speech-recognition, @capacitor/core (+60 more)

### Community 1 - "UI Component Alert Dialogs"
Cohesion: 0.07
Nodes (23): audioManager, DiagnosticoInfo, DiagnosticoInfoProps, MicButton, PermissionWarning, RecordingIndicator, restartManager, SectionHeader (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.16
Nodes (14): SheetContent, SheetContentProps, SheetFooter(), SheetHeader(), SheetOverlay, sheetVariants, SheetContent, SheetContentProps (+6 more)

### Community 3 - "Tasks and Spare Parts Management"
Cohesion: 0.13
Nodes (11): CLS_BTN_PRIMARY, CLS_BTN_SECONDARY, CLS_CARD, DEFAULT_TIPO, DeviceIcon, Highlight, LAPTOP_BRANDS, OrdenCard (+3 more)

### Community 4 - "UI Accordion and Badges Components"
Cohesion: 0.08
Nodes (22): AccordionContent, AccordionItem, AccordionTrigger, Badge(), BadgeProps, badgeVariants, Checkbox, PopoverContent (+14 more)

### Community 5 - "Business Config and Multi User"
Cohesion: 0.06
Nodes (58): Comp, Sidebar, SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME, SIDEBAR_KEYBOARD_SHORTCUT, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON, SIDEBAR_WIDTH_MOBILE (+50 more)

### Community 6 - "Open Design System Schema"
Cohesion: 0.05
Nodes (38): author, name, url, compat, agentSkills, assets, designSystem, skills (+30 more)

### Community 7 - "Sidebar Navigation"
Cohesion: 0.06
Nodes (31): ACCESIBILIDAD, ANIMACIONES, API, BASE DE DATOS, BOTONES, COLORES, COMPONENTES, DASHBOARDS SaaS (+23 more)

### Community 8 - "Navigation and Keyboard Hooks"
Cohesion: 0.13
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastProvider, ToastTitle (+16 more)

### Community 9 - "Tasks and Spare Parts Management"
Cohesion: 0.06
Nodes (37): Alert, AlertDescription, AlertTitle, alertVariants, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription (+29 more)

### Community 10 - "Community 10"
Cohesion: 0.31
Nodes (8): DispositivoFormModalProps, DispositivoRow, DispositivoRowProps, DispositivoSelector(), DispositivoSelectorProps, getEstadoStyle(), getIconoDispositivo(), Dispositivo

### Community 11 - "UI Select Menu component"
Cohesion: 0.12
Nodes (19): UserProfile(), Avatar, AvatarFallback, AvatarImage, Button, ButtonProps, buttonVariants, Calendar() (+11 more)

### Community 12 - "Authentication and Users Management"
Cohesion: 0.05
Nodes (40): 10.1. Cláusula de Fuerza Mayor, 10. Compartición con Terceros y Transferencia Internacional de Datos, 10. Limitación de Responsabilidad, 11. Cookies, Analítica y Monitoreo de Rendimiento, 11. Titularidad y Portabilidad de los Datos, 12. Gestión de Incidentes y Brechas de Seguridad, 12. Servicios de Terceros y Canales de Comunicación, 13. Herramientas Automatizadas y Futuras Integraciones de IA (+32 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (13): AppLayout(), LayoutContent(), SpeechContext, SpeechContextType, SpeechProvider(), AppSidebar(), navigation, secondaryNavigation (+5 more)

### Community 14 - "Encryption and Offline Sync Queue"
Cohesion: 0.12
Nodes (36): decryptData(), encryptData(), clearLocalIdPool(), formatIdPersonalizado(), getLocalIdPool(), IDPoolRange, obtenerSiguienteIdDePool(), saveLocalIdPool() (+28 more)

### Community 15 - "UI Dialogs and Forms"
Cohesion: 0.16
Nodes (18): DialogContent, DialogOverlay, DialogTitle, Form, FormControl, FormField(), FormItem, FormMessage (+10 more)

### Community 16 - "UI Select Menu component"
Cohesion: 0.26
Nodes (12): ClientesDataTable, ClienteSimpleFormModal(), ClientesList(), ClientesSkeleton, ClienteViewModal(), ImportarContactosModal(), useClienteModal(), useHapticFeedback() (+4 more)

### Community 17 - "Community 17"
Cohesion: 0.24
Nodes (6): OnboardingSuccess(), OnboardingSuccessProps, WelcomeScreen(), WelcomeScreenProps, AnimatedContent(), AnimatedContentProps

### Community 18 - "UI Dialogs and Forms"
Cohesion: 0.10
Nodes (25): useKeyboardVisible(), useScrollAware(), AppView, getPathByView(), getRouteByPath(), RouteConfig, ROUTES, TAB_ORDER (+17 more)

### Community 19 - "TypeScript Compiler Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 20 - "Authentication and Users Management"
Cohesion: 0.11
Nodes (18): HTML Seed Template, Theme Tokens, P0 Must-Pass Checklist, Section Rhythm Guidance, Layout Skeletons, Tomato Web Prototype Example, Web Prototype Hard Rules, Hard rules (the seed protects most of these — don't fight it) (+10 more)

### Community 21 - "Tasks and Spare Parts Management"
Cohesion: 0.06
Nodes (66): useOrdenesUsuario(), useTareasYPiezas, actualizarPieza(), actualizarTarea(), configDocRef(), crearPieza(), crearTarea(), eliminarPieza() (+58 more)

### Community 22 - "Capacitor and Core Dependencies"
Cohesion: 0.17
Nodes (7): DashboardGreeting, DAY_NAMES, GREETINGS, MONTH_NAMES, Negocio, useDashboardGreeting(), User

### Community 23 - "Navigation and Keyboard Hooks"
Cohesion: 0.12
Nodes (13): GarantiaInputProps, Garantia Info, Garantia Input, usePersistentReducer(), FormAction, FormStep, FormularioMantenimientoProps, initialState (+5 more)

### Community 24 - "Module components"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 25 - "Module menubar"
Cohesion: 0.18
Nodes (13): modalOrdenImport(), ActionBtn, Card, Chip, DataRow, DetailView, isCapacitor(), isNativePlatform() (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.11
Nodes (15): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, Table (+7 more)

### Community 27 - "UI Select Menu component"
Cohesion: 0.15
Nodes (16): SheetDescription, SheetTitle, ClienteHistorialModal(), ClienteHistorialModalProps, HistorialContent, HistorialContentProps, ModalOrdenLazy, OrdenItem (+8 more)

### Community 28 - "Module OrdenCard"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 29 - "Sidebar Navigation"
Cohesion: 0.18
Nodes (11): useIsMobile(), Button, ButtonProps, buttonVariants, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay (+3 more)

### Community 30 - "Business Config and Multi User"
Cohesion: 0.20
Nodes (12): formatFecha(), OrdenCardProps, DownloadButtonProps, escapeHTML(), generarContenidoHTML(), isCapacitor(), isNativePlatform(), PrintButton() (+4 more)

### Community 31 - "UI Dialogs and Forms"
Cohesion: 0.08
Nodes (28): inter, metadata, RootLayout(), AuthGuard(), AuthGuardProps, PUBLIC_ROUTES, AuthContext, AuthContextType (+20 more)

### Community 32 - "Capacitor and Core Dependencies"
Cohesion: 0.19
Nodes (8): useCompletarOnboarding(), BusinessAvatar, DraftBanner, EmptyOrdenes, StatCard, TIPO_COLORS, useDraftBanner(), useOnboardingFlow()

### Community 33 - "Community 33"
Cohesion: 0.12
Nodes (10): DialogDescription, DialogFooter(), DialogHeader(), ClienteCard, ClientesDataTableProps, Pagination, PaginationProps, haptic (+2 more)

### Community 34 - "Client Management Modals"
Cohesion: 0.22
Nodes (8): FormDescription, FormFieldContext, FormFieldContextValue, FormItemContext, FormItemContextValue, FormLabel, Label, labelVariants

### Community 37 - "Module WelcomeScreen"
Cohesion: 0.15
Nodes (12): Class inventory (must exist in `template.html`), Layout 1 — Hero, centered, Layout 2 — Hero, split (text + visual), Layout 3 — Feature triplet, Layout 4 — Stat row (data billboard), Layout 5 — Pull quote (testimonial), Layout 6 — CTA strip (closing), Layout 7 — Log list (changelog / blog index / posts) (+4 more)

### Community 38 - "Business Config and Multi User"
Cohesion: 0.19
Nodes (9): ClienteCardProps, ClienteSimpleFormModalProps, ClienteViewModalProps, ClienteModalState, ModalMode, ClienteRow, ClienteRowProps, ClienteSelectorProps (+1 more)

### Community 39 - "UI Select Menu component"
Cohesion: 0.27
Nodes (9): FirmaInput(), FirmaInputProps, ResumenMantenimiento(), ResumenMantenimientoProps, SignatureState, useSignatureCanvas(), deobfuscateSignature(), obfuscateSignature() (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.14
Nodes (13): Contador, ContadorInput, ContadorInputProps, TIPOS_CONTADOR, PrintServiceProps, FormAction, FormState, FormStep (+5 more)

### Community 42 - "Community 42"
Cohesion: 0.13
Nodes (25): useAuth(), ClientesPage(), useMediaQuery(), ConfiguracionPage(), useCrearOrden(), useEstadisticasUsuario(), useOrdenesBusqueda(), useOrdenesInfinitas() (+17 more)

### Community 43 - "Module AnimatedList"
Cohesion: 0.10
Nodes (20): devDependencies, @capacitor/assets, postcss, tailwindcss, @types/crypto-js, @types/node, @types/react, @types/react-dom (+12 more)

### Community 48 - "Community 48"
Cohesion: 0.06
Nodes (34): Pieza, PiezasInputProps, SelectorCantidad, TareasInput, TareasInputProps, useNetworkStatus(), useOfflineOrderQueue(), useOfflineQueue() (+26 more)

### Community 51 - "Module UpgradePrompt"
Cohesion: 0.29
Nodes (6): Anti-Slop Spot Check, Anti-slop spot-check, P0 — must pass, P1 — should pass, P2 — nice to have, Web prototype checklist

### Community 55 - "Module splash"
Cohesion: 0.50
Nodes (3): FixedSizeList, FixedSizeListProps, ListChildComponentProps

## Knowledge Gaps
- **508 isolated node(s):** `config`, `$schema`, `style`, `rsc`, `tsx` (+503 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Accordion and Badges Components` to `Capacitor and Core Dependencies`, `Community 33`, `Client Management Modals`, `Community 2`, `Tasks and Spare Parts Management`, `Business Config and Multi User`, `Navigation and Keyboard Hooks`, `Tasks and Spare Parts Management`, `Community 42`, `UI Select Menu component`, `Community 13`, `UI Dialogs and Forms`, `UI Dialogs and Forms`, `Module menubar`, `Community 26`, `UI Select Menu component`, `Module OrdenCard`, `Sidebar Navigation`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 42` to `Capacitor and Core Dependencies`, `Community 40`, `Tasks and Spare Parts Management`, `UI Select Menu component`, `Community 13`, `Encryption and Offline Sync Queue`, `UI Dialogs and Forms`, `UI Select Menu component`, `Community 48`, `Tasks and Spare Parts Management`, `Navigation and Keyboard Hooks`, `UI Select Menu component`, `UI Dialogs and Forms`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useAuth()` (e.g. with `AppLayout()` and `ClientesPage()`) actually correct?**
  _`useAuth()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `SidebarContext` (e.g. with `Comp` and `Sidebar`) actually correct?**
  _`SidebarContext` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `SidebarContextProps` (e.g. with `Sidebar` and `SidebarContent`) actually correct?**
  _`SidebarContextProps` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `config`, `$schema`, `style` to the rest of the system?**
  _512 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Capacitor and Core Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.029411764705882353 - nodes in this community are weakly interconnected._