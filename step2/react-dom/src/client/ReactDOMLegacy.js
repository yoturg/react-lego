/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { markContainerAsRoot, unmarkContainerAsRoot } from './ReactDOMComponentTree';
import { listenToAllSupportedEvents } from '../events/DOMPluginEventSystem';
import { isValidContainerLegacy } from './ReactDOMRoot';
import { ELEMENT_NODE, COMMENT_NODE } from '../shared/HTMLNodeType';
import { createContainer, updateContainer, flushSync, getPublicRootInstance, findHostInstance } from 'react-reconciler/src/ReactFiberReconciler';
import { LegacyRoot } from 'react-reconciler/src/ReactRootTags';
import { has as hasInstance } from 'shared/ReactInstanceMap';

function noopOnRecoverableError() {// This isn't reachable because onRecoverableError isn't called in the
  // legacy API.
}

function legacyCreateRootFromDOMContainer(container, initialChildren, parentComponent, callback, isHydrationContainer) {
  // First clear any existing content.
  let rootSibling;

  while (rootSibling = container.lastChild) {
    container.removeChild(rootSibling);
  }

  const root = createContainer(container, LegacyRoot, null, // hydrationCallbacks
  false, // isStrictMode
  false, // concurrentUpdatesByDefaultOverride,
  '', // identifierPrefix
  noopOnRecoverableError, // onRecoverableError
  null // transitionCallbacks
  );
  container._reactRootContainer = root;
  markContainerAsRoot(root.current, container);
  const rootContainerElement = container.nodeType === COMMENT_NODE ? container.parentNode : container;
  listenToAllSupportedEvents(rootContainerElement); // Initial mount should not be batched.

  flushSync(() => {
    updateContainer(initialChildren, root, parentComponent, callback);
  });
  return root;
}

function legacyRenderSubtreeIntoContainer(parentComponent, children, container, forceHydrate, callback) {
  const maybeRoot = container._reactRootContainer;
  let root;

  if (!maybeRoot) {
    // Initial mount
    root = legacyCreateRootFromDOMContainer(container, children, parentComponent, callback, forceHydrate);
  } else {
    root = maybeRoot;

    if (typeof callback === 'function') {
      const originalCallback = callback;

      callback = function () {
        const instance = getPublicRootInstance(root);
        originalCallback.call(instance);
      };
    } // Update


    updateContainer(children, root, parentComponent, callback);
  }

  return getPublicRootInstance(root);
}

export function findDOMNode(componentOrElement) {
  if (componentOrElement == null) {
    return null;
  }

  if (componentOrElement.nodeType === ELEMENT_NODE) {
    return componentOrElement;
  }

  return findHostInstance(componentOrElement);
}
export function hydrate(element, container, callback) {
  if (!isValidContainerLegacy(container)) {
    throw new Error('Target container is not a DOM element.');
  } // TODO: throw or warn if we couldn't hydrate?


  return legacyRenderSubtreeIntoContainer(null, element, container, true, callback);
}
export function render(element, container, callback) {
  return legacyRenderSubtreeIntoContainer(null, element, container, false, callback);
}
export function unstable_renderSubtreeIntoContainer(parentComponent, element, containerNode, callback) {
  if (!isValidContainerLegacy(containerNode)) {
    throw new Error('Target container is not a DOM element.');
  }

  if (parentComponent == null || !hasInstance(parentComponent)) {
    throw new Error('parentComponent must be a valid React Component');
  }

  return legacyRenderSubtreeIntoContainer(parentComponent, element, containerNode, false, callback);
}
export function unmountComponentAtNode(container) {
  if (!isValidContainerLegacy(container)) {
    throw new Error('unmountComponentAtNode(...): Target container is not a DOM element.');
  }

  if (container._reactRootContainer) {
    // Unmount should not be batched.
    flushSync(() => {
      legacyRenderSubtreeIntoContainer(null, null, container, false, () => {
        // $FlowFixMe This should probably use `delete container._reactRootContainer`
        container._reactRootContainer = null;
        unmarkContainerAsRoot(container);
      });
    }); // If you call unmountComponentAtNode twice in quick succession, you'll
    // get `true` twice. That's probably fine?

    return true;
  } else {
    return false;
  }
}