# Plan de Optimización de Rendimiento y Estrategia de Caché - TecniControl

## Resumen Ejecutivo
Este plan detalla las acciones necesarias para transformar la gestión de datos de la aplicación TecniControl, pasando de un modelo de peticiones imperativas e ineficientes a una arquitectura reactiva basada en **TanStack Query**. El objetivo es reducir la latencia percibida, minimizar el consumo de datos mediante una caché inteligente y mejorar significativamente la experiencia del usuario en dispositivos móviles (Capacitor) mediante el uso de persistencia local y optimización de payloads.

---

## Análisis de la Situación Actual

### Ineficiencias Detectadas
1. **Llamadas Duplicadas**: Hooks como `useEstadisticasUsuario` y `useOrdenesUsuario` llaman de forma independiente a `getOrdenesPorUsuario`, provocando múltiples descargas de la misma colección en la misma sesión.
2. **Falta de Caché de Navegación**: Cada cambio de ruta en Next.js desmonta componentes y, al volver, los `useEffect` disparan nuevas peticiones a Firestore, incluso si los datos no han cambiado.
3. **Fetching de Colecciones Completas**: La función `getOrdenesPorUsuario` descarga todas las órdenes del usuario. Con el tiempo, esto generará payloads pesados y lentitud en la UI.
4. **Acoplamiento de Lógica de Datos**: La lógica de fetching está mezclada con el estado de la UI (`useState`/`useEffect`) en casi todos los hooks, dificultando la implementación de estrategias avanzadas como *stale-while-revalidate*.
5. **Uso Pasivo de Firestore**: Aunque Firestore tiene persistencia, no se está configurando activamente para priorizar la caché local en lecturas repetitivas.

---

## Oportunidades de Mejora

1. **Deduplicación y Gestión de Estado**: Implementar **TanStack Query** para centralizar el estado de las peticiones.
2. **Estrategia de Caché en Capas**: 
   - **Memoria**: Caché activa durante la sesión.
   - **Persistencia**: Firestore Local Persistence + IndexedDB.
   - **Service Worker**: (Opcional) Workbox para activos estáticos.
3. **Optimización de Payloads**:
   - Paginación basada en cursores para órdenes.
   - DTOs (Data Transfer Objects) para reducir campos no utilizados en vistas de lista (ej: no descargar la firma del cliente en el listado general).
4. **Experiencia Offline**: Detectar estado de conexión y mostrar datos en "Optimistic UI".

---

## Plan de Acción Detallado

### Fase 1: Base Tecnológica e Instalación (Semana 1)
**Objetivo**: Preparar el entorno para la nueva gestión de datos.

1. **Instalación de Dependencias**:
   ```bash
   npm install @tanstack/react-query @tanstack/react-query-devtools
   ```
2. **Configuración del QueryClient**: Crear un proveedor global en `src/app/layout.tsx` con configuraciones por defecto:
   - `staleTime`: 5 minutos (evita refetching constante).
   - `gcTime` (cacheTime): 30 minutos.
   - `retry`: 2 (reintentos automáticos en fallos de red).

3. **Configuración de Persistencia Firestore**:
   - Modificar `src/lib/firebase.ts` para habilitar `enableIndexedDbPersistence`.

### Fase 2: Refactorización de Hooks Core (Semana 1-2)
**Objetivo**: Migrar los hooks actuales a TanStack Query.

- **Tarea 2.1: `useUserData`**:
  - Migrar a `useQuery({ queryKey: ['user', uid], queryFn: ... })`.
- **Tarea 2.2: `useOrdenesUsuario`**:
  - Implementar `useQuery` con la clave `['ordenes', userId]`.
  - Beneficio: Si `useEstadisticasUsuario` usa la misma clave, los datos se comparten instantáneamente.
- **Tarea 2.3: `useClientesUsuario`**:
  - Migrar a `useQuery` con clave `['clientes', userId]`.

### Fase 3: Optimización de Payloads y Paginación (Semana 2)
**Objetivo**: Reducir el tamaño de los datos transmitidos.

1. **Paginación en `getOrdenesPorUsuario`**:
   - Modificar el helper para aceptar `limit` y `startAfter`.
   - Usar `useInfiniteQuery` en la página de órdenes para carga infinita o "Cargar más".
2. **Proyección de Campos (DTOs)**:
   - Crear una función `getOrdenesResumen` que solo traiga `id`, `fecha`, `cliente` y `estado`, omitiendo campos pesados (actividades detalladas, imágenes, firmas) para la vista de lista.

### Fase 4: Experiencia Offline y Mejoras de UI (Semana 3)
**Objetivo**: Hacer que la app se sienta nativa y robusta.

1. **Prefetching**:
   - Implementar `queryClient.prefetchQuery` cuando el usuario hace hover sobre un botón de navegación o en el login.
2. **Mutaciones Optimistas**:
   - Al crear una orden, actualizar la caché local inmediatamente antes de que Firestore confirme la escritura.
3. **Detección de Red**:
   - Usar el plugin `@capacitor/network` para mostrar un banner sutil de "Modo Offline" y deshabilitar acciones que requieran sincronización inmediata.

---

## Ejemplo Técnico: Migración de `useOrdenesUsuario`

### Antes (Imperativo):
```typescript
useEffect(() => {
  const cargarOrdenes = async () => {
    setLoading(true);
    const data = await getOrdenesPorUsuario(user.uid);
    setOrdenes(data);
    setLoading(false);
  };
  cargarOrdenes();
}, [user?.uid]);
```

### Después (Declarativo con TanStack Query):
```typescript
export const useOrdenesUsuario = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['ordenes', user?.uid],
    queryFn: () => getOrdenesPorUsuario(user!.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 5, // 5 minutos de "frescura"
  });
};
```

---

## Recomendaciones Adicionales
1. **Monitoreo**: Implementar `firebase/analytics` para medir tiempos de carga reales en dispositivos.
2. **Compresión de Imágenes**: Asegurar que las fotos de repuestos o firmas se compriman en el cliente antes de subirlas a Storage/Firestore.
3. **Limpieza de Caché**: Implementar un mecanismo de invalidación manual (`queryClient.invalidateQueries`) tras acciones críticas (ej: borrar una orden).

## Métricas de Éxito
- **Reducción del 40%** en el número de peticiones de lectura a Firestore.
- **Latencia cero** al navegar entre páginas ya visitadas.
- **Funcionalidad completa** de consulta de órdenes sin conexión a internet.
