/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { enableCache } from '../../shared/ReactFeatureFlags'; // In environments without AbortController (e.g. tests)
// replace it with a lightweight shim that only has the features we use.

const AbortControllerLocal = enableCache ? typeof AbortController !== 'undefined' ? AbortController : function AbortControllerShim() {
  const listeners = [];
  const signal = this.signal = {
    aborted: false,
    addEventListener: (type, listener) => {
      listeners.push(listener);
    }
  };

  this.abort = () => {
    signal.aborted = true;
    listeners.forEach(listener => listener());
  };
} : null; // Intentionally not named imports because Rollup would
// use dynamic dispatch for CommonJS interop named imports.
// Creates a new empty Cache instance with a ref-count of 0. The caller is responsible
// for retaining the cache once it is in use (retainCache), and releasing the cache
// once it is no longer needed (releaseCache).

export function createCache() {
  if (!enableCache) {
    return null;
  }

  const cache = {
    controller: new AbortControllerLocal(),
    data: new Map(),
    refCount: 0
  };
  return cache;
}
export function retainCache(cache) {
  if (!enableCache) {
    return;
  }

  cache.refCount++;
} // Cleanup a cache instance, potentially freeing it if there are no more references