/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
// TODO: Ideally these types would be opaque but that doesn't work well with
// our reconciler fork infra, since these leak into non-reconciler packages.
import { clz32 } from './clz32'; // Lane values below should be kept in sync with getLabelForLane(), used by react-devtools-timeline.
// If those values are changed that package should be rebuilt and redeployed.

export const TotalLanes = 31;
export const NoLanes =
/*                        */
0b0000000000000000000000000000000;
export const NoLane =
/*                          */
0b0000000000000000000000000000000;
export const SyncLane =
/*                        */
0b0000000000000000000000000000001;
export const InputContinuousHydrationLane =
/*    */
0b0000000000000000000000000000010;
export const InputContinuousLane =
/*             */
0b0000000000000000000000000000100;
export const DefaultHydrationLane =
/*            */
0b0000000000000000000000000001000;
export const DefaultLane =
/*                     */
0b0000000000000000000000000010000;
const RetryLane1 =
/*                             */
0b0000000010000000000000000000000;
export const SomeRetryLane = RetryLane1;
export const SelectiveHydrationLane =
/*          */
0b0001000000000000000000000000000;
export const IdleHydrationLane =
/*               */
0b0010000000000000000000000000000;
export const IdleLane =
/*                        */
0b0100000000000000000000000000000;
export const OffscreenLane =
/*                   */
0b1000000000000000000000000000000; // This function is used for the experimental timeline (react-devtools-timeline)
// It should be kept in sync with the Lanes values above.

export const NoTimestamp = -1;

function pickArbitraryLaneIndex(lanes) {
  return 31 - clz32(lanes);
}

function laneToIndex(lane) {
  return pickArbitraryLaneIndex(lane);
}

export function mergeLanes(a, b) {
  return a | b;
}
export function markHiddenUpdate(root, update, lane) {
  const index = laneToIndex(lane);
  const hiddenUpdates = root.hiddenUpdates;
  const hiddenUpdatesForLane = hiddenUpdates[index];

  if (hiddenUpdatesForLane === null) {
    hiddenUpdates[index] = [update];
  } else {
    hiddenUpdatesForLane.push(update);
  }

  update.lane = lane | OffscreenLane;
}