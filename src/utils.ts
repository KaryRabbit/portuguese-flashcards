export const uid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);
export const nowISO = (): string => new Date().toISOString();
const daysFromNow = (d: number) => {
  const n = new Date();
  n.setDate(n.getDate() + d);
  return n.toISOString();
};
export const schedule = (deck: number) =>
  deck === 1
    ? daysFromNow(1)
    : deck === 2
    ? daysFromNow(2)
    : deck === 3
    ? daysFromNow(4)
    : deck === 4
    ? daysFromNow(7)
    : daysFromNow(14);
export const shuffle = <T>(a: T[]) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
