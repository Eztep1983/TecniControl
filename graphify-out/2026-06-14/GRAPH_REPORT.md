# Graph Report - TecniControl  (2026-06-14)

## Corpus Check
- 166 files · ~372,507 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1134 nodes · 2176 edges · 73 communities (56 shown, 17 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 108 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ba0c740b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Capacitor and Core Dependencies|Capacitor and Core Dependencies]]
- [[_COMMUNITY_UI Component Alert Dialogs|UI Component Alert Dialogs]]
- [[_COMMUNITY_Tasks and Spare Parts Management|Tasks and Spare Parts Management]]
- [[_COMMUNITY_Tasks and Spare Parts Management|Tasks and Spare Parts Management]]
- [[_COMMUNITY_UI Accordion and Badges Components|UI Accordion and Badges Components]]
- [[_COMMUNITY_Business Config and Multi User|Business Config and Multi User]]
- [[_COMMUNITY_Open Design System Schema|Open Design System Schema]]
- [[_COMMUNITY_Sidebar Navigation|Sidebar Navigation]]
- [[_COMMUNITY_Navigation and Keyboard Hooks|Navigation and Keyboard Hooks]]
- [[_COMMUNITY_Tasks and Spare Parts Management|Tasks and Spare Parts Management]]
- [[_COMMUNITY_UI Toast Notifications|UI Toast Notifications]]
- [[_COMMUNITY_UI Select Menu component|UI Select Menu component]]
- [[_COMMUNITY_Authentication and Users Management|Authentication and Users Management]]
- [[_COMMUNITY_Tasks and Spare Parts Management|Tasks and Spare Parts Management]]
- [[_COMMUNITY_Encryption and Offline Sync Queue|Encryption and Offline Sync Queue]]
- [[_COMMUNITY_UI Dialogs and Forms|UI Dialogs and Forms]]
- [[_COMMUNITY_UI Select Menu component|UI Select Menu component]]
- [[_COMMUNITY_Sidebar Navigation|Sidebar Navigation]]
- [[_COMMUNITY_UI Dialogs and Forms|UI Dialogs and Forms]]
- [[_COMMUNITY_TypeScript Compiler Configuration|TypeScript Compiler Configuration]]
- [[_COMMUNITY_Authentication and Users Management|Authentication and Users Management]]
- [[_COMMUNITY_Tasks and Spare Parts Management|Tasks and Spare Parts Management]]
- [[_COMMUNITY_Capacitor and Core Dependencies|Capacitor and Core Dependencies]]
- [[_COMMUNITY_Navigation and Keyboard Hooks|Navigation and Keyboard Hooks]]
- [[_COMMUNITY_Module components|Module components]]
- [[_COMMUNITY_Module menubar|Module menubar]]
- [[_COMMUNITY_Authentication and Users Management|Authentication and Users Management]]
- [[_COMMUNITY_UI Select Menu component|UI Select Menu component]]
- [[_COMMUNITY_Module OrdenCard|Module OrdenCard]]
- [[_COMMUNITY_Sidebar Navigation|Sidebar Navigation]]
- [[_COMMUNITY_Business Config and Multi User|Business Config and Multi User]]
- [[_COMMUNITY_UI Dialogs and Forms|UI Dialogs and Forms]]
- [[_COMMUNITY_Capacitor and Core Dependencies|Capacitor and Core Dependencies]]
- [[_COMMUNITY_Capacitor and Core Dependencies|Capacitor and Core Dependencies]]
- [[_COMMUNITY_Client Management Modals|Client Management Modals]]
- [[_COMMUNITY_UI Dialogs and Forms|UI Dialogs and Forms]]
- [[_COMMUNITY_Capacitor and Core Dependencies|Capacitor and Core Dependencies]]
- [[_COMMUNITY_Module WelcomeScreen|Module WelcomeScreen]]
- [[_COMMUNITY_Business Config and Multi User|Business Config and Multi User]]
- [[_COMMUNITY_UI Select Menu component|UI Select Menu component]]
- [[_COMMUNITY_Module table|Module table]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Module AnimatedList|Module AnimatedList]]
- [[_COMMUNITY_Module logo|Module logo]]
- [[_COMMUNITY_UI Dialogs and Forms|UI Dialogs and Forms]]
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
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 86|Community 86]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 67 edges
2. `useAuth()` - 56 edges
3. `SidebarContext` - 32 edges
4. `SidebarContextProps` - 25 edges
5. `Cliente` - 23 edges
6. `OrdenMantenimiento` - 17 edges
7. `sanitizeOrdenPayload()` - 17 edges
8. `OfflineSyncProvider()` - 16 edges
9. `compilerOptions` - 16 edges
10. `db` - 15 edges

