/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { enableTransitionTracing } from '../../shared/ReactFeatureFlags';
import { createCursor, pop } from './ReactFiberStack.new';
export function processTransitionCallbacks(pendingTransitions, endTime, callbacks) {
  if (enableTransitionTracing) {
    if (pendingTransitions !== null) {
      const transitionStart = pendingTransitions.transitionStart;

      if (transitionStart !== null) {
        transitionStart.forEach(transition => {
          if (callbacks.onTransitionStart != null) {
            callbacks.onTransitionStart(transition.transitionName, transition.startTime);
          }
        });
      }

      const markerComplete = pendingTransitions.markerComplete;

      if (markerComplete !== null) {
        markerComplete.forEach(transition => {
          if (callbacks.onMarkerComplete != null) {
            callbacks.onMarkerComplete(transition.transitionName, transition.markerName, transition.startTime, endTime);
          }
        });
      }

      const transitionComplete = pendingTransitions.transitionComplete;

      if (transitionComplete !== null) {
        transitionComplete.forEach(transition => {
          if (callbacks.onTransitionComplete != null) {
            callbacks.onTransitionComplete(transition.transitionName, transition.startTime, endTime);
          }
        });
      }
    }
  }
} // For every tracing marker, store a pointer to it. We will later access it
// to get the set of suspense boundaries that need to resolve before the
// tracing marker can be logged as complete
// This code lives separate from the ReactFiberTransition code because
// we push and pop on the tracing marker, not the suspense boundary

const tracingMarkerStack = createCursor(null);
export function popTracingMarker(workInProgress) {
  if (enableTransitionTracing) {
    pop(tracingMarkerStack, workInProgress);
  }
}