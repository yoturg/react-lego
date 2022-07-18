/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
export function logCommitStarted(lanes) {}
export function logCommitStopped() {} // $FlowFixMe: Flow cannot handle polymorphic WeakMaps

export function logComponentSuspended(componentName, wakeable) {}
export function logLayoutEffectsStarted(lanes) {}
export function logLayoutEffectsStopped() {}
export function logPassiveEffectsStarted(lanes) {}
export function logPassiveEffectsStopped() {}
export function logRenderStarted(lanes) {}
export function logRenderStopped() {}
export function logForceUpdateScheduled(componentName, lane) {}
export function logStateUpdateScheduled(componentName, lane, payloadOrAction) {}