/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { DiscreteEventPriority as DiscreteEventPriority_new, ContinuousEventPriority as ContinuousEventPriority_new, DefaultEventPriority as DefaultEventPriority_new, IdleEventPriority as IdleEventPriority_new, getCurrentUpdatePriority as getCurrentUpdatePriority_new, setCurrentUpdatePriority as setCurrentUpdatePriority_new, runWithPriority as runWithPriority_new, isHigherEventPriority as isHigherEventPriority_new } from './ReactEventPriorities.new';
export const DiscreteEventPriority = DiscreteEventPriority_new;
export const ContinuousEventPriority = ContinuousEventPriority_new;
export const DefaultEventPriority = DefaultEventPriority_new;
export const IdleEventPriority = IdleEventPriority_new;
export function runWithPriority(priority, fn) {
  return runWithPriority_new(priority, fn);
}
export function getCurrentUpdatePriority() {
  return getCurrentUpdatePriority_new();
}
export function setCurrentUpdatePriority(priority) {
  return setCurrentUpdatePriority_new(priority);
}
export function isHigherEventPriority(a, b) {
  return isHigherEventPriority_new(a, b);
}