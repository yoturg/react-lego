/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

/* eslint-disable react-internal/prod-error-codes */
// Resolves type to a family.
// Used by React Refresh runtime through DevTools Global Hook.
// $FlowFixMe Flow gets confused by a WeakSet feature check below.
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
export const findHostInstancesForRefresh = (root, families) => {
  throw new Error('Did not expect findHostInstancesForRefresh to be called in production.');
};