/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { getCurrentPriorityLevel as getCurrentSchedulerPriorityLevel, IdlePriority as IdleSchedulerPriority, ImmediatePriority as ImmediateSchedulerPriority, LowPriority as LowSchedulerPriority, NormalPriority as NormalSchedulerPriority, UserBlockingPriority as UserBlockingSchedulerPriority } from '../../../react-reconciler-new/src/Scheduler';
import { DiscreteEventPriority, ContinuousEventPriority, DefaultEventPriority, IdleEventPriority } from '../../../react-reconciler-new/src/ReactEventPriorities'; // TODO: can we stop exporting these?

export let _enabled = true; // This is exported in FB builds for use by legacy FB layer infra.
// We'd like to remove this but it's not clear if this is safe.

export function createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags) {
  const eventPriority = getEventPriority(domEventName);
  let listenerWrapper;

  switch (eventPriority) {
    case DiscreteEventPriority:
      listenerWrapper = dispatchDiscreteEvent;
      break;

    case ContinuousEventPriority:
      listenerWrapper = dispatchContinuousEvent;
      break;

    case DefaultEventPriority:
    default:
      listenerWrapper = dispatchEvent;
      break;
  }

  return listenerWrapper.bind(null, domEventName, eventSystemFlags, targetContainer);
}
export let return_targetInst = null; // Returns a SuspenseInstance or Container if it's blocked.
// The return_targetInst field above is conceptually part of the return value.

export function getEventPriority(domEventName) {
  switch (domEventName) {
    // Used by SimpleEventPlugin:
    case 'cancel':
    case 'click':
    case 'close':
    case 'contextmenu':
    case 'copy':
    case 'cut':
    case 'auxclick':
    case 'dblclick':
    case 'dragend':
    case 'dragstart':
    case 'drop':
    case 'focusin':
    case 'focusout':
    case 'input':
    case 'invalid':
    case 'keydown':
    case 'keypress':
    case 'keyup':
    case 'mousedown':
    case 'mouseup':
    case 'paste':
    case 'pause':
    case 'play':
    case 'pointercancel':
    case 'pointerdown':
    case 'pointerup':
    case 'ratechange':
    case 'reset':
    case 'resize':
    case 'seeked':
    case 'submit':
    case 'touchcancel':
    case 'touchend':
    case 'touchstart':
    case 'volumechange': // Used by polyfills:
    // eslint-disable-next-line no-fallthrough

    case 'change':
    case 'selectionchange':
    case 'textInput':
    case 'compositionstart':
    case 'compositionend':
    case 'compositionupdate': // Only enableCreateEventHandleAPI:
    // eslint-disable-next-line no-fallthrough

    case 'beforeblur':
    case 'afterblur': // Not used by React but could be by user code:
    // eslint-disable-next-line no-fallthrough

    case 'beforeinput':
    case 'blur':
    case 'fullscreenchange':
    case 'focus':
    case 'hashchange':
    case 'popstate':
    case 'select':
    case 'selectstart':
      return DiscreteEventPriority;

    case 'drag':
    case 'dragenter':
    case 'dragexit':
    case 'dragleave':
    case 'dragover':
    case 'mousemove':
    case 'mouseout':
    case 'mouseover':
    case 'pointermove':
    case 'pointerout':
    case 'pointerover':
    case 'scroll':
    case 'toggle':
    case 'touchmove':
    case 'wheel': // Not used by React but could be by user code:
    // eslint-disable-next-line no-fallthrough

    case 'mouseenter':
    case 'mouseleave':
    case 'pointerenter':
    case 'pointerleave':
      return ContinuousEventPriority;

    case 'message':
      {
        // We might be in the Scheduler callback.
        // Eventually this mechanism will be replaced by a check
        // of the current priority on the native scheduler.
        const schedulerPriority = getCurrentSchedulerPriorityLevel();

        switch (schedulerPriority) {
          case ImmediateSchedulerPriority:
            return DiscreteEventPriority;

          case UserBlockingSchedulerPriority:
            return ContinuousEventPriority;

          case NormalSchedulerPriority:
          case LowSchedulerPriority:
            // TODO: Handle LowSchedulerPriority, somehow. Maybe the same lane as hydration.
            return DefaultEventPriority;

          case IdleSchedulerPriority:
            return IdleEventPriority;

          default:
            return DefaultEventPriority;
        }
      }

    default:
      return DefaultEventPriority;
  }
}