## Surprising Connections (you probably didn't know these)
- `graphify` --semantically_similar_to--> `graphify`  [INFERRED] [semantically similar]
  AGENTS.md → CLAUDE.md
- `AppLayout()` --calls--> `useAuth()`  [INFERRED]
  src/app/(app)/layout.tsx → src/components/auth/AuthProvider.tsx
- `sanitizeOrdenPayload()` --semantically_similar_to--> `serializeOrden()`  [INFERRED] [semantically similar]
  src/lib/firestore-sanitizers.ts → src/lib/orden-serializer.ts
- `ClientesPage()` --calls--> `useAuth()`  [INFERRED]
  src/app/(app)/clientes/page.tsx → src/components/auth/AuthProvider.tsx
- `useIsMobile()` --semantically_similar_to--> `useMediaQuery()`  [INFERRED] [semantically similar]
  src/hooks/use-mobile.tsx → src/hooks/clientes/useMediaQuery.ts

## Import Cycles
- None detected.

## Communities (73 total, 17 thin omitted)

### Community 0 - "Capacitor and Core Dependencies"
Cohesion: 0.03
Nodes (65): dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor-community/file-opener, @capacitor-community/speech-recognition, @capacitor/core, @capacitor/device (+57 more)

### Community 1 - "UI Component Alert Dialogs"
Cohesion: 0.07
Nodes (23): audioManager, DiagnosticoInfo, DiagnosticoInfoProps, MicButton, PermissionWarning, RecordingIndicator, restartManager, SectionHeader (+15 more)

### Community 2 - "Tasks and Spare Parts Management"
Cohesion: 0.11
Nodes (14): PiezaPredefinida, colorStyles, FORM_PIEZA_VACIO, FormPieza, FormularioPieza, ModalPieza(), ModalPiezaProps, ModalTarea() (+6 more)

### Community 3 - "Tasks and Spare Parts Management"
Cohesion: 0.12
Nodes (12): CLS_BTN_PRIMARY, CLS_BTN_SECONDARY, CLS_CARD, DEFAULT_TIPO, DeviceIcon, Highlight, LAPTOP_BRANDS, OrdenCard (+4 more)

### Community 4 - "UI Accordion and Badges Components"
Cohesion: 0.08
Nodes (25): Badge(), BadgeProps, badgeVariants, Checkbox, labelVariants, PopoverContent, Progress, RadioGroup (+17 more)

### Community 5 - "Business Config and Multi User"
Cohesion: 0.06
Nodes (63): Comp, Sidebar, SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME, SIDEBAR_KEYBOARD_SHORTCUT, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON, SIDEBAR_WIDTH_MOBILE (+55 more)

### Community 6 - "Open Design System Schema"
Cohesion: 0.05
Nodes (38): author, name, url, compat, agentSkills, assets, designSystem, skills (+30 more)

### Community 7 - "Sidebar Navigation"
Cohesion: 0.06
Nodes (31): ACCESIBILIDAD, ANIMACIONES, API, BASE DE DATOS, BOTONES, COLORES, COMPONENTES, DASHBOARDS SaaS (+23 more)

### Community 8 - "Navigation and Keyboard Hooks"
Cohesion: 0.13
Nodes (25): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastProvider, ToastTitle (+17 more)

### Community 9 - "Tasks and Spare Parts Management"
Cohesion: 0.11
Nodes (17): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+9 more)

### Community 10 - "UI Toast Notifications"
Cohesion: 0.12
Nodes (19): ClienteFormModalProps, ClienteViewModalProps, DispositivoFormModal(), DispositivoFormModalProps, ClienteModalState, ModalMode, useClienteModal(), ClienteRow (+11 more)

### Community 11 - "UI Select Menu component"
Cohesion: 0.10
Nodes (18): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, DISPOSITIVO_VACIO (+10 more)

### Community 12 - "Authentication and Users Management"
Cohesion: 0.15
Nodes (16): Alert, AlertDescription, AlertTitle, alertVariants, Card, CardContent, CardDescription, CardFooter (+8 more)

### Community 13 - "Tasks and Spare Parts Management"
Cohesion: 0.11
Nodes (16): AuthContext, AuthContextType, logger, SECURITY_CONFIG, UserDocument, useOrdenesCliente(), UserData, useUserData() (+8 more)

### Community 14 - "Encryption and Offline Sync Queue"
Cohesion: 0.09
Nodes (44): inter, metadata, RootLayout(), AuthGuard(), AuthGuardProps, PUBLIC_ROUTES, AuthProvider(), useAppLifecycle() (+36 more)

### Community 15 - "UI Dialogs and Forms"
Cohesion: 0.13
Nodes (19): Form, FormControl, FormDescription, FormField(), FormFieldContext, FormFieldContextValue, FormItem, FormItemContext (+11 more)

