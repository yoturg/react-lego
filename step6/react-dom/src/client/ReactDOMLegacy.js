/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { markContainerAsRoot } from './ReactDOMComponentTree';
import { listenToAllSupportedEvents } from '../events/DOMPluginEventSystem';
import { COMMENT_NODE } from '../shared/HTMLNodeType';
import { createContainer, updateContainer, flushSync, getPublicRootInstance } from '../../../react-reconciler-new/src/ReactFiberReconciler';
import { LegacyRoot } from '../../../react-reconciler-new/src/ReactRootTags';

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

export function render(element, container, callback) {
  return legacyRenderSubtreeIntoContainer(null, element, container, false, callback);
}