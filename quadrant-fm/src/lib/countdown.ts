export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
}

/**
 * Temps que falta fins a `targetIso` (ISO amb zona, p. ex. "…T19:00:00+02:00").
 * Retorna null si la data no és vàlida o si l'instant ja ha passat.
 */
export function countdownParts(targetIso: string, now: Date): CountdownParts | null {
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) return null;
  const ms = target - now.getTime();
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60_000);
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}

/** Text curt en català; només baixa al detall quan queda poc temps. */
export function formatCountdown(p: CountdownParts): string {
  if (p.days > 0) {
    const dayText = p.days === 1 ? "Falta 1 dia" : `Falten ${p.days} dies`;
    return p.hours > 0 ? `${dayText} i ${p.hours} h` : dayText;
  }
  if (p.hours > 0) return `Falten ${p.hours} h ${p.minutes} min`;
  if (p.minutes > 0) return `Falten ${p.minutes} min`;
  return "Comença ara!";
}
