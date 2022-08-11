/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { findCurrentHostFiber, findCurrentHostFiberWithNoPortals } from './ReactFiberTreeReflection';
import { get as getInstance } from '../../shared/ReactInstanceMap';
import { HostComponent, ClassComponent, HostRoot, SuspenseComponent } from './ReactWorkTags';
import { enableSchedulingProfiler } from '../../shared/ReactFeatureFlags';
import ReactSharedInternals from '../../shared/ReactSharedInternals';
import { getPublicInstance } from './ReactFiberHostConfig';
import { findCurrentUnmaskedContext, processChildContext, emptyContextObject, isContextProvider as isLegacyContextProvider } from './ReactFiberContext.new';
import { createFiberRoot } from './ReactFiberRoot.new';
import { isRootDehydrated } from './ReactFiberShellHydration';
import { injectInternals, markRenderScheduled } from './ReactFiberDevToolsHook.new';
import { requestEventTime, requestUpdateLane, scheduleUpdateOnFiber, scheduleInitialHydrationOnRoot, flushRoot, batchedUpdates, flushSync, isAlreadyRendering, flushControlled, deferredUpdates, discreteUpdates, flushPassiveEffects } from './ReactFiberWorkLoop.new';
import { enqueueConcurrentRenderForLane } from './ReactFiberConcurrentUpdates.new';
import { createUpdate, enqueueUpdate, entangleTransitions } from './ReactFiberClassUpdateQueue.new';
import { SyncLane, SelectiveHydrationLane, getHighestPriorityPendingLanes, higherPriorityLane } from './ReactFiberLane.new';
import { getCurrentUpdatePriority, runWithPriority } from './ReactEventPriorities.new';
import ReactVersion from '../../shared/ReactVersion';
export { registerMutableSourceForHydration } from './ReactMutableSource.new';
export { createPortal } from './ReactPortal';
export { createComponentSelector, createHasPseudoClassSelector, createRoleSelector, createTestNameSelector, createTextSelector, getFindAllNodesFailureDescription, findAllNodes, findBoundingRects, focusWithin, observeVisibleRects } from './ReactTestSelectors'; // 0 is PROD, 1 is DEV.
// Might add PROFILE later.

function getContextForSubtree(parentComponent) {
  if (!parentComponent) {
    return emptyContextObject;
  }

  const fiber = getInstance(parentComponent);
  const parentContext = findCurrentUnmaskedContext(fiber);

  if (fiber.tag === ClassComponent) {
    const Component = fiber.type;

    if (isLegacyContextProvider(Component)) {
      return processChildContext(fiber, Component, parentContext);
    }
  }

  return parentContext;
}

function findHostInstance(component) {
  const fiber = getInstance(component);

  if (fiber === undefined) {
    if (typeof component.render === 'function') {
      throw new Error('Unable to find node on an unmounted component.');
    } else {
      const keys = Object.keys(component).join(',');
      throw new Error(`Argument appears to not be a ReactComponent. Keys: ${keys}`);
    }
  }

  const hostFiber = findCurrentHostFiber(fiber);

  if (hostFiber === null) {
    return null;
  }

  return hostFiber.stateNode;
}

function findHostInstanceWithWarning(component, methodName) {
  return findHostInstance(component);
}

export function createContainer(containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks) {
  const hydrate = false;
  const initialChildren = null;
  return createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks);
}
export function createHydrationContainer(initialChildren, // TODO: Remove `callback` when we delete legacy mode.
callback, containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks) {
  const hydrate = true;
  const root = createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks); // TODO: Move this to FiberRoot constructor

  root.context = getContextForSubtree(null); // Schedule the initial render. In a hydration root, this is different from
  // a regular update because the initial render must match was was rendered
  // on the server.
  // NOTE: This update intentionally doesn't have a payload. We're only using
  // the update to schedule work on the root fiber (and, for legacy roots, to
  // enqueue the callback if one is provided).

  const current = root.current;
  const eventTime = requestEventTime();
  const lane = requestUpdateLane(current);
  const update = createUpdate(eventTime, lane);
  update.callback = callback !== undefined && callback !== null ? callback : null;
  enqueueUpdate(current, update, lane);
  scheduleInitialHydrationOnRoot(root, lane, eventTime);
  return root;
}
export function updateContainer(element, container, parentComponent, callback) {
  const current = container.current;
  const eventTime = requestEventTime();
  const lane = requestUpdateLane(current);

  if (enableSchedulingProfiler) {
    markRenderScheduled(lane);
  }

  const context = getContextForSubtree(parentComponent);

  if (container.context === null) {
    container.context = context;
  } else {
    container.pendingContext = context;
  }

  const update = createUpdate(eventTime, lane); // Caution: React DevTools currently depends on this property
  // being called "element".

  update.payload = {
    element
  };
  callback = callback === undefined ? null : callback;

  if (callback !== null) {
    update.callback = callback;
  }

  const root = enqueueUpdate(current, update, lane);

  if (root !== null) {
    scheduleUpdateOnFiber(root, current, lane, eventTime);
    entangleTransitions(root, current, lane);
  }

  return lane;
}
export { batchedUpdates, deferredUpdates, discreteUpdates, flushControlled, flushSync, isAlreadyRendering, flushPassiveEffects };
export function getPublicRootInstance(container) {
  const containerFiber = container.current;

  if (!containerFiber.child) {
    return null;
  }

  switch (containerFiber.child.tag) {
    case HostComponent:
      return getPublicInstance(containerFiber.child.stateNode);

    default:
      return containerFiber.child.stateNode;
  }
}
export function attemptSynchronousHydration(fiber) {
  switch (fiber.tag) {
    case HostRoot:
      {
        const root = fiber.stateNode;

        if (isRootDehydrated(root)) {
          // Flush the first scheduled "update".
          const lanes = getHighestPriorityPendingLanes(root);
          flushRoot(root, lanes);
        }

        break;
      }

    case SuspenseComponent:
      {
        flushSync(() => {
          const root = enqueueConcurrentRenderForLane(fiber, SyncLane);

          if (root !== null) {
            const eventTime = requestEventTime();
            scheduleUpdateOnFiber(root, fiber, SyncLane, eventTime);
          }
        }); // If we're still blocked after this, we need to increase
        // the priority of any promises resolving within this
        // boundary so that they next attempt also has higher pri.

        const retryLane = SyncLane;
        markRetryLaneIfNotHydrated(fiber, retryLane);
        break;
      }
  }
}

