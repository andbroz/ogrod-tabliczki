import { InjectionToken } from '@angular/core';

/** Returns a number in [0, 1). Injected so game logic is deterministic in tests. */
export type Random = () => number;

export const RANDOM = new InjectionToken<Random>('RANDOM', {
  providedIn: 'root',
  factory: () => Math.random,
});
