/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { get as getInstance } from '../../shared/ReactInstanceMap';
import { HostComponent, ClassComponent } from './ReactWorkTags';
import { enableSchedulingProfiler } from '../../shared/ReactFeatureFlags';
import { getPublicInstance } from './ReactFiberHostConfig';
import { findCurrentUnmaskedContext, processChildContext, emptyContextObject, isContextProvider as isLegacyContextProvider } from './ReactFiberContext.new';
import { createFiberRoot } from './ReactFiberRoot.new';
import { markRenderScheduled } from './ReactFiberDevToolsHook.new';
import { requestEventTime, requestUpdateLane, scheduleUpdateOnFiber, flushSync } from './ReactFiberWorkLoop.new';
import { createUpdate, enqueueUpdate, entangleTransitions } from './ReactFiberClassUpdateQueue.new';
export {} from './ReactMutableSource.new';
export {} from './ReactPortal';
export {} from './ReactTestSelectors'; // 0 is PROD, 1 is DEV.
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

export function createContainer(containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks) {
  const hydrate = false;
  const initialChildren = null;
  return createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks);
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
export { flushSync };
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
export {};
export {};
export {};