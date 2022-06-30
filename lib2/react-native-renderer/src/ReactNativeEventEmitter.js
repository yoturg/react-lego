/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

                                                                     
                                                                   
                                                                         
                                                                                 
                                                                     

import {registrationNameModules} from './legacy-events/EventPluginRegistry';
import {batchedUpdates} from './legacy-events/ReactGenericBatching';
import {runEventsInBatch} from './legacy-events/EventBatching';
import {plugins} from './legacy-events/EventPluginRegistry';
import getListeners from './ReactNativeGetListeners';
import accumulateInto from './legacy-events/accumulateInto';

import {getInstanceFromNode} from './ReactNativeComponentTree';

export {getListeners, registrationNameModules as registrationNames};

/**
 * Version of `ReactBrowserEventEmitter` that works on the receiving side of a
 * serialized worker boundary.
 */

// Shared default empty native event - conserve memory.
const EMPTY_NATIVE_EVENT = (({}     )                );

/**
 * Selects a subsequence of `Touch`es, without destroying `touches`.
 *
 * @param {Array<Touch>} touches Deserialized touch objects.
 * @param {Array<number>} indices Indices by which to pull subsequence.
 * @return {Array<Touch>} Subsequence of touch objects.
 */
const touchSubsequence = function(touches, indices) {
  const ret = [];
  for (let i = 0; i < indices.length; i++) {
    ret.push(touches[indices[i]]);
  }
  return ret;
};

/**
 * TODO: Pool all of this.
 *
 * Destroys `touches` by removing touch objects at indices `indices`. This is
 * to maintain compatibility with W3C touch "end" events, where the active
 * touches don't include the set that has just been "ended".
 *
 * @param {Array<Touch>} touches Deserialized touch objects.
 * @param {Array<number>} indices Indices to remove from `touches`.
 * @return {Array<Touch>} Subsequence of removed touch objects.
 */
const removeTouchesAtIndices = function(
  touches               ,
  indices               ,
)                {
  const rippedOut = [];
  // use an unsafe downcast to alias to nullable elements,
  // so we can delete and then compact.
  const temp                 = (touches            );
  for (let i = 0; i < indices.length; i++) {
    const index = indices[i];
    rippedOut.push(touches[index]);
    temp[index] = null;
  }
  let fillAt = 0;
  for (let j = 0; j < temp.length; j++) {
    const cur = temp[j];
    if (cur !== null) {
      temp[fillAt++] = cur;
    }
  }
  temp.length = fillAt;
  return rippedOut;
};

/**
 * Internal version of `receiveEvent` in terms of normalized (non-tag)
 * `rootNodeID`.
 *
 * @see receiveEvent.
 *
 * @param {rootNodeID} rootNodeID React root node ID that event occurred on.
 * @param {TopLevelType} topLevelType Top level type of event.
 * @param {?object} nativeEventParam Object passed from native.
 */
function _receiveRootNodeIDEvent(
  rootNodeID        ,
  topLevelType              ,
  nativeEventParam                 ,
) {
  const nativeEvent = nativeEventParam || EMPTY_NATIVE_EVENT;
  const inst = getInstanceFromNode(rootNodeID);

  let target = null;
  if (inst != null) {
    target = inst.stateNode;
  }

  batchedUpdates(function() {
    runExtractedPluginEventsInBatch(topLevelType, inst, nativeEvent, target);
  });
  // React Native doesn't use ReactControlledComponent but if it did, here's
  // where it would do it.
}

/**
 * Allows registered plugins an opportunity to extract events from top-level
 * native browser events.
 *
 * @return {*} An accumulation of synthetic events.
 * @internal
 */
function extractPluginEvents(
  topLevelType              ,
  targetInst              ,
  nativeEvent                ,
  nativeEventTarget                    ,
)                                                          {
  let events = null;
  const legacyPlugins = ((plugins     )                                  );
  for (let i = 0; i < legacyPlugins.length; i++) {
    // Not every plugin in the ordering may be loaded at runtime.
    const possiblePlugin                                     = legacyPlugins[i];
    if (possiblePlugin) {
      const extractedEvents = possiblePlugin.extractEvents(
        topLevelType,
        targetInst,
        nativeEvent,
        nativeEventTarget,
      );
      if (extractedEvents) {
        events = accumulateInto(events, extractedEvents);
      }
    }
  }
  return events;
}

function runExtractedPluginEventsInBatch(
  topLevelType              ,
  targetInst              ,
  nativeEvent                ,
  nativeEventTarget                    ,
) {
  const events = extractPluginEvents(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
  );
  runEventsInBatch(events);
}

/**
 * Publicly exposed method on module for native objc to invoke when a top
 * level event is extracted.
 * @param {rootNodeID} rootNodeID React root node ID that event occurred on.
 * @param {TopLevelType} topLevelType Top level type of event.
 * @param {object} nativeEventParam Object passed from native.
 */
export function receiveEvent(
  rootNodeID        ,
  topLevelType              ,
  nativeEventParam                ,
) {
  _receiveRootNodeIDEvent(rootNodeID, topLevelType, nativeEventParam);
}

/**
 * Simple multi-wrapper around `receiveEvent` that is intended to receive an
 * efficient representation of `Touch` objects, and other information that
 * can be used to construct W3C compliant `Event` and `Touch` lists.
 *
 * This may create dispatch behavior that differs than web touch handling. We
 * loop through each of the changed touches and receive it as a single event.
 * So two `touchStart`/`touchMove`s that occur simultaneously are received as
 * two separate touch event dispatches - when they arguably should be one.
 *
 * This implementation reuses the `Touch` objects themselves as the `Event`s
 * since we dispatch an event for each touch (though that might not be spec
 * compliant). The main purpose of reusing them is to save allocations.
 *
 * TODO: Dispatch multiple changed touches in one event. The bubble path
 * could be the first common ancestor of all the `changedTouches`.
 *
 * One difference between this behavior and W3C spec: cancelled touches will
 * not appear in `.touches`, or in any future `.touches`, though they may
 * still be "actively touching the surface".
 *
 * Web desktop polyfills only need to construct a fake touch event with
 * identifier 0, also abandoning traditional click handlers.
 */
export function receiveTouches(
  eventTopLevelType              ,
  touches               ,
  changedIndices               ,
) {
  const changedTouches =
    eventTopLevelType === 'topTouchEnd' ||
    eventTopLevelType === 'topTouchCancel'
      ? removeTouchesAtIndices(touches, changedIndices)
      : touchSubsequence(touches, changedIndices);

  for (let jj = 0; jj < changedTouches.length; jj++) {
    const touch = changedTouches[jj];
    // Touch objects can fulfill the role of `DOM` `Event` objects if we set
    // the `changedTouches`/`touches`. This saves allocations.
    touch.changedTouches = changedTouches;
    touch.touches = touches;
    const nativeEvent = touch;
    let rootNodeID = null;
    const target = nativeEvent.target;
    if (target !== null && target !== undefined) {
      if (target < 1) {
        if (__DEV__) {
          console.error(
            'A view is reporting that a touch occurred on tag zero.',
          );
        }
      } else {
        rootNodeID = target;
      }
    }
    // $FlowFixMe Shouldn't we *not* call it if rootNodeID is null?
    _receiveRootNodeIDEvent(rootNodeID, eventTopLevelType, nativeEvent);
  }
}
