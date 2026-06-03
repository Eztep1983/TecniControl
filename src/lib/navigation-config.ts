export type AppView =
  | "ordenes"
  | "ordenes/mantenimiento"
  | "clientes"
  | "tareas-repuestos"
  | "configuracion";

export interface RouteConfig {
  path: string;
  view: AppView;
  order: number;
}

export const ROUTES: RouteConfig[] = [
  { path: "/ordenes", view: "ordenes", order: 0 },
  { path: "/ordenes/mantenimiento", view: "ordenes/mantenimiento", order: 0 },
  { path: "/clientes", view: "clientes", order: 1 },
  { path: "/tareas-repuestos", view: "tareas-repuestos", order: 2 },
  { path: "/configuracion", view: "configuracion", order: 3 },
];

export const getRouteByPath = (pathname: string): RouteConfig | undefined => {
  // Coincidencia exacta
  const exact = ROUTES.find((r) => r.path === pathname);
  if (exact) return exact;

  // Coincidencia por prefijo (más específico primero)
  const sortedBySpecificity = [...ROUTES].sort((a, b) => b.path.length - a.path.length);
  return sortedBySpecificity.find((r) => pathname.startsWith(r.path));
};

export const getPathByView = (view: AppView): string => {
  return ROUTES.find((r) => r.view === view)?.path || "/ordenes";
};

export const TAB_ORDER: AppView[] = ROUTES
  .filter(r => r.order >= 0)
  .sort((a, b) => a.order - b.order)
  .map(r => r.view);
