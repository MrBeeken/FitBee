export function tap(): void {
  try {
    navigator.vibrate?.(10);
  } catch {
    /* ignore */
  }
}

export function buzz(): void {
  try {
    navigator.vibrate?.([40, 40, 80]);
  } catch {
    /* ignore */
  }
}

export function celebrate(): void {
  try {
    navigator.vibrate?.([30, 50, 30, 50, 120]);
  } catch {
    /* ignore */
  }
}
