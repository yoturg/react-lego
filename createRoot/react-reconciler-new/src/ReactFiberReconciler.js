/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { createFiberRoot } from './ReactFiberRoot.new';
export {} from './ReactMutableSource.new';
export {} from './ReactPortal';
export {} from './ReactTestSelectors'; // 0 is PROD, 1 is DEV.
// Might add PROFILE later.

export function createContainer(containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks) {
  const hydrate = false;
  const initialChildren = null;
  return createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks);
}
export {}; // Increases the priority of thenables when they resolve within this boundary.

export {};
export {};
export {};