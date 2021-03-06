/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { findDOMNode, render, hydrate, unstable_renderSubtreeIntoContainer, unmountComponentAtNode } from './ReactDOMLegacy';
import { createRoot as createRootImpl, hydrateRoot as hydrateRootImpl, isValidContainer } from './ReactDOMRoot';
import { createEventHandle } from './ReactDOMEventHandle';
import { batchedUpdates, discreteUpdates, flushSync as flushSyncWithoutWarningIfAlreadyRendering, flushControlled, attemptSynchronousHydration, attemptDiscreteHydration, attemptContinuousHydration, attemptHydrationAtCurrentPriority } from '../../../react-reconciler-new/src/ReactFiberReconciler';
import { runWithPriority, getCurrentUpdatePriority } from '../../../react-reconciler-new/src/ReactEventPriorities';
import { createPortal as createPortalImpl } from '../../../react-reconciler-new/src/ReactPortal';
import ReactVersion from '../../../shared/ReactVersion';
import { enableNewReconciler } from '../../../shared/ReactFeatureFlags';
import { getInstanceFromNode, getNodeFromInstance, getFiberCurrentPropsFromNode } from './ReactDOMComponentTree';
import { restoreControlledState } from './ReactDOMComponent';
import { setAttemptSynchronousHydration, setAttemptDiscreteHydration, setAttemptContinuousHydration, setAttemptHydrationAtCurrentPriority, setGetCurrentUpdatePriority, setAttemptHydrationAtPriority } from '../events/ReactDOMEventReplaying';
import { setBatchingImplementation } from '../events/ReactDOMUpdateBatching';
import { setRestoreImplementation, enqueueStateRestore, restoreStateIfNeeded } from '../events/ReactDOMControlledComponent';
setAttemptSynchronousHydration(attemptSynchronousHydration);
setAttemptDiscreteHydration(attemptDiscreteHydration);
setAttemptContinuousHydration(attemptContinuousHydration);
setAttemptHydrationAtCurrentPriority(attemptHydrationAtCurrentPriority);
setGetCurrentUpdatePriority(getCurrentUpdatePriority);
setAttemptHydrationAtPriority(runWithPriority);
setRestoreImplementation(restoreControlledState);
setBatchingImplementation(batchedUpdates, discreteUpdates, flushSyncWithoutWarningIfAlreadyRendering);

function createPortal(children, container, key = null) {
  if (!isValidContainer(container)) {
    throw new Error('Target container is not a DOM element.');
  } // TODO: pass ReactDOM portal implementation as third argument
  // $FlowFixMe The Flow type is opaque but there's no way to actually create it.


  return createPortalImpl(children, container, null, key);
}

function renderSubtreeIntoContainer(parentComponent, element, containerNode, callback) {
  return unstable_renderSubtreeIntoContainer(parentComponent, element, containerNode, callback);
}

const Internals = {
  usingClientEntryPoint: false,
  // Keep in sync with ReactTestUtils.js.
  // This is an array for better minification.
  Events: [getInstanceFromNode, getNodeFromInstance, getFiberCurrentPropsFromNode, enqueueStateRestore, restoreStateIfNeeded, batchedUpdates]
};

function createRoot(container, options) {
  return createRootImpl(container, options);
}

function hydrateRoot(container, initialChildren, options) {
  return hydrateRootImpl(container, initialChildren, options);
} // Overload the definition to the two valid signatures.
// Warning, this opts-out of checking the function body.
// eslint-disable-next-line no-redeclare
// eslint-disable-next-line no-redeclare


function flushSync(fn) {
  return flushSyncWithoutWarningIfAlreadyRendering(fn);
}

export { createPortal, batchedUpdates as unstable_batchedUpdates, flushSync, Internals as __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, ReactVersion as version, // Disabled behind disableLegacyReactDOMAPIs
findDOMNode, hydrate, render, unmountComponentAtNode, // exposeConcurrentModeAPIs
createRoot, hydrateRoot, flushControlled as unstable_flushControlled, // Disabled behind disableUnstableRenderSubtreeIntoContainer
renderSubtreeIntoContainer as unstable_renderSubtreeIntoContainer, // enableCreateEventHandleAPI
createEventHandle as unstable_createEventHandle, // TODO: Remove this once callers migrate to alternatives.
// This should only be used by React internals.
runWithPriority as unstable_runWithPriority };
export const unstable_isNewReconciler = enableNewReconciler;