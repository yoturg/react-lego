/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { createRoot as createRootImpl } from './ReactDOMRoot';
import { batchedUpdates, discreteUpdates, flushSync as flushSyncWithoutWarningIfAlreadyRendering, attemptSynchronousHydration, attemptDiscreteHydration, attemptContinuousHydration, attemptHydrationAtCurrentPriority } from '../../../react-reconciler-new/src/ReactFiberReconciler';
import { runWithPriority, getCurrentUpdatePriority } from '../../../react-reconciler-new/src/ReactEventPriorities';
import { restoreControlledState } from './ReactDOMComponent';
import { setAttemptSynchronousHydration, setAttemptDiscreteHydration, setAttemptContinuousHydration, setAttemptHydrationAtCurrentPriority, setGetCurrentUpdatePriority, setAttemptHydrationAtPriority } from '../events/ReactDOMEventReplaying';
import { setBatchingImplementation } from '../events/ReactDOMUpdateBatching';
import { setRestoreImplementation } from '../events/ReactDOMControlledComponent';
setAttemptSynchronousHydration(attemptSynchronousHydration);
setAttemptDiscreteHydration(attemptDiscreteHydration);
setAttemptContinuousHydration(attemptContinuousHydration);
setAttemptHydrationAtCurrentPriority(attemptHydrationAtCurrentPriority);
setGetCurrentUpdatePriority(getCurrentUpdatePriority);
setAttemptHydrationAtPriority(runWithPriority);
setRestoreImplementation(restoreControlledState);
setBatchingImplementation(batchedUpdates, discreteUpdates, flushSyncWithoutWarningIfAlreadyRendering);

function createRoot(container, options) {
  return createRootImpl(container, options);
}

export { // Disabled behind disableLegacyReactDOMAPIs
// exposeConcurrentModeAPIs
createRoot };