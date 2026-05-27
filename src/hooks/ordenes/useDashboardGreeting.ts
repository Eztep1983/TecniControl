import { useMemo } from 'react';

const GREETINGS = [
  { maxHour: 12, text: "Buenos días" },
  { maxHour: 18, text: "Buenas tardes" },
  { maxHour: 24, text: "Buenas noches" },
] as const;

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;
const MONTH_NAMES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"] as const;

function getGreeting(hour: number): string {
  return GREETINGS.find(g => hour < g.maxHour)?.text ?? "Buenas noches";
}

function getMotivational(day: number, hour: number): string {
  if (day === 1) return "Nueva semana, nuevo arranque";
  if (day === 5 && hour >= 15) return "¡Casi fin de semana!";
  if (day === 0 || day === 6) return "Descansando o trabajando, tú decides";
  return "¿Listo para empezar?";
}

function getDateString(now: Date): string {
  return `${DAY_NAMES[now.getDay()]} · ${now.getDate()} de ${MONTH_NAMES[now.getMonth()]}`;
}

function getFirstName(negocio?: { nombre?: string }, user?: { displayName?: string | null }): string {
  return negocio?.nombre?.split(' ')[0]
    ?? user?.displayName?.split(' ')[0]
    ?? 'Técnico';
}

interface DashboardGreeting {
  title: string;
  subtitle: string;
  motivational: string;
}

interface Negocio {
  nombre?: string;
}

interface User {
  displayName?: string | null;
}

export function useDashboardGreeting(negocio?: Negocio | null, user?: User | null): DashboardGreeting {
  return useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const name = getFirstName(negocio || undefined, user || undefined);

    return {
      title: `${getGreeting(hour)}, ${name}`,
      subtitle: getDateString(now),
      motivational: getMotivational(day, hour),
    };
  }, [negocio?.nombre, user?.displayName]);
}