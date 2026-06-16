# Graph Report - TecniControl  (2026-06-16)

## Corpus Check
- 168 files · ~373,161 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1132 nodes · 2197 edges · 71 communities (53 shown, 18 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 108 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1f92a400`
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
- [[_COMMUNITY_Module AnimatedList|Module AnimatedList]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Module logo|Module logo]]
- [[_COMMUNITY_Community 48|Community 48]]
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
- `AppLayout()` --calls--> `useAuth()`  [INFERRED]
  src/app/(app)/layout.tsx → src/components/auth/AuthProvider.tsx
- `ClientesPage()` --calls--> `useAuth()`  [INFERRED]
  src/app/(app)/clientes/page.tsx → src/components/auth/AuthProvider.tsx
- `useIsMobile()` --semantically_similar_to--> `useMediaQuery()`  [INFERRED] [semantically similar]
  src/hooks/use-mobile.tsx → src/hooks/clientes/useMediaQuery.ts
- `sanitizeOrdenPayload()` --semantically_similar_to--> `serializeOrden()`  [INFERRED] [semantically similar]
  src/lib/firestore-sanitizers.ts → src/lib/orden-serializer.ts

## Import Cycles
- None detected.

## Communities (71 total, 18 thin omitted)

### Community 0 - "Capacitor and Core Dependencies"
Cohesion: 0.03
Nodes (67): dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor-community/contacts, @capacitor-community/file-opener, @capacitor-community/speech-recognition, @capacitor/core (+59 more)

### Community 1 - "UI Component Alert Dialogs"
Cohesion: 0.07
Nodes (23): audioManager, DiagnosticoInfo, DiagnosticoInfoProps, MicButton, PermissionWarning, RecordingIndicator, restartManager, SectionHeader (+15 more)

### Community 2 - "Tasks and Spare Parts Management"
Cohesion: 0.20
Nodes (10): devDependencies, @capacitor/assets, postcss, tailwindcss, @types/crypto-js, @types/node, @types/react, @types/react-dom (+2 more)

### Community 3 - "Tasks and Spare Parts Management"
Cohesion: 0.12
Nodes (12): CLS_BTN_PRIMARY, CLS_BTN_SECONDARY, CLS_CARD, DEFAULT_TIPO, DeviceIcon, Highlight, LAPTOP_BRANDS, OrdenCard (+4 more)

### Community 4 - "UI Accordion and Badges Components"
Cohesion: 0.06
Nodes (38): AccordionContent, AccordionItem, AccordionTrigger, Badge(), BadgeProps, badgeVariants, Checkbox, labelVariants (+30 more)

### Community 5 - "Business Config and Multi User"
Cohesion: 0.06
Nodes (60): Comp, Sidebar, SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME, SIDEBAR_KEYBOARD_SHORTCUT, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON, SIDEBAR_WIDTH_MOBILE (+52 more)

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
Cohesion: 0.11
Nodes (17): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+9 more)

### Community 11 - "UI Select Menu component"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 12 - "Authentication and Users Management"
Cohesion: 0.22
Nodes (10): Alert, AlertDescription, AlertTitle, alertVariants, Card, CardContent, CardDescription, CardFooter (+2 more)

### Community 13 - "Tasks and Spare Parts Management"
Cohesion: 0.17
Nodes (12): inter, metadata, RootLayout(), AuthGuard(), AuthGuardProps, PUBLIC_ROUTES, AuthProvider(), useAppLifecycle() (+4 more)

### Community 14 - "Encryption and Offline Sync Queue"
Cohesion: 0.10
Nodes (38): useNetworkStatus(), useOfflineOrderQueue(), useOfflineQueue(), decryptData(), encryptData(), clearLocalIdPool(), formatIdPersonalizado(), getLocalIdPool() (+30 more)

### Community 15 - "UI Dialogs and Forms"
Cohesion: 0.13
Nodes (24): Form, FormControl, FormDescription, FormField(), FormFieldContext, FormFieldContextValue, FormItem, FormItemContext (+16 more)

### Community 16 - "UI Select Menu component"
Cohesion: 0.18
Nodes (14): DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle, ClienteCard, ClienteCardProps (+6 more)

### Community 17 - "Sidebar Navigation"
Cohesion: 0.40
Nodes (4): Contador, ContadorInput, ContadorInputProps, TIPOS_CONTADOR

### Community 18 - "UI Dialogs and Forms"
Cohesion: 0.07
Nodes (34): AppLayout(), LayoutContent(), SpeechContext, SpeechContextType, SpeechProvider(), useKeyboardVisible(), useScrollAware(), AppView (+26 more)

### Community 19 - "TypeScript Compiler Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 20 - "Authentication and Users Management"
Cohesion: 0.11
Nodes (18): HTML Seed Template, Theme Tokens, P0 Must-Pass Checklist, Section Rhythm Guidance, Layout Skeletons, Tomato Web Prototype Example, Web Prototype Hard Rules, Hard rules (the seed protects most of these — don't fight it) (+10 more)

### Community 21 - "Tasks and Spare Parts Management"
Cohesion: 0.08
Nodes (40): useOrdenesUsuario(), cleanBoolean(), cleanDate(), cleanNumber(), cleanString(), cleanStringArray(), parseDateLike(), sanitizeClientePayload() (+32 more)

### Community 22 - "Capacitor and Core Dependencies"
Cohesion: 0.14
Nodes (23): useAuth(), useMediaQuery(), ConfiguracionPage(), useCrearOrden(), useEstadisticasUsuario(), useNegocioUsuario(), useOrdenesBusqueda(), useOrdenesInfinitas() (+15 more)

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
Cohesion: 0.11
Nodes (10): ClienteHistorialModalProps, HistorialContent, HistorialContentProps, ModalOrdenLazy, OrdenItem, VirtualRow, haptic, useOrdenesCliente() (+2 more)

### Community 28 - "Module OrdenCard"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 29 - "Sidebar Navigation"
Cohesion: 0.17
Nodes (15): Pieza, PiezasInputProps, SelectorCantidad, TareasInput, TareasInputProps, queryKeys, useTareasYPiezas(), TareaPredefinida (+7 more)

### Community 30 - "Business Config and Multi User"
Cohesion: 0.22
Nodes (11): DownloadButtonProps, escapeHTML(), generarContenidoHTML(), isCapacitor(), isNativePlatform(), PrintButton(), PrintButtonProps, PrintServiceProps (+3 more)

### Community 31 - "UI Dialogs and Forms"
Cohesion: 0.17
Nodes (14): UserProfile(), Avatar, AvatarFallback, AvatarImage, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel (+6 more)

### Community 32 - "Capacitor and Core Dependencies"
Cohesion: 0.07
Nodes (21): useCompletarOnboarding(), OnboardingSuccess(), OnboardingSuccessProps, WelcomeScreen(), WelcomeScreenProps, BusinessAvatar, DraftBanner, EmptyOrdenes (+13 more)

### Community 33 - "Capacitor and Core Dependencies"
Cohesion: 0.13
Nodes (14): AuthContext, AuthContextType, logger, SECURITY_CONFIG, UserDocument, UserData, useUserData(), getUser() (+6 more)

### Community 34 - "Client Management Modals"
Cohesion: 0.13
Nodes (14): 1. FICHA TÉCNICA DEL PROYECTO, 2. DIAGNÓSTICO RÁPIDO, 3. ANÁLISIS TÉCNICO — LO QUE EL CÓDIGO REVELA, 4. EXPERIENCIA DE USO — DESDE EL CÓDIGO, 5. FIT CON EL MERCADO COLOMBIANO — LECTURA TÉCNICA, 6. NO NEGOCIABLES — LO QUE BLOQUEA EL LANZAMIENTO, 7. QUÉ QUITAR — SCOPE CREEP DETECTADO EN EL CÓDIGO, 8. RESUMEN DE ÁREAS DE MEJORA PRIORITARIAS (+6 more)

### Community 35 - "UI Dialogs and Forms"
Cohesion: 0.26
Nodes (11): ClienteHistorialModal(), ClientesDataTable, ClientesList(), ClientesSkeleton, ClienteViewModal(), ClientesPage(), useClienteModal(), useHapticFeedback() (+3 more)

### Community 36 - "Capacitor and Core Dependencies"
Cohesion: 0.38
Nodes (5): Button, ButtonProps, buttonVariants, Calendar(), CalendarProps

### Community 37 - "Module WelcomeScreen"
Cohesion: 0.15
Nodes (12): Class inventory (must exist in `template.html`), Layout 1 — Hero, centered, Layout 2 — Hero, split (text + visual), Layout 3 — Feature triplet, Layout 4 — Stat row (data billboard), Layout 5 — Pull quote (testimonial), Layout 6 — CTA strip (closing), Layout 7 — Log list (changelog / blog index / posts) (+4 more)

### Community 38 - "Business Config and Multi User"
Cohesion: 0.11
Nodes (22): ClienteSimpleFormModalProps, ClienteViewModalProps, DispositivoFormModalProps, ClienteModalState, ModalMode, ClienteRow, ClienteRowProps, ClienteSelector (+14 more)

### Community 39 - "UI Select Menu component"
Cohesion: 0.27
Nodes (9): FirmaInput(), FirmaInputProps, ResumenMantenimiento(), ResumenMantenimientoProps, SignatureState, useSignatureCanvas(), deobfuscateSignature(), obfuscateSignature() (+1 more)

### Community 43 - "Module AnimatedList"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, lint, start, test (+2 more)

### Community 44 - "Community 44"
Cohesion: 0.17
Nodes (11): FormLabel, Label, Tabs, TabsContent, TabsList, TabsTrigger, NegocioHeaderProps, NegocioConUsuario (+3 more)

### Community 47 - "Module logo"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 48 - "Community 48"
Cohesion: 0.06
Nodes (43): useTareasYPiezas, actualizarPieza(), actualizarTarea(), configDocRef(), crearPieza(), crearTarea(), eliminarPieza(), eliminarTarea() (+35 more)

### Community 49 - "UI Dialogs and Forms"
Cohesion: 0.19
Nodes (8): TooltipContent, useIsMobile(), Button, ButtonProps, buttonVariants, Input, sidebarMenuButtonVariants, TooltipContent

### Community 51 - "Module UpgradePrompt"
Cohesion: 0.29
Nodes (6): Anti-Slop Spot Check, Anti-slop spot-check, P0 — must pass, P1 — should pass, P2 — nice to have, Web prototype checklist

### Community 55 - "Module splash"
Cohesion: 0.50
Nodes (3): FixedSizeList, FixedSizeListProps, ListChildComponentProps

## Knowledge Gaps
- **481 isolated node(s):** `config`, `name`, `version`, `private`, `dev` (+476 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Accordion and Badges Components` to `Tasks and Spare Parts Management`, `Business Config and Multi User`, `Navigation and Keyboard Hooks`, `Tasks and Spare Parts Management`, `UI Select Menu component`, `Authentication and Users Management`, `UI Dialogs and Forms`, `UI Select Menu component`, `UI Dialogs and Forms`, `Capacitor and Core Dependencies`, `Module menubar`, `UI Select Menu component`, `Module OrdenCard`, `Sidebar Navigation`, `UI Dialogs and Forms`, `Capacitor and Core Dependencies`, `Capacitor and Core Dependencies`, `Community 44`, `Module logo`, `UI Dialogs and Forms`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Capacitor and Core Dependencies` to `Capacitor and Core Dependencies`, `Capacitor and Core Dependencies`, `UI Dialogs and Forms`, `Tasks and Spare Parts Management`, `Community 44`, `Tasks and Spare Parts Management`, `Authentication and Users Management`, `UI Dialogs and Forms`, `UI Select Menu component`, `Encryption and Offline Sync Queue`, `UI Dialogs and Forms`, `Community 48`, `Tasks and Spare Parts Management`, `Navigation and Keyboard Hooks`, `UI Select Menu component`, `Sidebar Navigation`, `UI Dialogs and Forms`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useAuth()` (e.g. with `AppLayout()` and `ClientesPage()`) actually correct?**
  _`useAuth()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `SidebarContext` (e.g. with `Comp` and `Sidebar`) actually correct?**
  _`SidebarContext` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `SidebarContextProps` (e.g. with `Sidebar` and `SidebarContent`) actually correct?**
  _`SidebarContextProps` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `config`, `name`, `version` to the rest of the system?**
  _485 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Capacitor and Core Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.029850746268656716 - nodes in this community are weakly interconnected._