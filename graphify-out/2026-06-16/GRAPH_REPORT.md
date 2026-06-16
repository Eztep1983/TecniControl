# Graph Report - TecniControl  (2026-06-16)

## Corpus Check
- 168 files · ~373,161 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1132 nodes · 2206 edges · 79 communities (59 shown, 20 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 108 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `51dabc07`
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
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Module AnimatedList|Module AnimatedList]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Module logo|Module logo]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_UI Dialogs and Forms|UI Dialogs and Forms]]
- [[_COMMUNITY_Module UpgradePrompt|Module UpgradePrompt]]
- [[_COMMUNITY_Module AGENTS|Module AGENTS]]
- [[_COMMUNITY_Module not-found|Module not-found]]
- [[_COMMUNITY_Group page.tsx|Group page.tsx]]
- [[_COMMUNITY_Module splash|Module splash]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Module sheet|Module sheet]]
- [[_COMMUNITY_Capacitor and Core Dependencies|Capacitor and Core Dependencies]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Module postcss.config|Module postcss.config]]
- [[_COMMUNITY_Module icon-only|Module icon-only]]
- [[_COMMUNITY_Community 65|Community 65]]
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
- [[_COMMUNITY_Community 94|Community 94]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 67 edges
2. `useAuth()` - 60 edges
3. `SidebarContext` - 32 edges
4. `SidebarContextProps` - 25 edges
5. `Cliente` - 22 edges
6. `OrdenMantenimiento` - 18 edges
7. `db` - 17 edges
8. `sanitizeOrdenPayload()` - 17 edges
9. `OfflineSyncProvider()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `graphify` --semantically_similar_to--> `graphify`  [INFERRED] [semantically similar]
  AGENTS.md → CLAUDE.md
- `ClientesPage()` --calls--> `useAuth()`  [INFERRED]
  src/app/(app)/clientes/page.tsx → src/components/auth/AuthProvider.tsx
- `AppLayout()` --calls--> `useAuth()`  [INFERRED]
  src/app/(app)/layout.tsx → src/components/auth/AuthProvider.tsx
- `OfflineSyncProvider()` --semantically_similar_to--> `FirestoreSyncProvider()`  [INFERRED] [semantically similar]
  src/components/providers/OfflineSyncProvider.tsx → src/components/providers/FirestoreSyncProvider.tsx
- `TooltipContent` --semantically_similar_to--> `TooltipContent`  [INFERRED] [semantically similar]
  src/components/ui/basic/tooltip.tsx → src/components/ui/tooltip.tsx

## Import Cycles
- None detected.

## Communities (79 total, 20 thin omitted)

### Community 0 - "Capacitor and Core Dependencies"
Cohesion: 0.03
Nodes (67): dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor-community/contacts, @capacitor-community/file-opener, @capacitor-community/speech-recognition, @capacitor/core (+59 more)

### Community 1 - "UI Component Alert Dialogs"
Cohesion: 0.07
Nodes (23): audioManager, DiagnosticoInfo, DiagnosticoInfoProps, MicButton, PermissionWarning, RecordingIndicator, restartManager, SectionHeader (+15 more)

### Community 2 - "Tasks and Spare Parts Management"
Cohesion: 0.19
Nodes (15): configDocRef(), migrarSiEsNecesario(), obtenerPiezasPredefinidas(), obtenerTareasPredefinidas(), PIEZAS_DEFAULT, piezasCol(), sembrarPiezas(), sembrarTareas() (+7 more)

### Community 3 - "Tasks and Spare Parts Management"
Cohesion: 0.12
Nodes (12): CLS_BTN_PRIMARY, CLS_BTN_SECONDARY, CLS_CARD, DEFAULT_TIPO, DeviceIcon, Highlight, LAPTOP_BRANDS, OrdenCard (+4 more)

### Community 4 - "UI Accordion and Badges Components"
Cohesion: 0.08
Nodes (25): AccordionContent, AccordionItem, AccordionTrigger, Badge(), BadgeProps, badgeVariants, PopoverContent, Progress (+17 more)

### Community 5 - "Business Config and Multi User"
Cohesion: 0.06
Nodes (57): Sidebar, SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME, SIDEBAR_KEYBOARD_SHORTCUT, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON, SIDEBAR_WIDTH_MOBILE, SidebarContent (+49 more)

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
Cohesion: 0.15
Nodes (16): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants (+8 more)

### Community 11 - "UI Select Menu component"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 12 - "Authentication and Users Management"
Cohesion: 0.19
Nodes (11): Alert, AlertDescription, AlertTitle, alertVariants, Card, CardContent, CardDescription, CardFooter (+3 more)

### Community 13 - "Tasks and Spare Parts Management"
Cohesion: 0.23
Nodes (13): AuthGuard(), AuthGuardProps, PUBLIC_ROUTES, useAuth(), useAppLifecycle(), ConfiguracionPage(), useCrearOrden(), useNegocioUsuario() (+5 more)

### Community 14 - "Encryption and Offline Sync Queue"
Cohesion: 0.10
Nodes (38): inter, metadata, RootLayout(), AuthProvider(), decryptData(), encryptData(), clearLocalIdPool(), formatIdPersonalizado() (+30 more)

### Community 15 - "UI Dialogs and Forms"
Cohesion: 0.14
Nodes (17): Form, FormControl, FormDescription, FormField(), FormFieldContext, FormFieldContextValue, FormItem, FormItemContext (+9 more)

### Community 16 - "UI Select Menu component"
Cohesion: 0.19
Nodes (12): DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle, ClienteCard, ClientesDataTableProps (+4 more)

### Community 17 - "Sidebar Navigation"
Cohesion: 0.40
Nodes (4): Contador, ContadorInput, ContadorInputProps, TIPOS_CONTADOR

### Community 18 - "UI Dialogs and Forms"
Cohesion: 0.07
Nodes (37): AppLayout(), LayoutContent(), SpeechContext, SpeechContextType, SpeechProvider(), useKeyboardVisible(), usePrefetchData(), useScrollAware() (+29 more)

### Community 19 - "TypeScript Compiler Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 20 - "Authentication and Users Management"
Cohesion: 0.11
Nodes (18): HTML Seed Template, Theme Tokens, P0 Must-Pass Checklist, Section Rhythm Guidance, Layout Skeletons, Tomato Web Prototype Example, Web Prototype Hard Rules, Hard rules (the seed protects most of these — don't fight it) (+10 more)

### Community 21 - "Tasks and Spare Parts Management"
Cohesion: 0.09
Nodes (36): cleanBoolean(), cleanDate(), cleanNumber(), cleanString(), cleanStringArray(), parseDateLike(), sanitizeClientePayload(), sanitizeDispositivo() (+28 more)

### Community 22 - "Capacitor and Core Dependencies"
Cohesion: 0.19
Nodes (9): useOrdenesBusqueda(), useOrdenesInfinitas(), useSyncTodasLasOrdenes(), buildSearchableText(), formatFechaPure(), getTipoLabel(), Highlight, OrdenesMantenimientoPage() (+1 more)

### Community 23 - "Navigation and Keyboard Hooks"
Cohesion: 0.11
Nodes (14): GarantiaInputProps, Garantia Info, Garantia Input, usePersistentReducer(), FormAction, FormStep, FormularioMantenimientoProps, initialState (+6 more)

### Community 24 - "Module components"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 25 - "Module menubar"
Cohesion: 0.16
Nodes (13): modalOrdenImport(), ActionBtn, Card, Chip, DataRow, DetailView, isCapacitor(), isNativePlatform() (+5 more)

### Community 27 - "UI Select Menu component"
Cohesion: 0.16
Nodes (16): ClienteHistorialModal(), ClienteHistorialModalProps, HistorialContent, HistorialContentProps, ModalOrdenLazy, OrdenItem, VirtualRow, ClienteHistorialModalLazy (+8 more)

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
Cohesion: 0.17
Nodes (14): UserProfile(), Avatar, AvatarFallback, AvatarImage, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel (+6 more)

### Community 32 - "Capacitor and Core Dependencies"
Cohesion: 0.18
Nodes (12): useCompletarOnboarding(), useEstadisticasUsuario(), useOrdenesRecientes(), BusinessAvatar, DraftBanner, EmptyOrdenes, OrdenesDashboardContent(), StatCard (+4 more)

### Community 33 - "Capacitor and Core Dependencies"
Cohesion: 0.13
Nodes (14): AuthContext, AuthContextType, logger, SECURITY_CONFIG, UserDocument, UserData, useUserData(), getUser() (+6 more)

### Community 34 - "Client Management Modals"
Cohesion: 0.13
Nodes (14): 1. FICHA TÉCNICA DEL PROYECTO, 2. DIAGNÓSTICO RÁPIDO, 3. ANÁLISIS TÉCNICO — LO QUE EL CÓDIGO REVELA, 4. EXPERIENCIA DE USO — DESDE EL CÓDIGO, 5. FIT CON EL MERCADO COLOMBIANO — LECTURA TÉCNICA, 6. NO NEGOCIABLES — LO QUE BLOQUEA EL LANZAMIENTO, 7. QUÉ QUITAR — SCOPE CREEP DETECTADO EN EL CÓDIGO, 8. RESUMEN DE ÁREAS DE MEJORA PRIORITARIAS (+6 more)

### Community 35 - "UI Dialogs and Forms"
Cohesion: 0.18
Nodes (13): Checkbox, ClientesDataTable, ClienteSimpleFormModal(), ClientesList(), ClientesSkeleton, ImportarContactosModal(), ImportarContactosModalProps, MOCK_CONTACTS (+5 more)

### Community 36 - "Capacitor and Core Dependencies"
Cohesion: 0.38
Nodes (5): Button, ButtonProps, buttonVariants, Calendar(), CalendarProps

### Community 37 - "Module WelcomeScreen"
Cohesion: 0.15
Nodes (12): Class inventory (must exist in `template.html`), Layout 1 — Hero, centered, Layout 2 — Hero, split (text + visual), Layout 3 — Feature triplet, Layout 4 — Stat row (data billboard), Layout 5 — Pull quote (testimonial), Layout 6 — CTA strip (closing), Layout 7 — Log list (changelog / blog index / posts) (+4 more)

### Community 38 - "Business Config and Multi User"
Cohesion: 0.10
Nodes (23): ClienteCardProps, ClienteSimpleFormModalProps, ClienteViewModalProps, DispositivoFormModalProps, ClienteModalState, ModalMode, ClienteRow, ClienteRowProps (+15 more)

### Community 39 - "UI Select Menu component"
Cohesion: 0.27
Nodes (9): FirmaInput(), FirmaInputProps, ResumenMantenimiento(), ResumenMantenimientoProps, SignatureState, useSignatureCanvas(), deobfuscateSignature(), obfuscateSignature() (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.14
Nodes (6): useTareasYPiezas(), PiezaItem, TareaItem, TareasRepuestosPage(), ToastData, useDebounce()

### Community 43 - "Module AnimatedList"
Cohesion: 0.10
Nodes (20): devDependencies, @capacitor/assets, postcss, tailwindcss, @types/crypto-js, @types/node, @types/react, @types/react-dom (+12 more)

### Community 44 - "Community 44"
Cohesion: 0.16
Nodes (11): Label, labelVariants, Tabs, TabsContent, TabsList, TabsTrigger, NegocioHeaderProps, NegocioConUsuario (+3 more)

### Community 45 - "Community 45"
Cohesion: 0.27
Nodes (8): useNetworkStatus(), useOfflineOrderQueue(), useOfflineQueue(), queryKeys, TareaPredefinida, useOfflineSync(), NetworkStatusBanner(), OfflineSyncBanner()

### Community 47 - "Module logo"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 48 - "Community 48"
Cohesion: 0.15
Nodes (16): PiezaPredefinida, colorStyles, FORM_PIEZA_VACIO, FormPieza, FormularioPieza, ModalPieza(), ModalPiezaProps, colorStyles (+8 more)

### Community 49 - "UI Dialogs and Forms"
Cohesion: 0.27
Nodes (6): Button, ButtonProps, buttonVariants, Input, sidebarMenuButtonVariants, TooltipContent

### Community 51 - "Module UpgradePrompt"
Cohesion: 0.29
Nodes (6): Anti-Slop Spot Check, Anti-slop spot-check, P0 — must pass, P1 — should pass, P2 — nice to have, Web prototype checklist

### Community 55 - "Module splash"
Cohesion: 0.50
Nodes (3): FixedSizeList, FixedSizeListProps, ListChildComponentProps

### Community 56 - "Community 56"
Cohesion: 0.33
Nodes (12): useTareasYPiezas, actualizarPieza(), actualizarTarea(), crearPieza(), crearTarea(), eliminarPieza(), eliminarTarea(), piezaDocRef() (+4 more)

### Community 59 - "Community 59"
Cohesion: 0.24
Nodes (6): OnboardingSuccess(), OnboardingSuccessProps, WelcomeScreen(), WelcomeScreenProps, AnimatedContent(), AnimatedContentProps

### Community 65 - "Community 65"
Cohesion: 0.18
Nodes (6): DashboardGreeting, DAY_NAMES, GREETINGS, MONTH_NAMES, Negocio, User

## Knowledge Gaps
- **481 isolated node(s):** `config`, `$schema`, `style`, `rsc`, `tsx` (+476 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Accordion and Badges Components` to `Tasks and Spare Parts Management`, `Business Config and Multi User`, `Navigation and Keyboard Hooks`, `Tasks and Spare Parts Management`, `UI Toast Notifications`, `UI Select Menu component`, `Authentication and Users Management`, `UI Dialogs and Forms`, `UI Select Menu component`, `UI Dialogs and Forms`, `Module menubar`, `UI Select Menu component`, `Module OrdenCard`, `UI Dialogs and Forms`, `Capacitor and Core Dependencies`, `UI Dialogs and Forms`, `Capacitor and Core Dependencies`, `Community 44`, `Module logo`, `UI Dialogs and Forms`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Tasks and Spare Parts Management` to `Capacitor and Core Dependencies`, `Capacitor and Core Dependencies`, `UI Dialogs and Forms`, `Tasks and Spare Parts Management`, `Community 42`, `Community 44`, `Community 45`, `Authentication and Users Management`, `UI Dialogs and Forms`, `Encryption and Offline Sync Queue`, `UI Dialogs and Forms`, `Tasks and Spare Parts Management`, `Capacitor and Core Dependencies`, `Navigation and Keyboard Hooks`, `Community 56`, `UI Select Menu component`, `Sidebar Navigation`, `UI Dialogs and Forms`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `OrdenMantenimiento` connect `Business Config and Multi User` to `Capacitor and Core Dependencies`, `Tasks and Spare Parts Management`, `Business Config and Multi User`, `UI Select Menu component`, `Encryption and Offline Sync Queue`, `Tasks and Spare Parts Management`, `Capacitor and Core Dependencies`, `Navigation and Keyboard Hooks`, `Module menubar`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useAuth()` (e.g. with `AppLayout()` and `ClientesPage()`) actually correct?**
  _`useAuth()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `SidebarContext` (e.g. with `Comp` and `Sidebar`) actually correct?**
  _`SidebarContext` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `SidebarContextProps` (e.g. with `Sidebar` and `SidebarContent`) actually correct?**
  _`SidebarContextProps` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `config`, `$schema`, `style` to the rest of the system?**
  _485 weakly-connected nodes found - possible documentation gaps or missing edges._