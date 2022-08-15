/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { NoLane, getHighestPriorityLane, includesNonIdleWork } from './ReactFiberLane.new';
let currentUpdatePriority = NoLane;
export function getCurrentUpdatePriority() {
  return currentUpdatePriority;
}
export function setCurrentUpdatePriority(newPriority) {
  currentUpdatePriority = newPriority;
}
export function lowerEventPriority(a, b) {
  return a === 0 || a > b ? a : b;
}
export function isHigherEventPriority(a, b) {
  return a !== 0 && a < b;
}
export function lanesToEventPriority(lanes) {
  const lane = getHighestPriorityLane(lanes);

  if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return DiscreteEventPriority;
  }

  if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority;
  }

  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority;
  }

  return IdleEventPriority;
}