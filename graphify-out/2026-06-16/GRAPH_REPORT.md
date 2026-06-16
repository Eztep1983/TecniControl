# Graph Report - TecniControl  (2026-06-15)

## Corpus Check
- 167 files · ~376,057 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1184 nodes · 2231 edges · 95 communities (75 shown, 20 thin omitted)
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
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Module AnimatedList|Module AnimatedList]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Module logo|Module logo]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_UI Dialogs and Forms|UI Dialogs and Forms]]
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
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 67 edges
2. `useAuth()` - 56 edges
3. `SidebarContext` - 32 edges
4. `SidebarContextProps` - 25 edges
5. `Cliente` - 23 edges
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
- `ClienteFormModal` --semantically_similar_to--> `ClienteSimpleFormModal()`  [INFERRED] [semantically similar]
  src/components/clientes/ClienteFormModal.tsx → src/components/clientes/ClienteSimpleFormModal.tsx
- `OfflineSyncProvider()` --semantically_similar_to--> `FirestoreSyncProvider()`  [INFERRED] [semantically similar]
  src/components/providers/OfflineSyncProvider.tsx → src/components/providers/FirestoreSyncProvider.tsx
- `TooltipContent` --semantically_similar_to--> `TooltipContent`  [INFERRED] [semantically similar]
  src/components/ui/basic/tooltip.tsx → src/components/ui/tooltip.tsx

## Import Cycles
- None detected.

## Communities (95 total, 20 thin omitted)

### Community 0 - "Capacitor and Core Dependencies"
Cohesion: 0.03
Nodes (66): dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor-community/file-opener, @capacitor-community/speech-recognition, @capacitor/core, @capacitor/device (+58 more)

### Community 1 - "UI Component Alert Dialogs"
Cohesion: 0.07
Nodes (23): audioManager, DiagnosticoInfo, DiagnosticoInfoProps, MicButton, PermissionWarning, RecordingIndicator, restartManager, SectionHeader (+15 more)

### Community 2 - "Tasks and Spare Parts Management"
Cohesion: 0.19
Nodes (15): configDocRef(), migrarSiEsNecesario(), obtenerPiezasPredefinidas(), obtenerTareasPredefinidas(), PIEZAS_DEFAULT, piezasCol(), sembrarPiezas(), sembrarTareas() (+7 more)

### Community 3 - "Tasks and Spare Parts Management"
Cohesion: 0.13
Nodes (11): CLS_BTN_PRIMARY, CLS_BTN_SECONDARY, CLS_CARD, DEFAULT_TIPO, DeviceIcon, Highlight, LAPTOP_BRANDS, OrdenCard (+3 more)

### Community 4 - "UI Accordion and Badges Components"
Cohesion: 0.06
Nodes (38): AccordionContent, AccordionItem, AccordionTrigger, Badge(), BadgeProps, badgeVariants, Checkbox, PopoverContent (+30 more)

### Community 5 - "Business Config and Multi User"
Cohesion: 0.06
Nodes (53): Input, Comp, Sidebar, SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME, SIDEBAR_KEYBOARD_SHORTCUT, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON (+45 more)

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
Cohesion: 0.25
Nodes (8): ClienteFormModalProps, ClienteCardProps, ClienteSimpleFormModalProps, ClienteViewModalProps, ClienteModalState, ModalMode, ClienteSelectorProps, Cliente

### Community 11 - "UI Select Menu component"
Cohesion: 0.10
Nodes (18): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, DISPOSITIVO_VACIO (+10 more)

### Community 12 - "Authentication and Users Management"
Cohesion: 0.22
Nodes (10): Alert, AlertDescription, AlertTitle, alertVariants, Card, CardContent, CardDescription, CardFooter (+2 more)

### Community 13 - "Tasks and Spare Parts Management"
Cohesion: 0.15
Nodes (14): AuthGuardProps, PUBLIC_ROUTES, AuthContext, AuthContextType, logger, SECURITY_CONFIG, useAuth(), UserDocument (+6 more)

### Community 14 - "Encryption and Offline Sync Queue"
Cohesion: 0.14
Nodes (31): decryptData(), encryptData(), clearLocalIdPool(), formatIdPersonalizado(), getLocalIdPool(), IDPoolRange, obtenerSiguienteIdDePool(), saveLocalIdPool() (+23 more)