### Community 16 - "UI Select Menu component"
Cohesion: 0.14
Nodes (20): DialogContent, DialogDescription, DialogHeader(), DialogOverlay, DialogTitle, ClienteHistorialModal(), ClienteHistorialModalProps, DialogHeaderContent (+12 more)

### Community 17 - "Sidebar Navigation"
Cohesion: 0.20
Nodes (21): useTareasYPiezas, actualizarPieza(), actualizarTarea(), configDocRef(), crearPieza(), crearTarea(), eliminarPieza(), eliminarTarea() (+13 more)

### Community 18 - "UI Dialogs and Forms"
Cohesion: 0.07
Nodes (35): AppLayout(), LayoutContent(), Auth Provider, SpeechContext, SpeechContextType, SpeechProvider(), useKeyboardVisible(), useScrollAware() (+27 more)

### Community 19 - "TypeScript Compiler Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 20 - "Authentication and Users Management"
Cohesion: 0.11
Nodes (18): HTML Seed Template, Theme Tokens, P0 Must-Pass Checklist, Section Rhythm Guidance, Layout Skeletons, Tomato Web Prototype Example, Web Prototype Hard Rules, Hard rules (the seed protects most of these — don't fight it) (+10 more)

### Community 21 - "Tasks and Spare Parts Management"
Cohesion: 0.08
Nodes (38): NegocioHeaderProps, NegocioConUsuario, useOrdenesUsuario(), cleanBoolean(), cleanDate(), cleanNumber(), cleanString(), cleanStringArray() (+30 more)

### Community 22 - "Capacitor and Core Dependencies"
Cohesion: 0.27
Nodes (8): useNetworkStatus(), useOfflineOrderQueue(), useOfflineQueue(), queryKeys, TareaPredefinida, useOfflineSync(), NetworkStatusBanner(), OfflineSyncBanner()

### Community 23 - "Navigation and Keyboard Hooks"
Cohesion: 0.11
Nodes (14): GarantiaInputProps, Garantia Info, Garantia Input, usePersistentReducer(), FormAction, FormStep, FormularioMantenimientoProps, initialState (+6 more)

### Community 24 - "Module components"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 25 - "Module menubar"
Cohesion: 0.16
Nodes (13): modalOrdenImport(), ActionBtn, Card, Chip, DataRow, DetailView, isCapacitor(), isNativePlatform() (+5 more)

### Community 26 - "Authentication and Users Management"
Cohesion: 0.12
Nodes (10): DialogFooter(), ClienteCard, ClienteCardProps, ClientesDataTableProps, Pagination, PaginationProps, haptic, useHapticFeedback() (+2 more)

### Community 27 - "UI Select Menu component"
Cohesion: 0.15
Nodes (16): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants (+8 more)

### Community 28 - "Module OrdenCard"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 29 - "Sidebar Navigation"
Cohesion: 0.27
Nodes (8): Pieza, PiezasInputProps, SelectorCantidad, TareasInput, TareasInputProps, Drawer(), DrawerContent, DrawerTitle

### Community 30 - "Business Config and Multi User"
Cohesion: 0.22
Nodes (11): DownloadButtonProps, escapeHTML(), generarContenidoHTML(), isCapacitor(), isNativePlatform(), PrintButton(), PrintButtonProps, PrintServiceProps (+3 more)

### Community 31 - "UI Dialogs and Forms"
Cohesion: 0.20
Nodes (12): Avatar, AvatarFallback, AvatarImage, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem (+4 more)

### Community 32 - "Capacitor and Core Dependencies"
Cohesion: 0.05
Nodes (46): useAuth(), UserProfile(), ConfiguracionPage(), useCompletarOnboarding(), useCrearOrden(), useEstadisticasUsuario(), useNegocioUsuario(), useOrdenesBusqueda() (+38 more)

### Community 33 - "Capacitor and Core Dependencies"
Cohesion: 0.20
Nodes (10): devDependencies, @capacitor/assets, postcss, tailwindcss, @types/crypto-js, @types/node, @types/react, @types/react-dom (+2 more)

### Community 34 - "Client Management Modals"
Cohesion: 0.13
Nodes (14): 1. FICHA TÉCNICA DEL PROYECTO, 2. DIAGNÓSTICO RÁPIDO, 3. ANÁLISIS TÉCNICO — LO QUE EL CÓDIGO REVELA, 4. EXPERIENCIA DE USO — DESDE EL CÓDIGO, 5. FIT CON EL MERCADO COLOMBIANO — LECTURA TÉCNICA, 6. NO NEGOCIABLES — LO QUE BLOQUEA EL LANZAMIENTO, 7. QUÉ QUITAR — SCOPE CREEP DETECTADO EN EL CÓDIGO, 8. RESUMEN DE ÁREAS DE MEJORA PRIORITARIAS (+6 more)

### Community 35 - "UI Dialogs and Forms"
Cohesion: 0.27
Nodes (9): ClienteFormModal, ClientesDataTable, ClienteSimpleFormModal(), ClientesList(), ClientesSkeleton, ClientesPage(), usePullToRefresh(), UsePullToRefreshOptions (+1 more)

### Community 36 - "Capacitor and Core Dependencies"
Cohesion: 0.38
Nodes (5): Button, ButtonProps, buttonVariants, Calendar(), CalendarProps

### Community 37 - "Module WelcomeScreen"
Cohesion: 0.15
Nodes (12): Class inventory (must exist in `template.html`), Layout 1 — Hero, centered, Layout 2 — Hero, split (text + visual), Layout 3 — Feature triplet, Layout 4 — Stat row (data billboard), Layout 5 — Pull quote (testimonial), Layout 6 — CTA strip (closing), Layout 7 — Log list (changelog / blog index / posts) (+4 more)

### Community 38 - "Business Config and Multi User"
Cohesion: 0.33
Nodes (5): colorStyles, FORM_TAREA_VACIO, FormTarea, FormularioTarea, ModalTareaProps

### Community 39 - "UI Select Menu component"
Cohesion: 0.27
Nodes (9): FirmaInput(), FirmaInputProps, ResumenMantenimiento(), ResumenMantenimientoProps, SignatureState, useSignatureCanvas(), deobfuscateSignature(), obfuscateSignature() (+1 more)

### Community 40 - "Module table"
Cohesion: 0.33
Nodes (5): mockBatchSet, mockCommit, mockGetDoc, mockGetDocs, mockSetDoc

### Community 41 - "Community 41"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 43 - "Module AnimatedList"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, lint, start, test (+2 more)

### Community 47 - "Module logo"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 49 - "UI Dialogs and Forms"
Cohesion: 0.50
Nodes (3): Button, ButtonProps, buttonVariants

### Community 51 - "Module UpgradePrompt"
Cohesion: 0.29
Nodes (6): Anti-Slop Spot Check, Anti-slop spot-check, P0 — must pass, P1 — should pass, P2 — nice to have, Web prototype checklist

### Community 55 - "Module splash"
Cohesion: 0.50
Nodes (3): FixedSizeList, FixedSizeListProps, ListChildComponentProps

### Community 86 - "Community 86"
Cohesion: 0.40
Nodes (4): Contador, ContadorInput, ContadorInputProps, TIPOS_CONTADOR

## Knowledge Gaps
- **487 isolated node(s):** `config`, `name`, `version`, `private`, `dev` (+482 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Accordion and Badges Components` to `Tasks and Spare Parts Management`, `Business Config and Multi User`, `Navigation and Keyboard Hooks`, `Tasks and Spare Parts Management`, `UI Select Menu component`, `Authentication and Users Management`, `UI Dialogs and Forms`, `UI Select Menu component`, `UI Dialogs and Forms`, `Module menubar`, `Authentication and Users Management`, `UI Select Menu component`, `Module OrdenCard`, `UI Dialogs and Forms`, `Capacitor and Core Dependencies`, `Capacitor and Core Dependencies`, `Community 41`, `Module logo`, `UI Dialogs and Forms`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Capacitor and Core Dependencies` to `Tasks and Spare Parts Management`, `UI Dialogs and Forms`, `Tasks and Spare Parts Management`, `UI Toast Notifications`, `UI Select Menu component`, `Authentication and Users Management`, `Tasks and Spare Parts Management`, `Encryption and Offline Sync Queue`, `UI Dialogs and Forms`, `UI Dialogs and Forms`, `Tasks and Spare Parts Management`, `Capacitor and Core Dependencies`, `Navigation and Keyboard Hooks`, `Sidebar Navigation`, `UI Dialogs and Forms`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `Cliente` connect `UI Toast Notifications` to `UI Dialogs and Forms`, `UI Select Menu component`, `UI Select Menu component`, `UI Dialogs and Forms`, `UI Select Menu component`, `Tasks and Spare Parts Management`, `Navigation and Keyboard Hooks`, `Authentication and Users Management`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useAuth()` (e.g. with `AppLayout()` and `ClientesPage()`) actually correct?**
  _`useAuth()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `SidebarContext` (e.g. with `Comp` and `Sidebar`) actually correct?**
  _`SidebarContext` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `SidebarContextProps` (e.g. with `Sidebar` and `SidebarContent`) actually correct?**
  _`SidebarContextProps` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `config`, `name`, `version` to the rest of the system?**
  _491 weakly-connected nodes found - possible documentation gaps or missing edges._