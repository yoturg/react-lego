/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { createHostRootFiber } from './ReactFiber.new';
import { enableSuspenseCallback, enableCache, enableTransitionTracing } from '../../shared/ReactFeatureFlags';
import { initializeUpdateQueue } from './ReactFiberClassUpdateQueue.new';
import { createCache, retainCache } from './ReactFiberCacheComponent.new';
export function createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, // TODO: We have several of these arguments that are conceptually part of the
// host config, but because they are passed in at runtime, we have to thread
// them through the root constructor. Perhaps we should put them all into a
// single type, like a DynamicHostConfig that is defined by the renderer.
identifierPrefix, onRecoverableError, transitionCallbacks) {
  const root = new FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onRecoverableError);

  if (enableSuspenseCallback) {
    root.hydrationCallbacks = hydrationCallbacks;
  }

  if (enableTransitionTracing) {
    root.transitionCallbacks = transitionCallbacks;
  } // Cyclic construction. This cheats the type system right now because
  // stateNode is any.


  const uninitializedFiber = createHostRootFiber(tag, isStrictMode, concurrentUpdatesByDefaultOverride);
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  if (enableCache) {
    const initialCache = createCache();
    retainCache(initialCache); // The pooledCache is a fresh cache instance that is used temporarily
    // for newly mounted boundaries during a render. In general, the
    // pooledCache is always cleared from the root at the end of a render:
    // it is either released when render commits, or moved to an Offscreen
    // component if rendering suspends. Because the lifetime of the pooled
    // cache is distinct from the main memoizedState.cache, it must be
    // retained separately.

    root.pooledCache = initialCache;
    retainCache(initialCache);
    const initialState = {
      element: initialChildren,
      isDehydrated: hydrate,
      cache: initialCache
    };
    uninitializedFiber.memoizedState = initialState;
  } else {
    const initialState = {
      element: initialChildren,
      isDehydrated: hydrate,
      cache: null // not enabled yet

    };
    uninitializedFiber.memoizedState = initialState;
  }

  initializeUpdateQueue(uninitializedFiber);
  return root;
}