function markRetryLaneImpl(fiber, retryLane) {
  const suspenseState = fiber.memoizedState;

  if (suspenseState !== null && suspenseState.dehydrated !== null) {
    suspenseState.retryLane = higherPriorityLane(suspenseState.retryLane, retryLane);
  }
} // Increases the priority of thenables when they resolve within this boundary.


function markRetryLaneIfNotHydrated(fiber, retryLane) {
  markRetryLaneImpl(fiber, retryLane);
  const alternate = fiber.alternate;

  if (alternate) {
    markRetryLaneImpl(alternate, retryLane);
  }
}

export function attemptDiscreteHydration(fiber) {
  if (fiber.tag !== SuspenseComponent) {
    // We ignore HostRoots here because we can't increase
    // their priority and they should not suspend on I/O,
    // since you have to wrap anything that might suspend in
    // Suspense.
    return;
  }

  const lane = SyncLane;
  const root = enqueueConcurrentRenderForLane(fiber, lane);

  if (root !== null) {
    const eventTime = requestEventTime();
    scheduleUpdateOnFiber(root, fiber, lane, eventTime);
  }

  markRetryLaneIfNotHydrated(fiber, lane);
}
export function attemptContinuousHydration(fiber) {
  if (fiber.tag !== SuspenseComponent) {
    // We ignore HostRoots here because we can't increase
    // their priority and they should not suspend on I/O,
    // since you have to wrap anything that might suspend in
    // Suspense.
    return;
  }

  const lane = SelectiveHydrationLane;
  const root = enqueueConcurrentRenderForLane(fiber, lane);

  if (root !== null) {
    const eventTime = requestEventTime();
    scheduleUpdateOnFiber(root, fiber, lane, eventTime);
  }

  markRetryLaneIfNotHydrated(fiber, lane);
}
export function attemptHydrationAtCurrentPriority(fiber) {
  if (fiber.tag !== SuspenseComponent) {
    // We ignore HostRoots here because we can't increase
    // their priority other than synchronously flush it.
    return;
  }

  const lane = requestUpdateLane(fiber);
  const root = enqueueConcurrentRenderForLane(fiber, lane);

  if (root !== null) {
    const eventTime = requestEventTime();
    scheduleUpdateOnFiber(root, fiber, lane, eventTime);
  }

  markRetryLaneIfNotHydrated(fiber, lane);
}
export { getCurrentUpdatePriority, runWithPriority };
export { findHostInstance };
export { findHostInstanceWithWarning };
export function findHostInstanceWithNoPortals(fiber) {
  const hostFiber = findCurrentHostFiberWithNoPortals(fiber);

  if (hostFiber === null) {
    return null;
  }

  return hostFiber.stateNode;
}

let shouldErrorImpl = fiber => null;

export function shouldError(fiber) {
  return shouldErrorImpl(fiber);
}

let shouldSuspendImpl = fiber => false;

export function shouldSuspend(fiber) {
  return shouldSuspendImpl(fiber);
}
let overrideHookState = null;
let overrideHookStateDeletePath = null;
let overrideHookStateRenamePath = null;
let overrideProps = null;
let overridePropsDeletePath = null;
let overridePropsRenamePath = null;
let scheduleUpdate = null;
let setErrorHandler = null;
let setSuspenseHandler = null;

function findHostInstanceByFiber(fiber) {
  const hostFiber = findCurrentHostFiber(fiber);

  if (hostFiber === null) {
    return null;
  }

  return hostFiber.stateNode;
}

function emptyFindFiberByHostInstance(instance) {
  return null;
}

export function injectIntoDevTools(devToolsConfig) {
  const {
    findFiberByHostInstance
  } = devToolsConfig;
  const {
    ReactCurrentDispatcher
  } = ReactSharedInternals;
  return injectInternals({
    bundleType: devToolsConfig.bundleType,
    version: devToolsConfig.version,
    rendererPackageName: devToolsConfig.rendererPackageName,
    rendererConfig: devToolsConfig.rendererConfig,
    overrideHookState,
    overrideHookStateDeletePath,
    overrideHookStateRenamePath,
    overrideProps,
    overridePropsDeletePath,
    overridePropsRenamePath,
    setErrorHandler,
    setSuspenseHandler,
    scheduleUpdate,
    currentDispatcherRef: ReactCurrentDispatcher,
    findHostInstanceByFiber,
    findFiberByHostInstance: findFiberByHostInstance || emptyFindFiberByHostInstance,
    // React Refresh
    findHostInstancesForRefresh: null,
    scheduleRefresh: null,
    scheduleRoot: null,
    setRefreshHandler: null,
    // Enables DevTools to append owner stacks to error messages in DEV mode.
    getCurrentFiber: null,
    // Enables DevTools to detect reconciler version rather than renderer version
    // which may not match for third party renderers.
    reconcilerVersion: ReactVersion
  });
}