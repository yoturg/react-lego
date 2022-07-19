/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
// This exists to avoid circular dependency between ReactDOMEventReplaying
// and DOMPluginEventSystem.
let currentReplayingEvent = null;
export function setReplayingEvent(event) {
  currentReplayingEvent = event;
}
export function resetReplayingEvent() {
  currentReplayingEvent = null;
}
export function isReplayingEvent(event) {
  return event === currentReplayingEvent;
}