/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

/* eslint-disable react-internal/prod-error-codes */
import { flushSync, scheduleUpdateOnFiber, flushPassiveEffects } from './ReactFiberWorkLoop.old';
import { enqueueConcurrentRenderForLane } from './ReactFiberConcurrentUpdates.old';
import { updateContainer } from './ReactFiberReconciler.old';
import { emptyContextObject } from './ReactFiberContext.old';
import { SyncLane, NoTimestamp } from './ReactFiberLane.old';
import { ClassComponent, FunctionComponent, ForwardRef, HostComponent, HostPortal, HostRoot, MemoComponent, SimpleMemoComponent } from './ReactWorkTags';
import { REACT_FORWARD_REF_TYPE, REACT_MEMO_TYPE, REACT_LAZY_TYPE } from 'shared/ReactSymbols'; // Resolves type to a family.
// Used by React Refresh runtime through DevTools Global Hook.

let resolveFamily = null; // $FlowFixMe Flow gets confused by a WeakSet feature check below.

let failedBoundaries = null;
export const setRefreshHandler = handler => {};
export function resolveFunctionForHotReloading(type) {
  return type;
}
export function resolveClassForHotReloading(type) {
  // No implementation differences.
  return resolveFunctionForHotReloading(type);
}
export function resolveForwardRefForHotReloading(type) {
  return type;
}
export function isCompatibleFamilyForHotReloading(fiber, element) {
  return false;
}
export function markFailedErrorBoundaryForHotReloading(fiber) {}
export const scheduleRefresh = (root, update) => {};
export const scheduleRoot = (root, element) => {};

function scheduleFibersWithFamiliesRecursively(fiber, updatedFamilies, staleFamilies) {}

export const findHostInstancesForRefresh = (root, families) => {
  throw new Error('Did not expect findHostInstancesForRefresh to be called in production.');
};

function findHostInstancesForMatchingFibersRecursively(fiber, types, hostInstances) {}

function findHostInstancesForFiberShallowly(fiber, hostInstances) {}

function findChildHostInstancesForFiberShallowly(fiber, hostInstances) {
  return false;
}