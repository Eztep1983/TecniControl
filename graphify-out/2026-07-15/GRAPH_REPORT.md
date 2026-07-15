# Graph Report - TecniControl  (2026-07-14)

## Corpus Check
- 187 files · ~373,250 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1224 nodes · 2439 edges · 85 communities (62 shown, 23 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 111 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1a0b0033`
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
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Module WelcomeScreen|Module WelcomeScreen]]
- [[_COMMUNITY_Business Config and Multi User|Business Config and Multi User]]
- [[_COMMUNITY_UI Select Menu component|UI Select Menu component]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Module AnimatedList|Module AnimatedList]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
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
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Module collapsible|Module collapsible]]
- [[_COMMUNITY_Module popover|Module popover]]
- [[_COMMUNITY_UI Select Menu component|UI Select Menu component]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Module cors|Module cors]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Module pnpm-workspace|Module pnpm-workspace]]
- [[_COMMUNITY_Module checklist|Module checklist]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 67 edges
2. `cn()` - 67 edges
3. `SidebarContext` - 32 edges
4. `SidebarContextProps` - 25 edges
5. `Cliente` - 24 edges
6. `useMobileNavigation()` - 23 edges
7. `OrdenMantenimiento` - 21 edges
8. `db` - 19 edges
9. `OfflineSyncProvider()` - 17 edges
10. `useNegocio()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `graphify` --semantically_similar_to--> `graphify`  [INFERRED] [semantically similar]
  AGENTS.md → CLAUDE.md
- `AppLayout()` --calls--> `useAuth()`  [INFERRED]
  src/app/(app)/layout.tsx → src/components/auth/AuthProvider.tsx
- `ClienteSelector` --semantically_similar_to--> `DispositivoSelector()`  [INFERRED] [semantically similar]
  src/components/forms/ClienteSelector.tsx → src/components/forms/DispositivoSelector.tsx
- `Separator` --semantically_similar_to--> `Separator`  [INFERRED] [semantically similar]
  src/components/ui/basic/separator.tsx → src/components/ui/separator.tsx
- `useIsMobile()` --semantically_similar_to--> `useMediaQuery()`  [INFERRED] [semantically similar]
  src/hooks/use-mobile.tsx → src/hooks/clientes/useMediaQuery.ts

## Import Cycles
- None detected.

## Communities (85 total, 23 thin omitted)

### Community 0 - "Capacitor and Core Dependencies"
Cohesion: 0.03
Nodes (70): dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor-community/contacts, @capacitor-community/file-opener, @capacitor-community/speech-recognition, @capacitor/core (+62 more)

### Community 1 - "UI Component Alert Dialogs"
Cohesion: 0.07
Nodes (23): audioManager, DiagnosticoInfo, DiagnosticoInfoProps, MicButton, PermissionWarning, RecordingIndicator, restartManager, SectionHeader (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.20
Nodes (21): useTareasYPiezas, actualizarPieza(), actualizarTarea(), configDocRef(), crearPieza(), crearTarea(), eliminarPieza(), eliminarTarea() (+13 more)

### Community 3 - "Tasks and Spare Parts Management"
Cohesion: 0.13
Nodes (11): CLS_BTN_PRIMARY, CLS_BTN_SECONDARY, CLS_CARD, DEFAULT_TIPO, DeviceIcon, Highlight, LAPTOP_BRANDS, OrdenCard (+3 more)

### Community 4 - "UI Accordion and Badges Components"
Cohesion: 0.06
Nodes (37): AccordionContent, AccordionItem, AccordionTrigger, Badge(), BadgeProps, badgeVariants, labelVariants, PopoverContent (+29 more)

### Community 5 - "Business Config and Multi User"
Cohesion: 0.07
Nodes (44): Separator, Comp, Sidebar, SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME, SIDEBAR_KEYBOARD_SHORTCUT, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON (+36 more)

### Community 6 - "Open Design System Schema"
Cohesion: 0.05
Nodes (38): author, name, url, compat, agentSkills, assets, designSystem, skills (+30 more)

### Community 7 - "Sidebar Navigation"
Cohesion: 0.06
Nodes (31): ACCESIBILIDAD, ANIMACIONES, API, BASE DE DATOS, BOTONES, COLORES, COMPONENTES, DASHBOARDS SaaS (+23 more)

### Community 8 - "Navigation and Keyboard Hooks"
Cohesion: 0.14
Nodes (23): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+15 more)

### Community 9 - "Tasks and Spare Parts Management"
Cohesion: 0.12
Nodes (9): AuthProvider, CuentaYSeguridad(), ExportAction, ExportState, ExportStep, getAuthProvider(), getUserInitials(), InlineStatus (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (13): AppLayout(), LayoutContent(), SpeechContext, SpeechContextType, SpeechProvider(), SidebarInset, SidebarProvider, DashboardSkeleton() (+5 more)

### Community 11 - "UI Select Menu component"
Cohesion: 0.17
Nodes (14): UserProfile(), Avatar, AvatarFallback, AvatarImage, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel (+6 more)

### Community 12 - "Authentication and Users Management"
Cohesion: 0.05
Nodes (40): 10.1. Cláusula de Fuerza Mayor, 10. Compartición con Terceros y Transferencia Internacional de Datos, 10. Limitación de Responsabilidad, 11. Cookies, Analítica y Monitoreo de Rendimiento, 11. Titularidad y Portabilidad de los Datos, 12. Gestión de Incidentes y Brechas de Seguridad, 12. Servicios de Terceros y Canales de Comunicación, 13. Herramientas Automatizadas y Futuras Integraciones de IA (+32 more)

### Community 13 - "Community 13"
Cohesion: 0.16
Nodes (16): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+8 more)

### Community 14 - "Encryption and Offline Sync Queue"
Cohesion: 0.06
Nodes (54): inter, metadata, RootLayout(), AuthGuard(), AuthGuardProps, PUBLIC_ROUTES, AuthContext, AuthContextType (+46 more)

### Community 15 - "UI Dialogs and Forms"
Cohesion: 0.15
Nodes (17): Form, FormControl, FormDescription, FormField(), FormFieldContext, FormFieldContextValue, FormItem, FormItemContext (+9 more)

### Community 16 - "UI Select Menu component"
Cohesion: 0.24
Nodes (15): useAuth(), ClientesDataTable, ClienteSimpleFormModal(), ClientesList(), ClientesSkeleton, ClienteViewModal(), ImportarContactosModal(), ClientesPage() (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (7): Alert, AlertDescription, AlertTitle, alertVariants, FormLabel, Label, SLIDES

### Community 18 - "UI Dialogs and Forms"
Cohesion: 0.15
Nodes (18): AppView, getPathByView(), getRouteByPath(), RouteConfig, ROUTES, TAB_ORDER, GlobalFormularioMantenimiento, GlobalOnboardingForm (+10 more)

### Community 19 - "TypeScript Compiler Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 20 - "Authentication and Users Management"
Cohesion: 0.11
Nodes (18): HTML Seed Template, Theme Tokens, P0 Must-Pass Checklist, Section Rhythm Guidance, Layout Skeletons, Tomato Web Prototype Example, Web Prototype Hard Rules, Hard rules (the seed protects most of these — don't fight it) (+10 more)

### Community 21 - "Tasks and Spare Parts Management"
Cohesion: 0.07
Nodes (44): NegocioHeaderProps, NegocioConUsuario, useOrdenesBusqueda(), useOrdenesInfinitas(), useOrdenesUsuario(), useSyncTodasLasOrdenes(), cleanBoolean(), cleanDate() (+36 more)

### Community 23 - "Navigation and Keyboard Hooks"
Cohesion: 0.12
Nodes (17): SidebarContent, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, usePrefetchData(), AppSidebar() (+9 more)

### Community 24 - "Module components"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 25 - "Module menubar"
Cohesion: 0.18
Nodes (13): modalOrdenImport(), ActionBtn, Card, Chip, DataRow, DetailView, isCapacitor(), isNativePlatform() (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.09
Nodes (25): Contador, ContadorInput, ContadorInputProps, TIPOS_CONTADOR, GarantiaInputProps, useKeyboardVisible(), useCrearOrden(), usePersistentReducer() (+17 more)

### Community 27 - "UI Select Menu component"
Cohesion: 0.18
Nodes (14): DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle, ClienteCard, ClientesDataTableProps (+6 more)

### Community 28 - "Module OrdenCard"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 29 - "Sidebar Navigation"
Cohesion: 0.18
Nodes (13): TareasInputProps, Button, ButtonProps, buttonVariants, Drawer(), DrawerContent, DrawerDescription, DrawerFooter() (+5 more)

### Community 30 - "Business Config and Multi User"
Cohesion: 0.18
Nodes (13): formatFecha(), OrdenCardProps, DownloadButtonProps, escapeHTML(), generarContenidoHTML(), isCapacitor(), isNativePlatform(), PrintButton() (+5 more)

### Community 32 - "Capacitor and Core Dependencies"
Cohesion: 0.15
Nodes (12): useCompletarOnboarding(), useOrdenesRecientes(), ActivationChecklistProps, BusinessAvatar, DraftBanner, EmptyOrdenes, OrdenesDashboardContent(), StatCard (+4 more)

### Community 33 - "Community 33"
Cohesion: 0.19
Nodes (11): ClienteHistorialModal(), ClienteHistorialModalProps, HistorialContent, HistorialContentProps, ModalOrdenLazy, OrdenItem, VirtualRow, useOrdenesCliente() (+3 more)

### Community 35 - "Community 35"
Cohesion: 0.27
Nodes (8): useNetworkStatus(), useOfflineOrderQueue(), useOfflineQueue(), queryKeys, TareaPredefinida, useOfflineSync(), NetworkStatusBanner(), OfflineSyncBanner()

### Community 36 - "Community 36"
Cohesion: 0.35
Nodes (9): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, FiltroTiempo, useReporteConsumo() (+1 more)

### Community 37 - "Module WelcomeScreen"
Cohesion: 0.15
Nodes (12): Class inventory (must exist in `template.html`), Layout 1 — Hero, centered, Layout 2 — Hero, split (text + visual), Layout 3 — Feature triplet, Layout 4 — Stat row (data billboard), Layout 5 — Pull quote (testimonial), Layout 6 — CTA strip (closing), Layout 7 — Log list (changelog / blog index / posts) (+4 more)

### Community 38 - "Business Config and Multi User"
Cohesion: 0.11
Nodes (19): ClienteCardProps, ClienteSimpleFormModalProps, ClienteViewModalProps, DispositivoFormModalProps, ClienteModalState, ModalMode, ClienteRow, ClienteRowProps (+11 more)

### Community 39 - "UI Select Menu component"
Cohesion: 0.27
Nodes (9): FirmaInput(), FirmaInputProps, ResumenMantenimiento(), ResumenMantenimientoProps, SignatureState, useSignatureCanvas(), deobfuscateSignature(), obfuscateSignature() (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.24
Nodes (6): OnboardingSuccess(), OnboardingSuccessProps, WelcomeScreen(), WelcomeScreenProps, AnimatedContent(), AnimatedContentProps

### Community 41 - "Community 41"
Cohesion: 0.38
Nodes (5): Button, ButtonProps, buttonVariants, Calendar(), CalendarProps

### Community 42 - "Community 42"
Cohesion: 0.14
Nodes (16): ConfiguracionPage(), useEstadisticasUsuario(), useNegocio(), useScrollAware(), buildSearchableText(), formatFechaPure(), getTipoLabel(), Highlight (+8 more)

### Community 43 - "Module AnimatedList"
Cohesion: 0.10
Nodes (20): devDependencies, @capacitor/assets, postcss, tailwindcss, @types/crypto-js, @types/node, @types/react, @types/react-dom (+12 more)

### Community 44 - "Community 44"
Cohesion: 0.20
Nodes (9): Pieza, PiezasInputProps, SelectorCantidad, PiezaPredefinida, colorStyles, FORM_PIEZA_VACIO, FormPieza, FormularioPieza (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 46 - "Community 46"
Cohesion: 0.40
Nodes (8): buildClientSearchableString(), buildSearchableString(), cleanAlphanumeric(), paginateLocalOrders(), performLocalClientSearch(), performLocalSearch(), removeDiacritics(), mockOrders

### Community 47 - "Community 47"
Cohesion: 0.23
Nodes (10): ModalPieza(), colorStyles, FORM_TAREA_VACIO, FormTarea, FormularioTarea, ModalTarea(), ModalTareaProps, Modal() (+2 more)

### Community 48 - "Community 48"
Cohesion: 0.14
Nodes (6): useTareasYPiezas(), PiezaItem, TareaItem, TareasRepuestosPage(), ToastData, useDebounce()

### Community 49 - "Community 49"
Cohesion: 0.33
Nodes (4): directoryPath, fs, path, replacements

### Community 50 - "Community 50"
Cohesion: 0.33
Nodes (5): mockBatchSet, mockCommit, mockGetDoc, mockGetDocs, mockSetDoc

### Community 51 - "Module UpgradePrompt"
Cohesion: 0.29
Nodes (6): Anti-Slop Spot Check, Anti-slop spot-check, P0 — must pass, P1 — should pass, P2 — nice to have, Web prototype checklist

### Community 55 - "Module splash"
Cohesion: 0.50
Nodes (3): FixedSizeList, FixedSizeListProps, ListChildComponentProps

### Community 64 - "Community 64"
Cohesion: 0.18
Nodes (6): DashboardGreeting, DAY_NAMES, GREETINGS, MONTH_NAMES, Negocio, User

### Community 69 - "Community 69"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 75 - "Community 75"
Cohesion: 0.38
Nodes (4): Checkbox, ImportarContactosModalProps, MOCK_CONTACTS, useAndroidBack()

### Community 76 - "Community 76"
Cohesion: 0.43
Nodes (6): DispositivoFormModal(), DispositivoRow, DispositivoRowProps, DispositivoSelector(), getEstadoStyle(), getIconoDispositivo()

## Knowledge Gaps
- **521 isolated node(s):** `SLIDES`, `config`, `$schema`, `style`, `rsc` (+516 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Accordion and Badges Components` to `Tasks and Spare Parts Management`, `Business Config and Multi User`, `Navigation and Keyboard Hooks`, `Community 10`, `UI Select Menu component`, `Community 13`, `UI Dialogs and Forms`, `Community 17`, `Module menubar`, `UI Select Menu component`, `Module OrdenCard`, `Sidebar Navigation`, `Capacitor and Core Dependencies`, `Community 33`, `Community 36`, `Community 41`, `Community 42`, `Community 45`, `Community 69`, `Community 75`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `UI Select Menu component` to `Tasks and Spare Parts Management`, `Community 10`, `UI Select Menu component`, `Community 13`, `Encryption and Offline Sync Queue`, `UI Dialogs and Forms`, `Community 17`, `Tasks and Spare Parts Management`, `Navigation and Keyboard Hooks`, `Community 26`, `UI Select Menu component`, `Sidebar Navigation`, `Capacitor and Core Dependencies`, `Community 33`, `Community 35`, `Community 36`, `Community 42`, `Community 44`, `Community 48`, `Community 75`, `Community 76`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `SidebarContext` connect `Business Config and Multi User` to `Community 10`, `Navigation and Keyboard Hooks`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useAuth()` (e.g. with `AppLayout()` and `ClientesPage()`) actually correct?**
  _`useAuth()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `SidebarContext` (e.g. with `Comp` and `Sidebar`) actually correct?**
  _`SidebarContext` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `SidebarContextProps` (e.g. with `Sidebar` and `SidebarContent`) actually correct?**
  _`SidebarContextProps` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SLIDES`, `config`, `$schema` to the rest of the system?**
  _525 weakly-connected nodes found - possible documentation gaps or missing edges._