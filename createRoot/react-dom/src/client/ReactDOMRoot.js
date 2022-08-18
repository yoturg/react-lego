/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { queueExplicitHydrationTarget } from '../events/ReactDOMEventReplaying';
import { markContainerAsRoot, unmarkContainerAsRoot } from './ReactDOMComponentTree';
import { listenToAllSupportedEvents } from '../events/DOMPluginEventSystem';
import { ELEMENT_NODE, COMMENT_NODE, DOCUMENT_NODE, DOCUMENT_FRAGMENT_NODE } from '../shared/HTMLNodeType';
import { createContainer, updateContainer, flushSync } from '../../../react-reconciler-new/src/ReactFiberReconciler';
import { ConcurrentRoot } from '../../../react-reconciler-new/src/ReactRootTags';
import { allowConcurrentByDefault, disableCommentsAsDOMContainers } from '../../../react-reconciler-new/ReactFeatureFlags';
/* global reportError */

const defaultOnRecoverableError = typeof reportError === 'function' ? // In modern browsers, reportError will dispatch an error event,
// emulating an uncaught JavaScript error.
reportError : error => {
  // In older browsers and test environments, fallback to console.error.
  // eslint-disable-next-line react-internal/no-production-logging
  console['error'](error);
};

function ReactDOMRoot(internalRoot) {
  this._internalRoot = internalRoot;
}

ReactDOMHydrationRoot.prototype.render = ReactDOMRoot.prototype.render = function (children) {
  const root = this._internalRoot;

  if (root === null) {
    throw new Error('Cannot update an unmounted root.');
  }

  updateContainer(children, root, null, null);
};

ReactDOMHydrationRoot.prototype.unmount = ReactDOMRoot.prototype.unmount = function () {
  const root = this._internalRoot;

  if (root !== null) {
    this._internalRoot = null;
    const container = root.containerInfo;
    flushSync(() => {
      updateContainer(null, root, null, null);
    });
    unmarkContainerAsRoot(container);
  }
};

export function createRoot(container, options) {
  if (!isValidContainer(container)) {
    throw new Error('createRoot(...): Target container is not a DOM element.');
  }

  warnIfReactDOMContainerInDEV(container);
  let isStrictMode = false;
  let concurrentUpdatesByDefaultOverride = false;
  let identifierPrefix = '';
  let onRecoverableError = defaultOnRecoverableError;
  let transitionCallbacks = null;

  if (options !== null && options !== undefined) {
    if (options.unstable_strictMode === true) {
      isStrictMode = true;
    }

    if (allowConcurrentByDefault && options.unstable_concurrentUpdatesByDefault === true) {
      concurrentUpdatesByDefaultOverride = true;
    }

    if (options.identifierPrefix !== undefined) {
      identifierPrefix = options.identifierPrefix;
    }

    if (options.onRecoverableError !== undefined) {
      onRecoverableError = options.onRecoverableError;
    }

    if (options.transitionCallbacks !== undefined) {
      transitionCallbacks = options.transitionCallbacks;
    }
  }

  const root = createContainer(container, ConcurrentRoot, null, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks);
  markContainerAsRoot(root.current, container);
  const rootContainerElement = container.nodeType === COMMENT_NODE ? container.parentNode : container;
  listenToAllSupportedEvents(rootContainerElement);
  return new ReactDOMRoot(root);
}

function ReactDOMHydrationRoot(internalRoot) {
  this._internalRoot = internalRoot;
}

function scheduleHydration(target) {
  if (target) {
    queueExplicitHydrationTarget(target);
  }
}

ReactDOMHydrationRoot.prototype.unstable_scheduleHydration = scheduleHydration;
export function isValidContainer(node) {
  return !!(node && (node.nodeType === ELEMENT_NODE || node.nodeType === DOCUMENT_NODE || node.nodeType === DOCUMENT_FRAGMENT_NODE || !disableCommentsAsDOMContainers && node.nodeType === COMMENT_NODE && node.nodeValue === ' react-mount-point-unstable '));
} // TODO: Remove this function which also includes comment nodes.
// We only use it in places that are currently more relaxed.

function warnIfReactDOMContainerInDEV(container) {}