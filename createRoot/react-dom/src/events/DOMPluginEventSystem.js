/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { allNativeEvents } from './EventRegistry';
import { IS_CAPTURE_PHASE } from './EventSystemFlags';
import { passiveBrowserEventsSupported } from './checkPassiveEvents';
import { enableLegacyFBSupport } from '../../../shared/ReactFeatureFlags';
import { DOCUMENT_NODE } from '../shared/HTMLNodeType';
import { createEventListenerWrapperWithPriority } from './ReactDOMEventListener';
import { removeEventListener, addEventCaptureListener, addEventBubbleListener, addEventBubbleListenerWithPassiveFlag, addEventCaptureListenerWithPassiveFlag } from './EventListener';
import * as BeforeInputEventPlugin from './plugins/BeforeInputEventPlugin';
import * as ChangeEventPlugin from './plugins/ChangeEventPlugin';
import * as EnterLeaveEventPlugin from './plugins/EnterLeaveEventPlugin';
import * as SelectEventPlugin from './plugins/SelectEventPlugin';
import * as SimpleEventPlugin from './plugins/SimpleEventPlugin'; // TODO: remove top-level side effect.

SimpleEventPlugin.registerEvents();
EnterLeaveEventPlugin.registerEvents();
ChangeEventPlugin.registerEvents();
SelectEventPlugin.registerEvents();
BeforeInputEventPlugin.registerEvents();
export function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
  let eventSystemFlags = 0;

  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }

  addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener);
} // This is only used by createEventHandle when the
// target is not a DOM element. E.g. window.

const listeningMarker = '_reactListening' + Math.random().toString(36).slice(2);
export function listenToAllSupportedEvents(rootContainerElement) {
  if (!rootContainerElement[listeningMarker]) {
    rootContainerElement[listeningMarker] = true;
    allNativeEvents.forEach(domEventName => {
      // We handle selectionchange separately because it
      // doesn't bubble and needs to be on the document.
      if (domEventName !== 'selectionchange') {
        if (!nonDelegatedEvents.has(domEventName)) {
          listenToNativeEvent(domEventName, false, rootContainerElement);
        }

        listenToNativeEvent(domEventName, true, rootContainerElement);
      }
    });
    const ownerDocument = rootContainerElement.nodeType === DOCUMENT_NODE ? rootContainerElement : rootContainerElement.ownerDocument;

    if (ownerDocument !== null) {
      // The selectionchange event also needs deduplication
      // but it is attached to the document.
      if (!ownerDocument[listeningMarker]) {
        ownerDocument[listeningMarker] = true;
        listenToNativeEvent('selectionchange', false, ownerDocument);
      }
    }
  }
}

function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener, isDeferredListenerForLegacyFBSupport) {
  let listener = createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags); // If passive option is not supported, then the event will be
  // active and not passive.

  let isPassiveListener = undefined;

  if (passiveBrowserEventsSupported) {
    // Browsers introduced an intervention, making these events
    // passive by default on document. React doesn't bind them
    // to document anymore, but changing this now would undo
    // the performance wins from the change. So we emulate
    // the existing behavior manually on the roots now.
    // https://github.com/facebook/react/issues/19651
    if (domEventName === 'touchstart' || domEventName === 'touchmove' || domEventName === 'wheel') {
      isPassiveListener = true;
    }
  }

  targetContainer = enableLegacyFBSupport && isDeferredListenerForLegacyFBSupport ? targetContainer.ownerDocument : targetContainer;
  let unsubscribeListener; // When legacyFBSupport is enabled, it's for when we
  // want to add a one time event listener to a container.
  // This should only be used with enableLegacyFBSupport
  // due to requirement to provide compatibility with
  // internal FB www event tooling. This works by removing
  // the event listener as soon as it is invoked. We could
  // also attempt to use the {once: true} param on
  // addEventListener, but that requires support and some
  // browsers do not support this today, and given this is
  // to support legacy code patterns, it's likely they'll
  // need support for such browsers.

  if (enableLegacyFBSupport && isDeferredListenerForLegacyFBSupport) {
    const originalListener = listener;

    listener = function (...p) {
      removeEventListener(targetContainer, domEventName, unsubscribeListener, isCapturePhaseListener);
      return originalListener.apply(this, p);
    };
  } // TODO: There are too many combinations here. Consolidate them.


  if (isCapturePhaseListener) {
    if (isPassiveListener !== undefined) {
      unsubscribeListener = addEventCaptureListenerWithPassiveFlag(targetContainer, domEventName, listener, isPassiveListener);
    } else {
      unsubscribeListener = addEventCaptureListener(targetContainer, domEventName, listener);
    }
  } else {
    if (isPassiveListener !== undefined) {
      unsubscribeListener = addEventBubbleListenerWithPassiveFlag(targetContainer, domEventName, listener, isPassiveListener);
    } else {
      unsubscribeListener = addEventBubbleListener(targetContainer, domEventName, listener);
    }
  }
}
/**
 * Return the lowest common ancestor of A and B, or null if they are in
 * different trees.
 */
// We should only use this function for:
// - EnterLeaveEventPlugin
// This is because we only process this plugin
// in the bubble phase, so we need to accumulate two
// phase event listeners.