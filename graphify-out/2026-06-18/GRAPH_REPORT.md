# Graph Report - TecniControl  (2026-06-18)

## Corpus Check
- 170 files · ~379,489 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1162 nodes · 2254 edges · 72 communities (53 shown, 19 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 108 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `93497158`
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
- [[_COMMUNITY_UI Dialogs and Forms|UI Dialogs and Forms]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Module WelcomeScreen|Module WelcomeScreen]]
- [[_COMMUNITY_Business Config and Multi User|Business Config and Multi User]]
- [[_COMMUNITY_UI Select Menu component|UI Select Menu component]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
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
9. `PARTE II: POLÍTICA DE TRATAMIENTO DE DATOS PERSONALES (Habeas Data)` - 17 edges
10. `useMobileNavigation()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `graphify` --semantically_similar_to--> `graphify`  [INFERRED] [semantically similar]
  AGENTS.md → CLAUDE.md
- `AppLayout()` --calls--> `useAuth()`  [INFERRED]
  src/app/(app)/layout.tsx → src/components/auth/AuthProvider.tsx
- `OfflineSyncProvider()` --semantically_similar_to--> `FirestoreSyncProvider()`  [INFERRED] [semantically similar]
  src/components/providers/OfflineSyncProvider.tsx → src/components/providers/FirestoreSyncProvider.tsx
- `Separator` --semantically_similar_to--> `Separator`  [INFERRED] [semantically similar]
  src/components/ui/basic/separator.tsx → src/components/ui/separator.tsx
- `SheetTitle` --semantically_similar_to--> `SheetTitle`  [INFERRED] [semantically similar]
  src/components/ui/basic/sheet.tsx → src/components/ui/sheet.tsx

## Import Cycles
- None detected.

## Communities (72 total, 19 thin omitted)

### Community 0 - "Capacitor and Core Dependencies"
Cohesion: 0.03
Nodes (67): dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor-community/contacts, @capacitor-community/file-opener, @capacitor-community/speech-recognition, @capacitor/core (+59 more)

### Community 1 - "UI Component Alert Dialogs"
Cohesion: 0.07
Nodes (23): audioManager, DiagnosticoInfo, DiagnosticoInfoProps, MicButton, PermissionWarning, RecordingIndicator, restartManager, SectionHeader (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (13): AppLayout(), LayoutContent(), SpeechContext, SpeechContextType, SpeechProvider(), usePrefetchData(), AppSidebar(), navigation (+5 more)

### Community 3 - "Tasks and Spare Parts Management"
Cohesion: 0.12
Nodes (12): CLS_BTN_PRIMARY, CLS_BTN_SECONDARY, CLS_CARD, DEFAULT_TIPO, DeviceIcon, Highlight, LAPTOP_BRANDS, OrdenCard (+4 more)

### Community 4 - "UI Accordion and Badges Components"
Cohesion: 0.06
Nodes (33): AccordionContent, AccordionItem, AccordionTrigger, Badge(), BadgeProps, badgeVariants, Checkbox, PopoverContent (+25 more)

### Community 5 - "Business Config and Multi User"
Cohesion: 0.06
Nodes (59): Separator, Comp, Sidebar, SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME, SIDEBAR_KEYBOARD_SHORTCUT, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON (+51 more)

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
Nodes (40): Alert, AlertDescription, AlertTitle, alertVariants, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription (+32 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (14): UserProfile(), Avatar, AvatarFallback, AvatarImage, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel (+6 more)

### Community 11 - "UI Select Menu component"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 12 - "Authentication and Users Management"
Cohesion: 0.05
Nodes (40): 10.1. Cláusula de Fuerza Mayor, 10. Compartición con Terceros y Transferencia Internacional de Datos, 10. Limitación de Responsabilidad, 11. Cookies, Analítica y Monitoreo de Rendimiento, 11. Titularidad y Portabilidad de los Datos, 12. Gestión de Incidentes y Brechas de Seguridad, 12. Servicios de Terceros y Canales de Comunicación, 13. Herramientas Automatizadas y Futuras Integraciones de IA (+32 more)

### Community 13 - "Community 13"
Cohesion: 0.19
Nodes (15): configDocRef(), migrarSiEsNecesario(), obtenerPiezasPredefinidas(), obtenerTareasPredefinidas(), PIEZAS_DEFAULT, piezasCol(), sembrarPiezas(), sembrarTareas() (+7 more)

### Community 14 - "Encryption and Offline Sync Queue"
Cohesion: 0.14
Nodes (31): decryptData(), encryptData(), clearLocalIdPool(), formatIdPersonalizado(), getLocalIdPool(), IDPoolRange, obtenerSiguienteIdDePool(), saveLocalIdPool() (+23 more)

### Community 15 - "UI Dialogs and Forms"
Cohesion: 0.11
Nodes (27): DialogContent, DialogTitle, Form, FormControl, FormDescription, FormField(), FormFieldContext, FormFieldContextValue (+19 more)

### Community 16 - "UI Select Menu component"
Cohesion: 0.17
Nodes (8): ClientesDataTable, ClientesList(), ClientesSkeleton, ClienteViewModal(), haptic, useHapticFeedback(), usePullToRefresh(), UsePullToRefreshOptions

### Community 17 - "Community 17"
Cohesion: 0.16
Nodes (14): SheetContent, SheetContentProps, SheetFooter(), SheetHeader(), SheetOverlay, sheetVariants, SheetContent, SheetContentProps (+6 more)

### Community 18 - "UI Dialogs and Forms"
Cohesion: 0.11
Nodes (25): useKeyboardVisible(), useEstadisticasUsuario(), useScrollAware(), AppView, getPathByView(), getRouteByPath(), RouteConfig, ROUTES (+17 more)

### Community 19 - "TypeScript Compiler Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 20 - "Authentication and Users Management"
Cohesion: 0.11
Nodes (18): HTML Seed Template, Theme Tokens, P0 Must-Pass Checklist, Section Rhythm Guidance, Layout Skeletons, Tomato Web Prototype Example, Web Prototype Hard Rules, Hard rules (the seed protects most of these — don't fight it) (+10 more)

### Community 21 - "Tasks and Spare Parts Management"
Cohesion: 0.08
Nodes (42): NegocioHeaderProps, NegocioConUsuario, cleanBoolean(), cleanDate(), cleanNumber(), cleanString(), cleanStringArray(), parseDateLike() (+34 more)

### Community 22 - "Capacitor and Core Dependencies"
Cohesion: 0.27
Nodes (8): useNetworkStatus(), useOfflineOrderQueue(), useOfflineQueue(), queryKeys, TareaPredefinida, useOfflineSync(), NetworkStatusBanner(), OfflineSyncBanner()

### Community 23 - "Navigation and Keyboard Hooks"
Cohesion: 0.13
Nodes (16): Garantia Info, Garantia Input, useCrearOrden(), usePersistentReducer(), FormAction, FormStep, FormularioMantenimiento(), FormularioMantenimientoProps (+8 more)

### Community 24 - "Module components"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 25 - "Module menubar"
Cohesion: 0.16
Nodes (13): modalOrdenImport(), ActionBtn, Card, Chip, DataRow, DetailView, isCapacitor(), isNativePlatform() (+5 more)

### Community 26 - "Community 26"
Cohesion: 0.36
Nodes (7): DispositivoFormModal(), ClienteSelector, DispositivoRow, DispositivoRowProps, DispositivoSelector(), getEstadoStyle(), getIconoDispositivo()

### Community 27 - "UI Select Menu component"
Cohesion: 0.16
Nodes (16): SheetDescription, SheetTitle, ClienteHistorialModal(), ClienteHistorialModalProps, HistorialContent, HistorialContentProps, ModalOrdenLazy, OrdenItem (+8 more)

### Community 28 - "Module OrdenCard"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 29 - "Sidebar Navigation"
Cohesion: 0.23
Nodes (7): useIsMobile(), Button, ButtonProps, buttonVariants, Input, sidebarMenuButtonVariants, TooltipContent

### Community 30 - "Business Config and Multi User"
Cohesion: 0.22
Nodes (11): DownloadButtonProps, escapeHTML(), generarContenidoHTML(), isCapacitor(), isNativePlatform(), PrintButton(), PrintButtonProps, PrintServiceProps (+3 more)

### Community 31 - "UI Dialogs and Forms"
Cohesion: 0.06
Nodes (42): inter, metadata, RootLayout(), AuthGuard(), AuthGuardProps, PUBLIC_ROUTES, AuthContext, AuthContextType (+34 more)

### Community 32 - "Capacitor and Core Dependencies"
Cohesion: 0.07
Nodes (23): useCompletarOnboarding(), useOrdenesRecientes(), OnboardingSuccess(), OnboardingSuccessProps, WelcomeScreen(), WelcomeScreenProps, BusinessAvatar, DraftBanner (+15 more)

### Community 33 - "Community 33"
Cohesion: 0.21
Nodes (10): DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, ClienteCard, ClientesDataTableProps, Pagination, PaginationProps (+2 more)

### Community 34 - "Client Management Modals"
Cohesion: 0.33
Nodes (12): useTareasYPiezas, actualizarPieza(), actualizarTarea(), crearPieza(), crearTarea(), eliminarPieza(), eliminarTarea(), piezaDocRef() (+4 more)

### Community 35 - "UI Dialogs and Forms"
Cohesion: 0.33
Nodes (6): PiezaPredefinida, colorStyles, FORM_PIEZA_VACIO, FormPieza, FormularioPieza, ModalPiezaProps

### Community 36 - "Community 36"
Cohesion: 0.28
Nodes (7): Pieza, PiezasInputProps, SelectorCantidad, TareasInput, TareasInputProps, Drawer(), DrawerContent

### Community 37 - "Module WelcomeScreen"
Cohesion: 0.15
Nodes (12): Class inventory (must exist in `template.html`), Layout 1 — Hero, centered, Layout 2 — Hero, split (text + visual), Layout 3 — Feature triplet, Layout 4 — Stat row (data billboard), Layout 5 — Pull quote (testimonial), Layout 6 — CTA strip (closing), Layout 7 — Log list (changelog / blog index / posts) (+4 more)

### Community 38 - "Business Config and Multi User"
Cohesion: 0.13
Nodes (17): ClienteCardProps, ClienteSimpleFormModalProps, ClienteViewModalProps, DispositivoFormModalProps, ClienteModalState, ModalMode, useClienteModal(), ClienteRow (+9 more)

### Community 39 - "UI Select Menu component"
Cohesion: 0.27
Nodes (9): FirmaInput(), FirmaInputProps, ResumenMantenimiento(), ResumenMantenimientoProps, SignatureState, useSignatureCanvas(), deobfuscateSignature(), obfuscateSignature() (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.40
Nodes (4): Contador, ContadorInput, ContadorInputProps, TIPOS_CONTADOR

### Community 43 - "Module AnimatedList"
Cohesion: 0.10
Nodes (20): devDependencies, @capacitor/assets, postcss, tailwindcss, @types/crypto-js, @types/node, @types/react, @types/react-dom (+12 more)

### Community 48 - "Community 48"
Cohesion: 0.10
Nodes (15): useTareasYPiezas(), ModalPieza(), colorStyles, FORM_TAREA_VACIO, FormTarea, FormularioTarea, ModalTarea(), ModalTareaProps (+7 more)

### Community 51 - "Module UpgradePrompt"
Cohesion: 0.29
Nodes (6): Anti-Slop Spot Check, Anti-slop spot-check, P0 — must pass, P1 — should pass, P2 — nice to have, Web prototype checklist

### Community 55 - "Module splash"
Cohesion: 0.50
Nodes (3): FixedSizeList, FixedSizeListProps, ListChildComponentProps

## Knowledge Gaps
- **501 isolated node(s):** `config`, `$schema`, `style`, `rsc`, `tsx` (+496 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Accordion and Badges Components` to `Capacitor and Core Dependencies`, `Community 33`, `Community 2`, `Tasks and Spare Parts Management`, `Business Config and Multi User`, `Navigation and Keyboard Hooks`, `Tasks and Spare Parts Management`, `Community 10`, `UI Select Menu component`, `UI Dialogs and Forms`, `Community 17`, `UI Dialogs and Forms`, `Module menubar`, `UI Select Menu component`, `Module OrdenCard`, `Sidebar Navigation`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `UI Dialogs and Forms` to `Capacitor and Core Dependencies`, `Community 2`, `Client Management Modals`, `Community 36`, `Tasks and Spare Parts Management`, `Community 10`, `Encryption and Offline Sync Queue`, `UI Dialogs and Forms`, `UI Select Menu component`, `Community 48`, `UI Dialogs and Forms`, `Tasks and Spare Parts Management`, `Capacitor and Core Dependencies`, `Navigation and Keyboard Hooks`, `Community 26`, `UI Select Menu component`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `OrdenMantenimiento` connect `Business Config and Multi User` to `Capacitor and Core Dependencies`, `Tasks and Spare Parts Management`, `Business Config and Multi User`, `UI Select Menu component`, `Encryption and Offline Sync Queue`, `Tasks and Spare Parts Management`, `Navigation and Keyboard Hooks`, `Module menubar`, `UI Dialogs and Forms`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useAuth()` (e.g. with `AppLayout()` and `ClientesPage()`) actually correct?**
  _`useAuth()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `SidebarContext` (e.g. with `Comp` and `Sidebar`) actually correct?**
  _`SidebarContext` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `SidebarContextProps` (e.g. with `Sidebar` and `SidebarContent`) actually correct?**
  _`SidebarContextProps` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `config`, `$schema`, `style` to the rest of the system?**
  _505 weakly-connected nodes found - possible documentation gaps or missing edges._