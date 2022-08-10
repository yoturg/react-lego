/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { NoLane, SyncLane, InputContinuousLane, DefaultLane, IdleLane } from './ReactFiberLane.new';
export const DiscreteEventPriority = SyncLane;
export const ContinuousEventPriority = InputContinuousLane;
export const DefaultEventPriority = DefaultLane;
export const IdleEventPriority = IdleLane;
let currentUpdatePriority = NoLane;
export function getCurrentUpdatePriority() {
  return currentUpdatePriority;
}
export function setCurrentUpdatePriority(newPriority) {
  currentUpdatePriority = newPriority;
}