# Auditoría UI/UX — `ClientesList` + `ClientesDataTable`

**Fecha:** Junio 2025  
**Alcance:** Revisión de rendimiento, accesibilidad, mobile-first, arquitectura de UI y correctitud de código  
**Prioridades:** 🔴 P0 — Bug/quiebre | 🟠 P1 — Degradación significativa | 🟡 P2 — Mejora notable | 🟢 P3 — Pulido

---

## Índice

1. [Bugs críticos (P0)](#1-bugs-críticos-p0)
2. [Accesibilidad — Teclado y Screen Readers](#2-accesibilidad--teclado-y-screen-readers)
3. [Mobile — Interacción táctil y viewport](#3-mobile--interacción-táctil-y-viewport)
4. [Arquitectura de estado y acoplamiento](#4-arquitectura-de-estado-y-acoplamiento)
5. [Rendimiento de renderizado](#5-rendimiento-de-renderizado)
6. [UX — Flujos y microcopy](#6-ux--flujos-y-microcopy)
7. [Diseño visual — Consistencia](#7-diseño-visual--consistencia)
8. [Plan de refactorización priorizado](#8-plan-de-refactorización-priorizado)

---

## 1. Bugs críticos (P0)

### 1.1 🔴 Clase Tailwind inválida `w-4.5 h-4.5` — `ClientesList`

```tsx
// ❌ ClientesList.tsx — el punto en "4.5" no es válido en Tailwind sin config personalizada
<Users className="w-4.5 h-4.5 text-blue-400" />
```

El punto en `w-4.5` no existe en la escala por defecto de Tailwind. El ícono se renderiza sin dimensiones definidas, colapsando a su tamaño SVG intrínseco (variable por navegador).

```tsx
// ✅ Corrección
<Users className="w-[18px] h-[18px] text-blue-400" />
// o agregar al tailwind.config: extend.spacing['4.5'] = '1.125rem'
```

---

### 1.2 🔴 Breakpoint `xs:` no estándar en Tailwind — `ClientesList`

```tsx
// ❌ ClientesList.tsx — 'xs' no existe en Tailwind por defecto
<span className="hidden xs:inline">Crear cliente</span>
<span className="inline xs:hidden" aria-hidden="true">Nuevo</span>
```

En Tailwind v3/v4 sin configuración extra, `xs:` se ignora silenciosamente. El resultado es que **siempre se muestra "Nuevo"** (el fallback sin breakpoint), nunca "Crear cliente".

```tsx
// ✅ Corrección: usar 'sm:' (640px) o agregar al config:
// theme.extend.screens: { xs: '480px' }
<span className="hidden sm:inline">Crear cliente</span>
<span className="inline sm:hidden" aria-hidden="true">Nuevo</span>
```

---

### 1.3 🔴 Dialog de eliminación — limpieza de estado incompleta — `ClientesDataTable`

```tsx
// ❌ ClientesDataTable.tsx
<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
```

Cuando el usuario cierra el dialog tocando el backdrop o presionando `Escape`, `onOpenChange` llama a `setDeleteDialogOpen(false)` pero **`clienteToDelete` permanece con el ID del cliente anterior**. Si el dialog se reabre mediante otro mecanismo, el estado apuntará al cliente incorrecto.

```tsx
// ✅ Corrección
onOpenChange={(open) => {
  if (!open) {
    setDeleteDialogOpen(false);
    setClienteToDelete(null); // limpiar siempre
  }
}}
```

---

### 1.4 🔴 `setIsDeleting(false)` en `finally` cierra el diálogo antes de manejar el error — `ClientesDataTable`

```tsx
// ❌ En finally: si hay error, el dialog se cierra antes de que el usuario lea el toast
} finally {
  setIsDeleting(false);
  setDeleteDialogOpen(false); // ← se cierra SIEMPRE, incluso con error
  setClienteToDelete(null);
}
```

El `toast` destructivo aparece pero el dialog ya desapareció, dejando al usuario sin contexto.

```tsx
// ✅ Corrección: mover cierre al bloque try exitoso
try {
  await deleteDoc(doc(db, "clientes", clienteToDelete));
  // ... animación de salida ...
  toast({ title: "Cliente eliminado" });
  setDeleteDialogOpen(false);
  setClienteToDelete(null);
} catch (error) {
  toast({ title: "Error al eliminar", variant: "destructive", ... });
  // dialog permanece abierto para que el usuario pueda reintentar
} finally {
  setIsDeleting(false);
}
```

---

### 1.5 🔴 `role="button"` sin `onKeyDown` — doble ocurrencia

```tsx
// ❌ ClientesDataTable.tsx — ClienteCard
<div
  className="relative p-5 cursor-pointer flex flex-col gap-4"
  onClick={handleView}
  role="button"
  tabIndex={0}
  // ← Sin onKeyDown: Enter y Space no disparan la acción
>
```

Un elemento con `role="button"` y `tabIndex={0}` **debe** responder a `Enter` y `Space`. Sin `onKeyDown`, usuarios de teclado no pueden activar la card.

```tsx
// ✅ Corrección
<div
  onClick={handleView}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleView();
    }
  }}
  role="button"
  tabIndex={0}
  className="..."
>
```

**Alternativa mejor:** convertir el wrapper a `<button>` y resetear estilos, eliminando el problema de semántica por completo.

---

## 2. Accesibilidad — Teclado y Screen Readers

### 2.1 🟠 Focus trap ausente en el Dialog de eliminación

Al confirmar o cancelar eliminación con teclado, el foco no retorna al botón de eliminar del cliente que lo originó. En Mobile el efecto es que el scroll vuelve a top.

```tsx
// ✅ Guardar ref del trigger y restaurar foco al cerrar
const lastFocusedRef = useRef<HTMLElement | null>(null);

const handleDeleteClick = useCallback((id: string, triggerEl: HTMLElement) => {
  lastFocusedRef.current = triggerEl;
  setClienteToDelete(id);
  setDeleteDialogOpen(true);
}, []);

// En handleDeleteCancel / cierre del dialog:
lastFocusedRef.current?.focus();
```

---

### 2.2 🟠 `aria-live="polite"` en el header compite con el mismo en `ClientesDataTable`

`ClientesList` emite cambios de conteo con `aria-live="polite"` en el header. `ClientesDataTable` también tiene `aria-live="polite"` en el contador de "Mostrando X a Y". En screen readers esto crea **dos anuncios simultáneos** al filtrar, que se interrumpen mutuamente.

```tsx
// ✅ Solución: unificar en un único aria-live region en ClientesList
// y que ClientesDataTable no emita su propio live region para el conteo
```

---

### 2.3 🟡 `role="list"` + `role="listitem"` correctos pero el wrapping div rompe semántica

```tsx
// ❌ ClientesDataTable.tsx
<div className="grid ..." role="list">
  {paginatedClientes.map((client) => (
    <div key={client.id} role="listitem"> {/* ← wrapper div innecesario */}
      <ClienteCard ... />
    </div>
  ))}
</div>
```

El `<div role="listitem">` está bien pero el `role="listitem"` debería estar en `ClienteCard` directamente para evitar nodos extra en el DOM.

```tsx
// ✅ Opción 1: pasar role al ClienteCard
// ✅ Opción 2: usar <ul>/<li> reales (mejor para ARIA)
<ul className="grid ..." aria-label="Lista de clientes">
  {paginatedClientes.map((client) => (
    <ClienteCard key={client.id} as="li" ... />
  ))}
</ul>
```

---

### 2.4 🟡 Botones de acción en `ClienteCard` sin texto visible en desktop

```tsx
// ClienteCard — el botón de eliminar solo muestra ícono
<button aria-label="Eliminar cliente">
  <Trash2 className="w-5 h-5" />
</button>
```

El `aria-label` existe, pero los botones "Historial" y "Editar" tienen texto visible. El `Trash2` solo tiene ícono. Consistencia: o todos muestran texto o todos son ícono-only con label.

---

### 2.5 🟡 Falta `aria-label` descriptivo en paginación de escritorio

```tsx
// ❌ Botones de página numerados sin contexto
<button onClick={() => handlePageChange(item)}>
  {item} {/* el screen reader anuncia "2" sin decir "página 2" */}
</button>
```

```tsx
// ✅ Corrección
<button
  aria-label={`Ir a página ${item}`}
  aria-current={currentPage === item ? "page" : undefined}
>
  {item}
</button>
```

---

## 3. Mobile — Interacción táctil y viewport

### 3.1 🟠 Pull-to-refresh sin `touch-action: pan-y` explícito

El contenedor principal en `ClientesList` usa `usePullToRefresh` pero no establece `touch-action`. Algunos navegadores Android (Chrome/WebView) bloquean el gesto de swipe-down si `touch-action` no está definido, haciendo que el pull-to-refresh no funcione en ciertos dispositivos.

```tsx
// ✅ En el contenedor ref:
<div
  ref={containerRef}
  className="bg-gray-900"
  style={{ touchAction: 'pan-y' }}  // o en CSS: touch-action: pan-y
>
```

---

### 3.2 🟠 Paginación sticky en mobile oculta contenido sin compensación adecuada

La paginación móvil es `sticky bottom-6` con altura aproximada de ~64px. El contenedor tiene `pb-24` (96px), que compensa, pero la cantidad **no se calcula dinámicamente**. Si el dispositivo tiene barra de navegación del sistema (`env(safe-area-inset-bottom)`), el nav sticky puede quedar tapado.

```tsx
// ❌ Valor hardcoded
<div className="space-y-4 pb-24 sm:pb-8">

// ✅ Usar safe area
<div className="space-y-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-8">

// Y en el nav sticky:
<nav className="... bottom-[calc(1.5rem+env(safe-area-inset-bottom))]">
```

---

### 3.3 🟠 Tap targets en `ClienteCard` — el área del botón de eliminar es 44×44 en desktop pero 40×40 en mobile

```tsx
// ❌ ClienteCard — botón eliminar
<button className="p-2 rounded-xl ..."> {/* p-2 = 8px padding → total ~36px */}
  <Trash2 className="w-5 h-5" />
</button>
```

Apple HIG y WCAG recomiendan mínimo 44×44pt. Con `p-2` y `w-5 h-5` el área real es ~36px.

```tsx
// ✅ Corrección
<button className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl ...">
  <Trash2 className="w-5 h-5" />
</button>
```

---

### 3.4 🟠 Dos inputs de búsqueda idénticos en el DOM — duplicación de estado

```tsx
// ClientesList.tsx — dos inputs controlados por el mismo `searchTerm`
// Uno hidden sm:block (desktop), otro sm:hidden (mobile)
```

Ambos inputs responden al mismo estado, pero son dos nodos de formulario distintos en el DOM. Si el usuario escribe en el móvil, luego rota el dispositivo a landscape (>640px), el input desktop toma foco pero ambos muestran el mismo valor. El problema real es **duplicación de lógica de accesibilidad** (dos `<label>`, dos `id` diferentes para lo mismo).

**Solución recomendada:** Un único input que cambia de posición con CSS, no dos instancias distintas.

```tsx
// ✅ Un solo input, reposicionado con flexbox/grid
// Mobile: debajo del header row
// Desktop: dentro del header row
// Usar CSS order o un solo input con clases responsive
```

---

### 3.5 🟡 Scroll to sentinel al cambiar página — UX anti-patrón en mobile

```tsx
// ClientesDataTable.tsx
scrollSentinelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
```

En mobile, `scrollIntoView` con `behavior: 'smooth'` puede hacer scroll inesperado si el sentinel está fuera del viewport. Además, en iOS 15 con la barra flotante del Safari, `scrollIntoView` puede calcular mal la posición.

```tsx
// ✅ Alternativa más confiable en mobile:
window.scrollTo({ top: 0, behavior: 'smooth' });
// o mejor: si la lista está en un contenedor scrolleable propio:
containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
```

---

### 3.6 🟡 `CountUp` anima cada vez que cambia el filtro de búsqueda

```tsx
// ClientesDataTable.tsx
<CountUp
  from={0}  // ← siempre empieza desde 0
  to={Math.max(totalGlobal ?? 0, data.length)}
  ...
/>
```

Al escribir en el buscador, `data.length` cambia letra por letra. `CountUp` anima `0 → N` en cada keystroke, creando una animación de contador **jarring y confusa** que distrae del resultado de búsqueda.

```tsx
// ✅ Opción 1: Solo animar al mount inicial
<CountUp from={0} to={totalGlobal ?? data.length} duration={1} />
// y no pasarle `data.length` como prop dinámica

// ✅ Opción 2: Deshabilitar animación cuando hay searchTerm activo
// Mostrar el número estático durante búsqueda
```

---

### 3.7 🟡 Falta feedback táctil en la paginación numérica desktop

Los botones de página numérica tienen `active:scale-95` pero en mobile los botones de número son de `min-w-[40px] h-10` = 40px, justo por debajo del mínimo recomendado de 44px.

```tsx
// ✅ Corrección
className={`min-w-[44px] h-11 ...`}
```

---

### 3.8 🟡 La card completa dispara `onClick` pero también contiene botones hijos

```tsx
// ClienteCard — el div padre captura clicks del área interior
<div onClick={handleView} role="button">
  ...
  <button onClick={handleHistorial}>Historial</button>
  <button onClick={handleEdit}>Editar</button>
  <button onClick={handleDeleteConfirmButton}>🗑</button>
</div>
```

Los botones hijos usan `e.stopPropagation()`, lo que funciona para clicks pero en **Mobile con VoiceOver/TalkBack**, los elementos con `role="button"` anidan botones reales, creando confusión de navegación. El área de la card que no está cubierta por botones dispara "ver cliente", pero ese área no tiene indicador visual claro.

**Solución recomendada:** Eliminar el `onClick` del wrapper. Agregar un botón explícito "Ver detalle" con texto o ícono en la card.

---

## 4. Arquitectura de estado y acoplamiento

### 4.1 🟠 Firebase `deleteDoc` directamente en el componente de UI

```tsx
// ❌ ClientesDataTable.tsx — responsabilidad de datos en capa de presentación
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const handleDeleteConfirm = useCallback(async () => {
  await deleteDoc(doc(db, "clientes", clienteToDelete));
  ...
}, [...]);
```

`ClientesDataTable` es un componente de presentación (recibe datos por props) pero llama directamente a Firebase. Esto significa:
- Imposible de unit-testear sin mockear Firestore
- La lógica de eliminación está repartida: la llamada en `DataTable`, el refresco en `ClientesList` vía callback `onDelete`
- Si la colección cambia de nombre o se agrega lógica de negocio (e.g. soft delete), hay que buscar la llamada en el componente visual

```tsx
// ✅ Corrección: delegar al parent o a un hook
// En ClientesList:
const handleDelete = useCallback(async (id: string) => {
  await deleteClienteById(id); // función del hook
  await refrescarClientes();
}, [...]);

// ClientesDataTable solo recibe:
onDeleteConfirm: (id: string) => Promise<void>;
// Y llama await onDeleteConfirm(id) con loading/error manejados localmente
```

---

### 4.2 🟠 `itemsPerPage` como `useState` que nunca cambia

```tsx
// ❌ ClientesDataTable.tsx
const [itemsPerPage] = useState(20); // setter nunca se usa
```

Usar `useState` para un valor que nunca cambia provoca que React incluya intencionalmente esta variable en el árbol de dependencias de `useMemo`/`useCallback`, aunque no tenga efecto práctico. Genera lint warnings y confusión.

```tsx
// ✅ Constante de módulo o prop
const ITEMS_PER_PAGE = 20;
// o como prop: itemsPerPage = 20
```

---

### 4.3 🟡 Callbacks estables redundantes en `ClientesDataTable`

```tsx
// ❌ ClientesDataTable.tsx — useCallback que solo reenvía props
const handleViewStable = useCallback((c: Cliente) => onView(c), [onView]);
const handleEditStable = useCallback((c: Cliente) => onEdit(c), [onEdit]);
const handleHistorialStable = useCallback((c: Cliente) => onHistorial(c), [onHistorial]);
```

Si `ClientesList` ya envuelve sus funciones en `useCallback`, estos wrappers son costo extra de memoización sin beneficio real. Y si `ClientesList` **no** los memoiza, estos wrappers tampoco ayudan porque se recrean cuando `onView` cambia.

```tsx
// ✅ Pasar las props directamente a ClienteCard
// o si se necesita garantía, usar useCallback en el origen (ClientesList)
```

---

### 4.4 🟡 `totalPages` calculado dos veces sin compartir

```tsx
// ClientesDataTable.tsx
const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage)); // cálculo directo

// Pagination — recibe totalPages como prop, pero el useMemo de pages
// también hace cálculos sobre él
```

No es un bug, pero si `itemsPerPage` fuera variable, este valor no estaría sincronizado. Mejor memoizar explícitamente.

---

### 4.5 🟡 `exitingIds` puede persistir si el componente se desmonta durante la animación

```tsx
// ClientesDataTable.tsx
setTimeout(() => {
  onDelete(idToRemove);
  setExitingIds(prev => { ... });
}, 220);
```

Si el componente se desmonta antes de los 220ms (e.g., navegación), el `setTimeout` intenta llamar `setExitingIds` en un componente desmontado — warning de React y memory leak potencial.

```tsx
// ✅ Usar useEffect cleanup
useEffect(() => {
  return () => {
    // limpiar timeouts pendientes
  };
}, []);

// O usar la ref pattern:
const isMounted = useRef(true);
useEffect(() => () => { isMounted.current = false; }, []);
// En el setTimeout:
if (isMounted.current) setExitingIds(...);
```

---

## 5. Rendimiento de renderizado

### 5.1 🟠 `useMediaQuery` llamado dos veces por separado

```tsx
// ❌ ClientesDataTable.tsx
const isMobile = useMediaQuery("(max-width: 768px)");
const isMobileSm = useMediaQuery("(max-width: 640px)");
```

Cada `useMediaQuery` agrega un event listener de `resize`. Con la lista de clientes abierta, hay **dos listeners activos** re-renderizando el componente en cada resize. En dispositivos lentos (entry-level Android) esto puede causar jank durante rotación.

```tsx
// ✅ Un solo observer con múltiples breakpoints
// o usar un hook unificado:
const { isMd, isSm } = useBreakpoints(); // implementar con un único ResizeObserver

// ✅ Alternativa: usar CSS para la paginación mobile en lugar de JS
// La paginación puede ser completamente responsive con CSS sin detectar viewport en JS
```

---

### 5.2 🟡 `useMemo` de `filteredClientes` crea un array nuevo en cada render

```tsx
// ClientesList.tsx
const filteredClientes = useMemo(() => {
  if (!searchTerm.trim()) return clientes; // ← retorna la misma referencia
  ...
  return clientes.filter(...); // ← nueva referencia en cada keystroke
}, [clientes, searchTerm]);
```

Cuando hay `searchTerm`, cada render crea un nuevo array. `ClientesDataTable` recibe `data={filteredClientes}`, y como `data` cambia de referencia, `paginatedClientes` (que depende de `data`) también se recalcula. Esto está bien para `useMemo`, pero `ClienteCard` está envuelto en `memo()`. Sin embargo, `onView`, `onEdit`, `onHistorial` se pasan desde `ClientesList` con `useCallback` — verificar que las dependencias sean estables.

---

### 5.3 🟡 La barra de progreso recalcula un porcentaje en cada render

```tsx
// ClientesDataTable.tsx
style={{
  width: `${data.length > 0
    ? Math.min(100, (Math.min(currentPage * itemsPerPage, data.length) / data.length) * 100)
    : 0}%`,
}}
```

Este cálculo inline se ejecuta en cada render del componente. Con `memo()` y las dependencias bien manejadas esto está bien, pero podría extraerse a un `useMemo` explícito para claridad y futura optimización.

---

## 6. UX — Flujos y microcopy

### 6.1 🟠 Estado vacío duplicado entre `ClientesList` y `ClientesDataTable`

`ClientesList` maneja:
- `isEmpty`: sin clientes en absoluto
- `isFiltered`: clientes existen pero el filtro no da resultados
- Solo muestra `<ClientesDataTable>` cuando `showTable = filteredClientes.length > 0`

`ClientesDataTable` **también** tiene su propio estado vacío:

```tsx
// ClientesDataTable.tsx — esto NUNCA se renderiza con la lógica actual de ClientesList
{paginatedClientes.length === 0 ? (
  <div>Sin clientes registrados</div>
) : (
  <div>grid de cards</div>
)}
```

Este empty state en `DataTable` es **código muerto** porque `DataTable` solo se monta cuando hay datos (`showTable = true`). Confunde al desarrollador que mantiene el código y agrega lógica de renderizado que nunca ejecuta.

**Acción:** Eliminar el empty state de `ClientesDataTable`. Toda la gestión de estados vacíos vive en `ClientesList`.

---

### 6.2 🟠 El botón de error solo permite `window.location.reload()`

```tsx
// ❌ ClientesList.tsx
<button onClick={() => window.location.reload()}>Reintentar</button>
```

Un reload completo es destructivo: pierde cualquier estado de URL, cierra modales abiertos desde otras partes del layout, y es lento en conexiones lentas. El hook ya expone `refrescarClientes`.

```tsx
// ✅
<button onClick={refrescarClientes}>Reintentar</button>
```

---

### 6.3 🟡 El texto del botón principal cambia sin consistencia entre estados

| Estado | Texto botón principal |
|--------|----------------------|
| Lista vacía | "Crear Primer Cliente" |
| Lista con datos | "Crear cliente" / "Nuevo" |
| Header siempre visible | "Crear cliente" / "Nuevo" |

"Crear Primer Cliente" tiene mayúsculas inconsistentes (Title Case mezclado). "Nuevo" en mobile es ambiguo — ¿nuevo qué? Considera "Agregar" como texto mobile más corto pero claro.

---

### 6.4 🟡 La barra de progreso de paginación es un anti-patrón UX

```tsx
// ClientesDataTable.tsx
// Una barra de progreso que muestra "qué porcentaje de clientes has paginado"
```

Los usuarios no conceptualizan la paginación como "progreso". Una barra de progreso implica una tarea con inicio/fin (carga, upload, proceso). Usar una barra de progreso para paginación es confuso: ¿debo llegar al 100%? ¿Qué pasa si ya vi todos?

**Alternativa:** Mostrar el texto "Página X de Y" o simplemente eliminar la barra — la paginación numérica ya comunica la posición.

---

### 6.5 🟡 `setTimeout(() => setSelectedClienteHistorial(null), 300)` — número mágico

```tsx
// ClientesList.tsx
const closeHistorial = useCallback(() => {
  setHistorialOpen(false);
  setTimeout(() => setSelectedClienteHistorial(null), 300);
}, []);
```

El `300ms` asume que la animación de cierre del modal dura exactamente 300ms. Si el modal cambia su duración de animación, este número hay que actualizarlo manualmente en otro lugar.

```tsx
// ✅ Exportar la constante desde el modal o desde el design system
import { MODAL_ANIMATION_DURATION } from '@/components/ui/dialog';
setTimeout(() => setSelectedClienteHistorial(null), MODAL_ANIMATION_DURATION);
```

---

### 6.6 🟡 El texto "Sin resultados" en `isFiltered` muestra el `searchTerm` sin sanitizar

```tsx
// ClientesList.tsx
<strong className="text-gray-400">"{searchTerm}"</strong>
```

Si `searchTerm` contiene HTML o caracteres especiales (e.g., `<script>`, `&`), React escapa el contenido correctamente. Sin embargo, si `searchTerm` es muy largo (usuario pegó texto), el UI se rompe visualmente.

```tsx
// ✅ Truncar el searchTerm en el mensaje
const displayTerm = searchTerm.length > 30
  ? `${searchTerm.slice(0, 30)}…`
  : searchTerm;
```

---

## 7. Diseño visual — Consistencia

### 7.1 🟡 `rounded-2xl` vs `rounded-xl` vs `rounded-lg` mezclados sin sistema

| Elemento | Border radius |
|----------|--------------|
| Cards de clientes | `rounded-2xl` |
| Input de búsqueda desktop | `rounded-lg` |
| Input de búsqueda móvil | `rounded-lg` |
| Botón "Crear cliente" | `rounded-lg` |
| Botón acciones en card | `rounded-xl` |
| Dialog de eliminación | `rounded-2xl` |
| Badges de info (phone, email) | `rounded-xl` |

Hay tres valores diferentes sin una escala clara. Definir en el design system:
- `rounded-lg` → elementos inline pequeños (inputs, badges)
- `rounded-xl` → botones y controles medianos
- `rounded-2xl` → cards y contenedores

---

### 7.2 🟡 El icono de avatar de cliente siempre es el mismo `<User />`

Todos los clientes muestran el mismo ícono genérico azul. Con muchos clientes, la lista es visualmente homogénea y dificulta el escaneo rápido. Opciones:

1. **Iniciales generadas:** `AB` para "Ana Becerra" con color derivado del nombre (hash → color de paleta)
2. **Avatar placeholder con color único por cliente:** mismo color derivado del nombre
3. Mantener el ícono pero variar el color de fondo según primera letra

---

### 7.3 🟢 El header en `ClientesList` usa `<header>` pero el main usa `<main>` dentro de un `div` — jerarquía semántica confusa

```tsx
// ClientesList.tsx
<div className="bg-gray-900"> {/* no semántico */}
  <div className="w-full ...">
    <div className="bg-gray-800/40 ...">
      <header>...</header>  {/* semántico */}
      <main>...</main>      {/* semántico */}
    </div>
  </div>
</div>
```

`<main>` y `<header>` dentro de un componente que no es la raíz del layout pueden causar problemas con `document.querySelector('main')` y herramientas de testing. Si hay un `<main>` en el layout padre, este es un segundo `<main>` en el documento (solo debe haber uno).

```tsx
// ✅ Usar <section aria-label="Gestión de clientes"> en lugar de <main>
// y <div role="banner"> o simplemente un <div> con clase para el header
```

---

## 8. Plan de refactorización priorizado

### Sprint 1 — Bugs que quiebran funcionalidad (hacer primero)

| # | Issue | Archivo | Esfuerzo |
|---|-------|---------|---------|
| 1 | Clase `w-4.5 h-4.5` inválida | `ClientesList` | 5min |
| 2 | Breakpoint `xs:` no estándar | `ClientesList` | 10min |
| 3 | Dialog limpieza de `clienteToDelete` | `ClientesDataTable` | 15min |
| 4 | `finally` cierra dialog en error | `ClientesDataTable` | 20min |
| 5 | `role="button"` sin `onKeyDown` | `ClienteCard` | 20min |

### Sprint 2 — Mobile y accesibilidad crítica

| # | Issue | Archivo | Esfuerzo |
|---|-------|---------|---------|
| 6 | `touch-action: pan-y` en contenedor pull-to-refresh | `ClientesList` | 10min |
| 7 | Safe area inset en paginación sticky | `ClientesDataTable` | 20min |
| 8 | Tap targets <44px (botón eliminar) | `ClienteCard` | 10min |
| 9 | Un solo input de búsqueda | `ClientesList` | 45min |
| 10 | `refrescarClientes` en lugar de `window.location.reload()` | `ClientesList` | 5min |

### Sprint 3 — Arquitectura y rendimiento

| # | Issue | Archivo | Esfuerzo |
|---|-------|---------|---------|
| 11 | `deleteDoc` fuera del componente de UI | `ClientesDataTable` | 1h |
| 12 | `useState(20)` → constante de módulo | `ClientesDataTable` | 5min |
| 13 | `useMediaQuery` unificado | `ClientesDataTable` | 30min |
| 14 | `isMounted` ref para prevenir memory leak en setTimeout | `ClientesDataTable` | 15min |
| 15 | Eliminar empty state muerto en `ClientesDataTable` | `ClientesDataTable` | 10min |
| 16 | `CountUp` — no animar en búsqueda activa | `ClientesDataTable` | 20min |

### Sprint 4 — UX y diseño

| # | Issue | Esfuerzo |
|---|-------|---------|
| 17 | Avatares con iniciales + color por cliente | 1h |
| 18 | Eliminar barra de progreso de paginación | 10min |
| 19 | Unificar `aria-live` regions | 20min |
| 20 | Truncar `searchTerm` en mensaje "Sin resultados" | 5min |
| 21 | Unificar escala de `border-radius` | 30min |
| 22 | Constante para duración de animación de modal | 10min |
| 23 | Reemplazar `<main>` por `<section>` en componente | 10min |

---

## Resumen ejecutivo

Los componentes tienen una **base sólida**: memoización aplicada, haptic feedback, skeleton loading, pull-to-refresh, y manejo de estados vacíos bien estructurado. Los problemas principales son:

1. **Dos bugs silenciosos en producción** (`w-4.5` y `xs:`) que afectan el layout visual sin error en consola
2. **Estado de dialog inconsistente** en eliminación que puede causar deletes incorrectos
3. **Accesibilidad de teclado rota** en `ClienteCard` (role="button" sin onKeyDown)
4. **Acoplamiento Firebase** en capa de presentación que complica testing y mantenimiento
5. **Duplicación de inputs** de búsqueda que complica accesibilidad y estado
6. **CountUp animando en búsqueda** que crea experiencia de usuario confusa en mobile

El mayor ROI está en el Sprint 1 (30-40 min de trabajo, bugs visibles en producción) y el issue de `deleteDoc` en Sprint 3 (mejora de arquitectura que afecta mantenibilidad a largo plazo).