# Graph Report - .  (2026-06-12)

## Corpus Check
- 164 files · ~252,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1055 nodes · 2054 edges · 72 communities (50 shown, 22 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 131 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Capacitor & App Dependencies|Capacitor & App Dependencies]]
- [[_COMMUNITY_Offline Sync & Firestore Storage|Offline Sync & Firestore Storage]]
- [[_COMMUNITY_Sidebar UI Component|Sidebar UI Component]]
- [[_COMMUNITY_Alert & Alert-Dialog UI|Alert & Alert-Dialog UI]]
- [[_COMMUNITY_App Layout & Voice Speech Provider|App Layout & Voice Speech Provider]]
- [[_COMMUNITY_Business Logic & Firestore Sanitizers|Business Logic & Firestore Sanitizers]]
- [[_COMMUNITY_Base UI Elements|Base UI Elements]]
- [[_COMMUNITY_User Onboarding Flow|User Onboarding Flow]]
- [[_COMMUNITY_Open Design & Skill Config|Open Design & Skill Config]]
- [[_COMMUNITY_Diagnostics UI & Voice Input|Diagnostics UI & Voice Input]]
- [[_COMMUNITY_Parts & Tasks Modals|Parts & Tasks Modals]]
- [[_COMMUNITY_Client History Modal & Sheet UI|Client History Modal & Sheet UI]]
- [[_COMMUNITY_Toast Notifications UI|Toast Notifications UI]]
- [[_COMMUNITY_Dialog & Form Layouts|Dialog & Form Layouts]]
- [[_COMMUNITY_Client Form & Select UI Components|Client Form & Select UI Components]]
- [[_COMMUNITY_input.tsx & Input|input.tsx & Input]]
- [[_COMMUNITY_tsconfig.json & compilerOptions|tsconfig.json & compilerOptions]]
- [[_COMMUNITY_button.tsx & Button|button.tsx & Button]]
- [[_COMMUNITY_UserProfile.tsx & UserProfile()|UserProfile.tsx & UserProfile()]]
- [[_COMMUNITY_useOrdenesCliente.ts & useOrdenesCliente()|useOrdenesCliente.ts & useOrdenesCliente()]]
- [[_COMMUNITY_components.json & aliases|components.json & aliases]]
- [[_COMMUNITY_menubar.tsx & Menubar|menubar.tsx & Menubar]]
- [[_COMMUNITY_ClientesDataTable.tsx & ClienteCard|ClientesDataTable.tsx & ClienteCard]]
- [[_COMMUNITY_useKeyboardVisible.ts & useKeyboardVisible()|useKeyboardVisible.ts & useKeyboardVisible()]]
- [[_COMMUNITY_SheetTrigger & useOrdenesBusqueda()|SheetTrigger & useOrdenesBusqueda()]]
- [[_COMMUNITY_App Layout & Layout Content|App Layout & Layout Content]]
- [[_COMMUNITY_ClienteFormModalProps & ClienteCardProps|ClienteFormModalProps & ClienteCardProps]]
- [[_COMMUNITY_OrdenCard.tsx & CLS_BTN_PRIMARY|OrdenCard.tsx & CLS_BTN_PRIMARY]]
- [[_COMMUNITY_sheet.tsx & SheetContent|sheet.tsx & SheetContent]]
- [[_COMMUNITY_ClienteFormModal & ClientesDataTable|ClienteFormModal & ClientesDataTable]]
- [[_COMMUNITY_modalOrdenImport() & ModalOrden.tsx|modalOrdenImport() & ModalOrden.tsx]]
- [[_COMMUNITY_OrdenCardProps & PrintService.tsx|OrdenCardProps & PrintService.tsx]]
- [[_COMMUNITY_inter & metadata|inter & metadata]]
- [[_COMMUNITY_ContadorInput.tsx & Contador|ContadorInput.tsx & Contador]]
- [[_COMMUNITY_PiezasInput.tsx & Pieza|PiezasInput.tsx & Pieza]]
- [[_COMMUNITY_package.json & name|package.json & name]]
- [[_COMMUNITY_table.tsx & Table|table.tsx & Table]]
- [[_COMMUNITY_devDependencies & @capacitorassets|devDependencies & @capacitor/assets]]
- [[_COMMUNITY_HTML Seed Template & Theme Tokens|HTML Seed Template & Theme Tokens]]
- [[_COMMUNITY_AuthProvider.tsx & AuthContext|AuthProvider.tsx & AuthContext]]
- [[_COMMUNITY_ClienteSimpleFormModal() & ClienteSelector.tsx|ClienteSimpleFormModal() & ClienteSelector.tsx]]
- [[_COMMUNITY_FirmaInput.tsx & FirmaInput()|FirmaInput.tsx & FirmaInput()]]
- [[_COMMUNITY_AnimatedList.tsx & AnimatedItem()|AnimatedList.tsx & AnimatedItem()]]
- [[_COMMUNITY_page.tsx & PoliticaPrivacidad()|page.tsx & PoliticaPrivacidad()]]
- [[_COMMUNITY_react-window.d.ts & FixedSizeList|react-window.d.ts & FixedSizeList]]
- [[_COMMUNITY_TecniControl Brand Mark & Órdenes de Servicio Concept|TecniControl Brand Mark & Órdenes de Servicio Concept]]
- [[_COMMUNITY_Section.tsx & Section()|Section.tsx & Section()]]
- [[_COMMUNITY_FormActions.tsx & FormActions()|FormActions.tsx & FormActions()]]
- [[_COMMUNITY_Checklist and Compliance Concept & TecniControl Brand Logo|Checklist and Compliance Concept & TecniControl Brand Logo]]
- [[_COMMUNITY_Gestión de Órdenes de Servicio Técnico & TecniControl Logo and Splash Screen|Gestión de Órdenes de Servicio Técnico & TecniControl Logo and Splash Screen]]
- [[_COMMUNITY_SheetClose & SheetClose|SheetClose & SheetClose]]
- [[_COMMUNITY_SheetPortal & SheetPortal|SheetPortal & SheetPortal]]
- [[_COMMUNITY_capacitor.config.ts & config|capacitor.config.ts & config]]
- [[_COMMUNITY_next.config.ts & nextConfig|next.config.ts & nextConfig]]
- [[_COMMUNITY_postcss.config.mjs & config|postcss.config.mjs & config]]
- [[_COMMUNITY_TecniControl Brand Identity & TecniControl Logo Image|TecniControl Brand Identity & TecniControl Logo Image]]
- [[_COMMUNITY_Dashboard Redirect Page Module|Dashboard Redirect Page Module]]
- [[_COMMUNITY_TecniControl Stylized TC Logo Module|TecniControl Stylized TC Logo Module]]
- [[_COMMUNITY_Accordion Module|Accordion Module]]
- [[_COMMUNITY_Collapsible Module|Collapsible Module]]
- [[_COMMUNITY_Popover Module|Popover Module]]
- [[_COMMUNITY_SelectGroup Module|SelectGroup Module]]
- [[_COMMUNITY_CTO Product Audit Guide Module|CTO Product Audit Guide Module]]
- [[_COMMUNITY_TecniControl README Module|TecniControl README Module]]
- [[_COMMUNITY_Anti-Slop Spot Check Module|Anti-Slop Spot Check Module]]
- [[_COMMUNITY_Rules and Guidelines Module|Rules and Guidelines Module]]
- [[_COMMUNITY_DrawerPortal Module|DrawerPortal Module]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 67 edges
2. `useAuth()` - 60 edges
3. `SidebarContext` - 32 edges
4. `SidebarContextProps` - 32 edges
5. `Cliente` - 23 edges
6. `OrdenMantenimiento` - 17 edges
7. `OfflineSyncProvider()` - 16 edges
8. `sanitizeOrdenPayload()` - 16 edges
9. `compilerOptions` - 16 edges
10. `db` - 15 edges

## Surprising Connections (you probably didn't know these)
- `AppLayout()` --calls--> `useAuth()`  [INFERRED]
  src/app/(app)/layout.tsx → src/components/auth/AuthProvider.tsx
- `ClienteFormModal` --semantically_similar_to--> `ClienteSimpleFormModal()`  [INFERRED] [semantically similar]
  src/components/clientes/ClienteFormModal.tsx → src/components/clientes/ClienteSimpleFormModal.tsx
- `ClienteSelector` --semantically_similar_to--> `DispositivoSelector()`  [INFERRED] [semantically similar]
  src/components/forms/ClienteSelector.tsx → src/components/forms/DispositivoSelector.tsx
- `OfflineSyncProvider()` --semantically_similar_to--> `FirestoreSyncProvider()`  [INFERRED] [semantically similar]
  src/components/providers/OfflineSyncProvider.tsx → src/components/providers/FirestoreSyncProvider.tsx
- `Separator` --semantically_similar_to--> `Separator`  [INFERRED] [semantically similar]
  src/components/ui/basic/separator.tsx → src/components/ui/separator.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Authentication and Security Flow** — login_page_loginpage, auth_authguard_authguard, auth_authprovider_authprovider, auth_authprovider_useauth [INFERRED 0.85]
- **Ordenes Management Flow** — ordenes_page_ordenesdashboardpage, mantenimiento_page_ordenesmantenimientopage, mantenimiento_formulario_formulariomantenimiento [INFERRED 0.85]
- **User Onboarding Flow** — onboarding_onboardingsuccess_onboardingsuccess, onboarding_welcomescreen_welcomescreen [INFERRED 0.85]
- **UI Animation Component Library** — ui_animatedcontent_animatedcontent, ui_animatedlist_animatedlist, ui_countup_countup [INFERRED 0.85]
- **App State & Sync Architecture** — providers_capacitorprovider_capacitorprovider, providers_firestoresyncprovider_firestoresyncprovider, providers_offlinesyncprovider_offlinesyncprovider, providers_mobilenavigationcontext_mobilenavigationprovider, providers_queryprovider_queryprovider [INFERRED 0.95]
- **UI Form Control Components** — basic_form_form, basic_input_input, basic_checkbox_checkbox, basic_radio_group_radiogroup, basic_label_label [INFERRED 0.85]
- **Sidebar Layout Pattern (basic)** — basic_sidebar_sidebarinput, basic_sidebar_sidebarmenusubbutton, basic_sidebar_sidebar_cookie_name, basic_sidebar_sidebarrail, basic_sidebar_sidebar_cookie_max_age, basic_sidebar_sidebargrouplabel, basic_sidebar_sidebarmenu, basic_sidebar_sidebarprovider, basic_sidebar_sidebar, basic_sidebar_sidebartrigger, basic_sidebar_sidebarmenuitem, basic_sidebar_sidebargroupcontent, basic_sidebar_sidebarmenuskeleton, basic_sidebar_sidebarmenusubitem, basic_sidebar_sidebarfooter [EXTRACTED 0.95]
- **Sidebar Layout Pattern (ui)** — ui_sidebar_sidebarinput, ui_sidebar_sidebarmenusubbutton, ui_sidebar_sidebar_cookie_name, ui_sidebar_sidebarrail, ui_sidebar_sidebar_cookie_max_age, ui_sidebar_sidebargrouplabel, ui_sidebar_sidebarmenu, ui_sidebar_sidebarcontextprops, ui_sidebar_sidebarprovider, ui_sidebar_sidebar, ui_sidebar_sidebartrigger, ui_sidebar_sidebarmenuitem, ui_sidebar_sidebargroupcontent, ui_sidebar_sidebarmenuskeleton, ui_sidebar_sidebarmenusubitem [EXTRACTED 0.95]
- **Toast Notification Flow (basic)** — basic_toast_toastprovider, basic_toast_toastviewport, basic_toast_toasttitle, basic_toast_toast, basic_toast_toastclose, basic_toast_toastprops, basic_toast_toastactionelement, basic_toast_toastdescription, basic_toast_toastaction [EXTRACTED 0.95]
- **Multi-User Firestore Data Hooks** — hooks_usemultiuser_useclientesusuario, hooks_usemultiuser_useordenesusuario, hooks_usemultiuser_usecrearorden, hooks_usemultiuser_usenegociousuario, hooks_usemultiuser_useestadisticasusuario, hooks_usemultiuser_useprefetchdata, hooks_usemultiuser_useordenesrecientes, hooks_usemultiuser_useordenesinfinitas, hooks_usemultiuser_useordenesbusqueda, hooks_usemultiuser_usecompletaronboarding [EXTRACTED 1.00]
- **Web Prototype Tooling and Specs** — web_prototype_skill_web_prototype, assets_template_seed, references_layouts_skeletons, references_checklist_p0_rules [EXTRACTED 1.00]

## Communities (72 total, 22 thin omitted)

### Community 0 - "Capacitor & App Dependencies"
Cohesion: 0.03
Nodes (65): dependencies, @capacitor/android, @capacitor/app, @capacitor/cli, @capacitor-community/file-opener, @capacitor-community/speech-recognition, @capacitor/core, @capacitor/device (+57 more)

### Community 1 - "Offline Sync & Firestore Storage"
Cohesion: 0.07
Nodes (51): useNetworkStatus(), useOfflineOrderQueue(), useOfflineQueue(), useTareasYPiezas, actualizarPieza(), actualizarTarea(), configDocRef(), crearPieza() (+43 more)

### Community 2 - "Sidebar UI Component"
Cohesion: 0.05
Nodes (58): Comp, Sidebar, SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME, SIDEBAR_KEYBOARD_SHORTCUT, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON, SIDEBAR_WIDTH_MOBILE (+50 more)

### Community 3 - "Alert & Alert-Dialog UI"
Cohesion: 0.07
Nodes (36): Alert, AlertDescription, AlertTitle, alertVariants, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription (+28 more)

### Community 4 - "App Layout & Voice Speech Provider"
Cohesion: 0.07
Nodes (35): AppLayout(), LayoutContent(), SpeechContext, SpeechContextType, SpeechProvider(), usePrefetchData(), useScrollAware(), AppView (+27 more)

### Community 5 - "Business Logic & Firestore Sanitizers"
Cohesion: 0.10
Nodes (31): NegocioHeaderProps, NegocioConUsuario, useOrdenesUsuario(), cleanBoolean(), cleanDate(), cleanNumber(), cleanString(), cleanStringArray() (+23 more)

### Community 6 - "Base UI Elements"
Cohesion: 0.08
Nodes (24): AccordionContent, AccordionItem, AccordionTrigger, Badge(), BadgeProps, badgeVariants, Button, ButtonProps (+16 more)

### Community 7 - "User Onboarding Flow"
Cohesion: 0.07
Nodes (24): useCompletarOnboarding(), useEstadisticasUsuario(), useOrdenesRecientes(), OnboardingSuccess(), OnboardingSuccessProps, WelcomeScreen(), WelcomeScreenProps, BusinessAvatar (+16 more)

### Community 8 - "Open Design & Skill Config"
Cohesion: 0.05
Nodes (38): author, name, url, compat, agentSkills, assets, designSystem, skills (+30 more)

### Community 9 - "Diagnostics UI & Voice Input"
Cohesion: 0.07
Nodes (26): audioManager, DiagnosticoInfo, DiagnosticoInfoProps, MicButton, PermissionWarning, RecordingIndicator, restartManager, SectionHeader (+18 more)

### Community 10 - "Parts & Tasks Modals"
Cohesion: 0.09
Nodes (20): PiezaPredefinida, colorStyles, FORM_PIEZA_VACIO, FormPieza, FormularioPieza, ModalPieza(), ModalPiezaProps, colorStyles (+12 more)

### Community 11 - "Client History Modal & Sheet UI"
Cohesion: 0.11
Nodes (24): DialogDescription, DialogHeader(), Sheet, SheetDescription, SheetTitle, ClienteHistorialModal(), ClienteHistorialModalProps, DialogHeaderContent (+16 more)

### Community 12 - "Toast Notifications UI"
Cohesion: 0.13
Nodes (25): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastProvider, ToastTitle (+17 more)

### Community 13 - "Dialog & Form Layouts"
Cohesion: 0.12
Nodes (22): AlertDialog, Dialog, DialogContent, DialogFooter(), DialogOverlay, DialogTitle, Form, FormControl (+14 more)

### Community 14 - "Client Form & Select UI Components"
Cohesion: 0.09
Nodes (22): Select, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger (+14 more)

### Community 15 - "input.tsx & Input"
Cohesion: 0.10
Nodes (17): Input, Separator, SidebarMenuButton, sidebarMenuButtonVariants, SidebarProvider, SidebarRail, Tooltip, TooltipContent (+9 more)

### Community 16 - "tsconfig.json & compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 17 - "button.tsx & Button"
Cohesion: 0.15
Nodes (14): Button, ButtonProps, buttonVariants, Drawer(), DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader() (+6 more)

### Community 18 - "UserProfile.tsx & UserProfile()"
Cohesion: 0.16
Nodes (15): UserProfile(), Avatar, AvatarFallback, AvatarImage, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem (+7 more)

### Community 19 - "useOrdenesCliente.ts & useOrdenesCliente()"
Cohesion: 0.16
Nodes (11): useOrdenesCliente(), UserData, useUserData(), getUser(), verifyRole(), auth, db, firebaseConfig (+3 more)

### Community 20 - "components.json & aliases"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 21 - "menubar.tsx & Menubar"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 22 - "ClientesDataTable.tsx & ClienteCard"
Cohesion: 0.14
Nodes (8): ClienteCard, ClientesDataTableProps, Pagination, PaginationProps, haptic, useHapticFeedback(), CountUp(), CountUpProps

### Community 23 - "useKeyboardVisible.ts & useKeyboardVisible()"
Cohesion: 0.16
Nodes (13): useKeyboardVisible(), useCrearOrden(), usePersistentReducer(), FormAction, FormStep, FormularioMantenimiento(), FormularioMantenimientoProps, initialState (+5 more)

### Community 24 - "SheetTrigger & useOrdenesBusqueda()"
Cohesion: 0.17
Nodes (10): SheetTrigger, useOrdenesBusqueda(), useOrdenesInfinitas(), buildSearchableText(), formatFechaPure(), getTipoLabel(), Highlight, OrdenesMantenimientoPage() (+2 more)

### Community 25 - "App Layout & Layout Content"
Cohesion: 0.22
Nodes (12): App Layout, Layout Content, AuthGuard(), AuthGuardProps, PUBLIC_ROUTES, useAuth(), ClientesPage(), useAppLifecycle() (+4 more)

### Community 26 - "ClienteFormModalProps & ClienteCardProps"
Cohesion: 0.19
Nodes (14): ClienteFormModalProps, ClienteCardProps, ClienteSimpleFormModalProps, ClienteViewModalProps, DispositivoFormModal(), DispositivoFormModalProps, DispositivoRow, DispositivoRowProps (+6 more)

### Community 27 - "OrdenCard.tsx & CLS_BTN_PRIMARY"
Cohesion: 0.13
Nodes (11): CLS_BTN_PRIMARY, CLS_BTN_SECONDARY, CLS_CARD, DEFAULT_TIPO, DeviceIcon, Highlight, LAPTOP_BRANDS, OrdenCard (+3 more)

### Community 28 - "sheet.tsx & SheetContent"
Cohesion: 0.19
Nodes (12): SheetContent, SheetContentProps, SheetFooter(), SheetHeader(), SheetOverlay, sheetVariants, SheetContent, SheetContentProps (+4 more)

### Community 29 - "ClienteFormModal & ClientesDataTable"
Cohesion: 0.23
Nodes (10): ClienteFormModal, ClientesDataTable, ClientesList(), ClientesSkeleton, ClienteModalState, ModalMode, useClienteModal(), usePullToRefresh() (+2 more)

### Community 30 - "modalOrdenImport() & ModalOrden.tsx"
Cohesion: 0.15
Nodes (12): modalOrdenImport(), ActionBtn, Card, Chip, DataRow, DetailView, isCapacitor(), isNativePlatform() (+4 more)

### Community 31 - "OrdenCardProps & PrintService.tsx"
Cohesion: 0.20
Nodes (12): OrdenCardProps, DownloadButtonProps, escapeHTML(), generarContenidoHTML(), isCapacitor(), isNativePlatform(), PrintButton(), PrintButtonProps (+4 more)

### Community 32 - "inter & metadata"
Cohesion: 0.25
Nodes (7): inter, metadata, RootLayout(), AuthProvider(), CapacitorProvider(), FirestoreSyncProvider(), QueryProvider()

### Community 33 - "ContadorInput.tsx & Contador"
Cohesion: 0.22
Nodes (9): Contador, ContadorInput, ContadorInputProps, TIPOS_CONTADOR, ResumenMantenimiento(), ResumenMantenimientoProps, deobfuscateSignature(), FormState (+1 more)

### Community 34 - "PiezasInput.tsx & Pieza"
Cohesion: 0.25
Nodes (8): Pieza, PiezasInputProps, SelectorCantidad, TareasInput(), TareasInputProps, queryKeys, useTareasYPiezas(), TareaPredefinida

### Community 35 - "package.json & name"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, start, typecheck (+1 more)

### Community 36 - "table.tsx & Table"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 37 - "devDependencies & @capacitor/assets"
Cohesion: 0.22
Nodes (9): devDependencies, @capacitor/assets, postcss, tailwindcss, @types/crypto-js, @types/node, @types/react, @types/react-dom (+1 more)

### Community 38 - "HTML Seed Template & Theme Tokens"
Cohesion: 0.25
Nodes (8): HTML Seed Template, Theme Tokens, P0 Must-Pass Checklist, Section Rhythm Guidance, Layout Skeletons, Tomato Web Prototype Example, Web Prototype Hard Rules, Web Prototype Skill

### Community 39 - "AuthProvider.tsx & AuthContext"
Cohesion: 0.25
Nodes (5): AuthContext, AuthContextType, logger, SECURITY_CONFIG, UserDocument

### Community 40 - "ClienteSimpleFormModal() & ClienteSelector.tsx"
Cohesion: 0.29
Nodes (5): ClienteSimpleFormModal(), ClienteRow, ClienteRowProps, ClienteSelector, ClienteSelectorProps

### Community 41 - "FirmaInput.tsx & FirmaInput()"
Cohesion: 0.43
Nodes (5): FirmaInput(), FirmaInputProps, SignatureState, useSignatureCanvas(), obfuscateSignature()

### Community 44 - "react-window.d.ts & FixedSizeList"
Cohesion: 0.50
Nodes (3): FixedSizeList, FixedSizeListProps, ListChildComponentProps

### Community 45 - "TecniControl Brand Mark & Órdenes de Servicio Concept"
Cohesion: 0.67
Nodes (3): TecniControl Brand Mark, Órdenes de Servicio Concept, Servicio Técnico Concept

### Community 48 - "Checklist and Compliance Concept & TecniControl Brand Logo"
Cohesion: 0.67
Nodes (3): Checklist and Compliance Concept, TecniControl Brand Logo, TecniControl Brand Identity

## Knowledge Gaps
- **415 isolated node(s):** `config`, `$schema`, `style`, `rsc`, `tsx` (+410 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Base UI Elements` to `ContadorInput.tsx & Contador`, `Alert & Alert-Dialog UI`, `table.tsx & Table`, `App Layout & Voice Speech Provider`, `User Onboarding Flow`, `Client History Modal & Sheet UI`, `Toast Notifications UI`, `Dialog & Form Layouts`, `Client Form & Select UI Components`, `input.tsx & Input`, `button.tsx & Button`, `UserProfile.tsx & UserProfile()`, `menubar.tsx & Menubar`, `ClientesDataTable.tsx & ClienteCard`, `OrdenCard.tsx & CLS_BTN_PRIMARY`, `sheet.tsx & SheetContent`, `modalOrdenImport() & ModalOrden.tsx`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `App Layout & Layout Content` to `inter & metadata`, `Offline Sync & Firestore Storage`, `PiezasInput.tsx & Pieza`, `Alert & Alert-Dialog UI`, `App Layout & Voice Speech Provider`, `Business Logic & Firestore Sanitizers`, `AuthProvider.tsx & AuthContext`, `ClienteSimpleFormModal() & ClienteSelector.tsx`, `User Onboarding Flow`, `Parts & Tasks Modals`, `Dialog & Form Layouts`, `Client Form & Select UI Components`, `UserProfile.tsx & UserProfile()`, `useOrdenesCliente.ts & useOrdenesCliente()`, `useKeyboardVisible.ts & useKeyboardVisible()`, `SheetTrigger & useOrdenesBusqueda()`, `ClienteFormModalProps & ClienteCardProps`, `ClienteFormModal & ClientesDataTable`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `db` connect `useOrdenesCliente.ts & useOrdenesCliente()` to `inter & metadata`, `Offline Sync & Firestore Storage`, `Alert & Alert-Dialog UI`, `Business Logic & Firestore Sanitizers`, `AuthProvider.tsx & AuthContext`, `ClientesDataTable.tsx & ClienteCard`, `App Layout & Layout Content`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useAuth()` (e.g. with `AppLayout()` and `ClientesPage()`) actually correct?**
  _`useAuth()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `SidebarContext` (e.g. with `Comp` and `Sidebar`) actually correct?**
  _`SidebarContext` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `SidebarContextProps` (e.g. with `Comp` and `Sidebar`) actually correct?**
  _`SidebarContextProps` has 30 INFERRED edges - model-reasoned connections that need verification._
- **What connects `config`, `$schema`, `style` to the rest of the system?**
  _418 weakly-connected nodes found - possible documentation gaps or missing edges._