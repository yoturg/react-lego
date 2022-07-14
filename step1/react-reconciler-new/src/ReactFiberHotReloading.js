/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { enableNewReconciler } from 'shared/ReactFeatureFlags';
import { setRefreshHandler as setRefreshHandler_old, resolveFunctionForHotReloading as resolveFunctionForHotReloading_old, resolveClassForHotReloading as resolveClassForHotReloading_old, resolveForwardRefForHotReloading as resolveForwardRefForHotReloading_old, isCompatibleFamilyForHotReloading as isCompatibleFamilyForHotReloading_old, markFailedErrorBoundaryForHotReloading as markFailedErrorBoundaryForHotReloading_old, scheduleRefresh as scheduleRefresh_old, scheduleRoot as scheduleRoot_old, findHostInstancesForRefresh as findHostInstancesForRefresh_old } from './ReactFiberHotReloading.old';
import { setRefreshHandler as setRefreshHandler_new, resolveFunctionForHotReloading as resolveFunctionForHotReloading_new, resolveClassForHotReloading as resolveClassForHotReloading_new, resolveForwardRefForHotReloading as resolveForwardRefForHotReloading_new, isCompatibleFamilyForHotReloading as isCompatibleFamilyForHotReloading_new, markFailedErrorBoundaryForHotReloading as markFailedErrorBoundaryForHotReloading_new, scheduleRefresh as scheduleRefresh_new, scheduleRoot as scheduleRoot_new, findHostInstancesForRefresh as findHostInstancesForRefresh_new } from './ReactFiberHotReloading.new';
export const setRefreshHandler = setRefreshHandler_new;
export const resolveFunctionForHotReloading = resolveFunctionForHotReloading_new;
export const resolveClassForHotReloading = resolveClassForHotReloading_new;
export const resolveForwardRefForHotReloading = resolveForwardRefForHotReloading_new;
export const isCompatibleFamilyForHotReloading = isCompatibleFamilyForHotReloading_new;
export const markFailedErrorBoundaryForHotReloading = markFailedErrorBoundaryForHotReloading_new;
export const scheduleRefresh = scheduleRefresh_new;
export const scheduleRoot = scheduleRoot_new;
export const findHostInstancesForRefresh = findHostInstancesForRefresh_new;