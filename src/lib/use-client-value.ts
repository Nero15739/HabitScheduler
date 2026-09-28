"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** Returns `compute()` on the client and `serverValue` during SSR/hydration, without setState-in-effect. */
export function useClientValue<T>(compute: () => T, serverValue: T): T {
  return useSyncExternalStore(noop, compute, () => serverValue);
}
