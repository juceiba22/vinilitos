const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function oneYearFrom(date: Date): Date {
  return new Date(date.getTime() + ONE_YEAR_MS);
}

export function isExpired(subscriptionExpiresAt: Date): boolean {
  return subscriptionExpiresAt.getTime() < Date.now();
}

export function daysUntil(subscriptionExpiresAt: Date): number {
  return Math.ceil(
    (subscriptionExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  );
}
