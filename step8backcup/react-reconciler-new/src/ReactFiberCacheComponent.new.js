/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { enableCache } from '../../shared/ReactFeatureFlags';
import { popProvider } from './ReactFiberNewContext.new';
import * as Scheduler from '../../scheduler'; // In environments without AbortController (e.g. tests)
// replace it with a lightweight shim that only has the features we use.
// Intentionally not named imports because Rollup would
// use dynamic dispatch for CommonJS interop named imports.

const {
  unstable_scheduleCallback: scheduleCallback,
  unstable_NormalPriority: NormalPriority
} = Scheduler;
export function retainCache(cache) {
  if (!enableCache) {
    return;
  }

  cache.refCount++;
} // Cleanup a cache instance, potentially freeing it if there are no more references

export function releaseCache(cache) {
  if (!enableCache) {
    return;
  }

  cache.refCount--;

  if (cache.refCount === 0) {
    scheduleCallback(NormalPriority, () => {
      cache.controller.abort();
    });
  }
}
export function popCacheProvider(workInProgress, cache) {
  if (!enableCache) {
    return;
  }

  popProvider(CacheContext, workInProgress);
}