### Community 15 - "UI Dialogs and Forms"
Cohesion: 0.13
Nodes (19): Form, FormControl, FormDescription, FormField(), FormFieldContext, FormFieldContextValue, FormItem, FormItemContext (+11 more)

### Community 16 - "UI Select Menu component"
Cohesion: 0.18
Nodes (14): DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle, ClienteCard, ClientesDataTableProps (+6 more)

### Community 17 - "Sidebar Navigation"
Cohesion: 0.16
Nodes (14): AppLayout(), LayoutContent(), SidebarContent, SidebarGroup, SidebarProvider, usePrefetchData(), MobileNavigationProvider(), AppSidebar() (+6 more)

### Community 18 - "UI Dialogs and Forms"
Cohesion: 0.26
Nodes (11): AppView, getPathByView(), getRouteByPath(), RouteConfig, ROUTES, TAB_ORDER, MobileNavigationContext, MobileNavigationContextValue (+3 more)

### Community 19 - "TypeScript Compiler Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 20 - "Authentication and Users Management"
Cohesion: 0.11
Nodes (18): HTML Seed Template, Theme Tokens, P0 Must-Pass Checklist, Section Rhythm Guidance, Layout Skeletons, Tomato Web Prototype Example, Web Prototype Hard Rules, Hard rules (the seed protects most of these — don't fight it) (+10 more)

### Community 21 - "Tasks and Spare Parts Management"
Cohesion: 0.15
Nodes (14): completarOnboarding(), crearCliente(), crearOrden(), crearOrdenAtomica(), generarIdPersonalizado(), generarIdPorTipo(), getClientesPorUsuario(), getEstadisticasPorUsuario() (+6 more)

### Community 22 - "Capacitor and Core Dependencies"
Cohesion: 0.20
Nodes (8): useOrdenesBusqueda(), useOrdenesInfinitas(), buildSearchableText(), formatFechaPure(), getTipoLabel(), Highlight, OrdenesMantenimientoPage(), safeLocalStorage

### Community 23 - "Navigation and Keyboard Hooks"
Cohesion: 0.10
Nodes (20): Contador, ContadorInput, ContadorInputProps, TIPOS_CONTADOR, Garantia Info, Garantia Input, useCrearOrden(), usePersistentReducer() (+12 more)

### Community 24 - "Module components"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 25 - "Module menubar"
Cohesion: 0.16
Nodes (13): modalOrdenImport(), ActionBtn, Card, Chip, DataRow, DetailView, isCapacitor(), isNativePlatform() (+5 more)

### Community 27 - "UI Select Menu component"
Cohesion: 0.15
Nodes (13): ClienteHistorialModalProps, HistorialContent, HistorialContentProps, ModalOrdenLazy, OrdenItem, VirtualRow, useOrdenesCliente(), Contador (+5 more)

### Community 28 - "Module OrdenCard"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 29 - "Sidebar Navigation"
Cohesion: 0.19
Nodes (13): Pieza, PiezasInputProps, SelectorCantidad, TareasInput, TareasInputProps, useTareasYPiezas(), Drawer(), DrawerContent (+5 more)

### Community 30 - "Business Config and Multi User"
Cohesion: 0.20
Nodes (12): OrdenCardProps, DownloadButtonProps, escapeHTML(), generarContenidoHTML(), isCapacitor(), isNativePlatform(), PrintButton(), PrintButtonProps (+4 more)

### Community 31 - "UI Dialogs and Forms"
Cohesion: 0.17
Nodes (14): UserProfile(), Avatar, AvatarFallback, AvatarImage, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel (+6 more)

### Community 32 - "Capacitor and Core Dependencies"
Cohesion: 0.18
Nodes (11): useCompletarOnboarding(), useOrdenesRecientes(), BusinessAvatar, DraftBanner, EmptyOrdenes, OrdenesDashboardContent(), StatCard, TIPO_COLORS (+3 more)

### Community 33 - "Capacitor and Core Dependencies"
Cohesion: 0.20
Nodes (9): UserData, useUserData(), getUser(), verifyRole(), auth, db, firebaseConfig, storage (+1 more)

### Community 34 - "Client Management Modals"
Cohesion: 0.13
Nodes (14): 1. FICHA TÉCNICA DEL PROYECTO, 2. DIAGNÓSTICO RÁPIDO, 3. ANÁLISIS TÉCNICO — LO QUE EL CÓDIGO REVELA, 4. EXPERIENCIA DE USO — DESDE EL CÓDIGO, 5. FIT CON EL MERCADO COLOMBIANO — LECTURA TÉCNICA, 6. NO NEGOCIABLES — LO QUE BLOQUEA EL LANZAMIENTO, 7. QUÉ QUITAR — SCOPE CREEP DETECTADO EN EL CÓDIGO, 8. RESUMEN DE ÁREAS DE MEJORA PRIORITARIAS (+6 more)

### Community 35 - "UI Dialogs and Forms"
Cohesion: 0.31
Nodes (8): ClienteFormModal, ClientesDataTable, ClientesList(), ClientesSkeleton, useClienteModal(), usePullToRefresh(), UsePullToRefreshOptions, useClientesUsuario()

### Community 36 - "Capacitor and Core Dependencies"
Cohesion: 0.38
Nodes (5): Button, ButtonProps, buttonVariants, Calendar(), CalendarProps

### Community 37 - "Module WelcomeScreen"
Cohesion: 0.15
Nodes (12): Class inventory (must exist in `template.html`), Layout 1 — Hero, centered, Layout 2 — Hero, split (text + visual), Layout 3 — Feature triplet, Layout 4 — Stat row (data billboard), Layout 5 — Pull quote (testimonial), Layout 6 — CTA strip (closing), Layout 7 — Log list (changelog / blog index / posts) (+4 more)

### Community 38 - "Business Config and Multi User"
Cohesion: 0.29
Nodes (9): DispositivoFormModal(), DispositivoFormModalProps, DispositivoRow, DispositivoRowProps, DispositivoSelector(), DispositivoSelectorProps, getEstadoStyle(), getIconoDispositivo() (+1 more)

### Community 39 - "UI Select Menu component"
Cohesion: 0.27
Nodes (9): FirmaInput(), FirmaInputProps, ResumenMantenimiento(), ResumenMantenimientoProps, SignatureState, useSignatureCanvas(), deobfuscateSignature(), obfuscateSignature() (+1 more)

### Community 40 - "Module table"
Cohesion: 0.30
Nodes (14): cleanBoolean(), cleanDate(), cleanNumber(), cleanString(), cleanStringArray(), parseDateLike(), sanitizeClientePayload(), sanitizeDispositivo() (+6 more)

### Community 42 - "Community 42"
Cohesion: 0.14
Nodes (5): PiezaItem, TareaItem, TareasRepuestosPage(), ToastData, useDebounce()

### Community 43 - "Module AnimatedList"
Cohesion: 0.18
Nodes (10): name, private, scripts, build, dev, lint, start, test (+2 more)

### Community 44 - "Community 44"
Cohesion: 0.20
Nodes (9): Tabs, TabsContent, TabsList, TabsTrigger, NegocioHeaderProps, NegocioConUsuario, PageStatus, PageStatusType (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.27
Nodes (8): useNetworkStatus(), useOfflineOrderQueue(), useOfflineQueue(), queryKeys, TareaPredefinida, useOfflineSync(), NetworkStatusBanner(), OfflineSyncBanner()

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (9): ClienteHistorialModal(), ClienteSimpleFormModal(), ClienteViewModal(), useSwipeToClose(), UseSwipeToCloseOptions, ClienteRow, ClienteRowProps, ClienteSelector (+1 more)

### Community 47 - "Module logo"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 48 - "Community 48"
Cohesion: 0.21
Nodes (10): ModalPieza(), colorStyles, FORM_TAREA_VACIO, FormTarea, FormularioTarea, ModalTarea(), ModalTareaProps, Modal() (+2 more)

### Community 49 - "UI Dialogs and Forms"
Cohesion: 0.23
Nodes (7): useIsMobile(), Button, ButtonProps, buttonVariants, Input, sidebarMenuButtonVariants, TooltipContent

### Community 50 - "Community 50"
Cohesion: 0.23
Nodes (9): inter, metadata, RootLayout(), AuthGuard(), AuthProvider(), LoginPage(), Capacitor Error Interception, CapacitorProvider() (+1 more)

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

### Community 64 - "Community 64"
Cohesion: 0.29
Nodes (8): useKeyboardVisible(), useEstadisticasUsuario(), useScrollAware(), LEFT_ITEMS, MobileNav(), NavButton(), NavButtonProps, RIGHT_ITEMS

### Community 65 - "Community 65"
Cohesion: 0.18
Nodes (6): DashboardGreeting, DAY_NAMES, GREETINGS, MONTH_NAMES, Negocio, User

### Community 69 - "Community 69"
Cohesion: 0.20
Nodes (10): devDependencies, @capacitor/assets, postcss, tailwindcss, @types/crypto-js, @types/node, @types/react, @types/react-dom (+2 more)

### Community 71 - "Community 71"
Cohesion: 0.22
Nodes (9): 3.1 🟠 Pull-to-refresh sin `touch-action: pan-y` explícito, 3.2 🟠 Paginación sticky en mobile oculta contenido sin compensación adecuada, 3.3 🟠 Tap targets en `ClienteCard` — el área del botón de eliminar es 44×44 en desktop pero 40×40 en mobile, 3.4 🟠 Dos inputs de búsqueda idénticos en el DOM — duplicación de estado, 3.5 🟡 Scroll to sentinel al cambiar página — UX anti-patrón en mobile, 3.6 🟡 `CountUp` anima cada vez que cambia el filtro de búsqueda, 3.7 🟡 Falta feedback táctil en la paginación numérica desktop, 3.8 🟡 La card completa dispara `onClick` pero también contiene botones hijos (+1 more)

### Community 75 - "Community 75"
Cohesion: 0.19
Nodes (5): SpeechContext, SpeechContextType, SpeechProvider(), PageTransition(), TAB_ORDER

### Community 76 - "Community 76"
Cohesion: 0.25
Nodes (7): 5.1 🟠 `useMediaQuery` llamado dos veces por separado, 5.2 🟡 `useMemo` de `filteredClientes` crea un array nuevo en cada render, 5.3 🟡 La barra de progreso recalcula un porcentaje en cada render, 5. Rendimiento de renderizado, Auditoría UI/UX — `ClientesList` + `ClientesDataTable`, Resumen ejecutivo, Índice

### Community 86 - "Community 86"
Cohesion: 0.36
Nodes (6): GlobalFormularioMantenimiento, ManagedView, MobileAppShell(), useSlideAnimation(), VIEW_COMPONENTS, useMobileNavigation()

### Community 87 - "Community 87"
Cohesion: 0.29
Nodes (7): 6.1 🟠 Estado vacío duplicado entre `ClientesList` y `ClientesDataTable`, 6.2 🟠 El botón de error solo permite `window.location.reload()`, 6.3 🟡 El texto del botón principal cambia sin consistencia entre estados, 6.4 🟡 La barra de progreso de paginación es un anti-patrón UX, 6.5 🟡 `setTimeout(() => setSelectedClienteHistorial(null), 300)` — número mágico, 6.6 🟡 El texto "Sin resultados" en `isFiltered` muestra el `searchTerm` sin sanitizar, 6. UX — Flujos y microcopy

### Community 88 - "Community 88"
Cohesion: 0.33
Nodes (6): PiezaPredefinida, colorStyles, FORM_PIEZA_VACIO, FormPieza, FormularioPieza, ModalPiezaProps

### Community 89 - "Community 89"
Cohesion: 0.33
Nodes (6): 1.1 🔴 Clase Tailwind inválida `w-4.5 h-4.5` — `ClientesList`, 1.2 🔴 Breakpoint `xs:` no estándar en Tailwind — `ClientesList`, 1.3 🔴 Dialog de eliminación — limpieza de estado incompleta — `ClientesDataTable`, 1.4 🔴 `setIsDeleting(false)` en `finally` cierra el diálogo antes de manejar el error — `ClientesDataTable`, 1.5 🔴 `role="button"` sin `onKeyDown` — doble ocurrencia, 1. Bugs críticos (P0)

### Community 90 - "Community 90"
Cohesion: 0.33
Nodes (6): 2.1 🟠 Focus trap ausente en el Dialog de eliminación, 2.2 🟠 `aria-live="polite"` en el header compite con el mismo en `ClientesDataTable`, 2.3 🟡 `role="list"` + `role="listitem"` correctos pero el wrapping div rompe semántica, 2.4 🟡 Botones de acción en `ClienteCard` sin texto visible en desktop, 2.5 🟡 Falta `aria-label` descriptivo en paginación de escritorio, 2. Accesibilidad — Teclado y Screen Readers

### Community 91 - "Community 91"
Cohesion: 0.33
Nodes (6): 4.1 🟠 Firebase `deleteDoc` directamente en el componente de UI, 4.2 🟠 `itemsPerPage` como `useState` que nunca cambia, 4.3 🟡 Callbacks estables redundantes en `ClientesDataTable`, 4.4 🟡 `totalPages` calculado dos veces sin compartir, 4.5 🟡 `exitingIds` puede persistir si el componente se desmonta durante la animación, 4. Arquitectura de estado y acoplamiento

### Community 92 - "Community 92"
Cohesion: 0.40
Nodes (5): 8. Plan de refactorización priorizado, Sprint 1 — Bugs que quiebran funcionalidad (hacer primero), Sprint 2 — Mobile y accesibilidad crítica, Sprint 3 — Arquitectura y rendimiento, Sprint 4 — UX y diseño

### Community 93 - "Community 93"
Cohesion: 0.50
Nodes (4): 7.1 🟡 `rounded-2xl` vs `rounded-xl` vs `rounded-lg` mezclados sin sistema, 7.2 🟡 El icono de avatar de cliente siempre es el mismo `<User />`, 7.3 🟢 El header en `ClientesList` usa `<header>` pero el main usa `<main>` dentro de un `div` — jerarquía semántica confusa, 7. Diseño visual — Consistencia

## Knowledge Gaps
- **527 isolated node(s):** `Índice`, `1.1 🔴 Clase Tailwind inválida `w-4.5 h-4.5` — `ClientesList``, `1.2 🔴 Breakpoint `xs:` no estándar en Tailwind — `ClientesList``, `1.3 🔴 Dialog de eliminación — limpieza de estado incompleta — `ClientesDataTable``, `1.4 🔴 `setIsDeleting(false)` en `finally` cierra el diálogo antes de manejar el error — `ClientesDataTable`` (+522 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Tasks and Spare Parts Management` to `Tasks and Spare Parts Management`, `UI Select Menu component`, `Authentication and Users Management`, `Encryption and Offline Sync Queue`, `UI Dialogs and Forms`, `Sidebar Navigation`, `Tasks and Spare Parts Management`, `Capacitor and Core Dependencies`, `Navigation and Keyboard Hooks`, `UI Select Menu component`, `Sidebar Navigation`, `UI Dialogs and Forms`, `Capacitor and Core Dependencies`, `Capacitor and Core Dependencies`, `UI Dialogs and Forms`, `Business Config and Multi User`, `Community 42`, `Community 44`, `Community 45`, `Community 46`, `Community 50`, `Community 56`, `Community 64`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `cn()` connect `UI Accordion and Badges Components` to `Tasks and Spare Parts Management`, `Business Config and Multi User`, `Navigation and Keyboard Hooks`, `Tasks and Spare Parts Management`, `UI Select Menu component`, `Authentication and Users Management`, `UI Dialogs and Forms`, `UI Select Menu component`, `Module menubar`, `UI Select Menu component`, `Module OrdenCard`, `Sidebar Navigation`, `UI Dialogs and Forms`, `Capacitor and Core Dependencies`, `Capacitor and Core Dependencies`, `Community 44`, `Module logo`, `UI Dialogs and Forms`, `Community 64`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `SidebarContext` connect `Business Config and Multi User` to `Sidebar Navigation`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useAuth()` (e.g. with `AppLayout()` and `ClientesPage()`) actually correct?**
  _`useAuth()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `SidebarContext` (e.g. with `Comp` and `Sidebar`) actually correct?**
  _`SidebarContext` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `SidebarContextProps` (e.g. with `Sidebar` and `SidebarContent`) actually correct?**
  _`SidebarContextProps` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Índice`, `1.1 🔴 Clase Tailwind inválida `w-4.5 h-4.5` — `ClientesList``, `1.2 🔴 Breakpoint `xs:` no estándar en Tailwind — `ClientesList`` to the rest of the system?**
  _531 weakly-connected nodes found - possible documentation gaps or missing edges._