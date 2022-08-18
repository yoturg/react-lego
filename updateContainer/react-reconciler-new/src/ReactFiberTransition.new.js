/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { enableCache, enableTransitionTracing } from '../../shared/ReactFeatureFlags';
import { createCursor, pop } from './ReactFiberStack.new'; // When retrying a Suspense/Offscreen boundary, we restore the cache that was
// used during the previous render by placing it here, on the stack.

const resumedCache = createCursor(null); // During the render/synchronous commit phase, we don't actually process the
// transitions. Therefore, we want to lazily combine transitions. Instead of
// comparing the arrays of transitions when we combine them and storing them
// and filtering out the duplicates, we will instead store the unprocessed transitions
// in an array and actually filter them in the passive phase.

const transitionStack = createCursor(null);
export function popRootTransition(workInProgress, root, renderLanes) {
  if (enableTransitionTracing) {
    pop(transitionStack, workInProgress);
  }
}
export function popTransition(workInProgress, current) {
  if (current !== null) {
    if (enableTransitionTracing) {
      pop(transitionStack, workInProgress);
    }

    if (enableCache) {
      pop(resumedCache, workInProgress);
    }
  }
}