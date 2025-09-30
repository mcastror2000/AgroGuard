// Weather calculation utilities

export function dewPointC(tempC: number | null, rh: number | null): number | null {
  if (typeof tempC !== "number" || typeof rh !== "number") return null;
  
  const a = 17.62;
  const b = 243.12; // Magnus–Tetens formula over water
  const gamma = Math.log(rh / 100) + (a * tempC) / (b + tempC);
  
  return (b * gamma) / (a - gamma);
}

export function fmt(n: number | null | undefined, d = 0): string {
  if (n === null || n === undefined || Number.isNaN(+n)) return "—";
  return (+n).toFixed(d);
}