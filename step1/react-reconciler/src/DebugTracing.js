/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { enableDebugTracing } from 'shared/ReactFeatureFlags';
const nativeConsole = console;
let nativeConsoleLog = null;
const pendingGroupArgs = [];
let printedGroupIndex = -1;

function formatLanes(laneOrLanes) {
  return '0b' + laneOrLanes.toString(2).padStart(31, '0');
}

function group(...groupArgs) {
  pendingGroupArgs.push(groupArgs);

  if (nativeConsoleLog === null) {
    nativeConsoleLog = nativeConsole.log;
    nativeConsole.log = log;
  }
}

function groupEnd() {
  pendingGroupArgs.pop();

  while (printedGroupIndex >= pendingGroupArgs.length) {
    nativeConsole.groupEnd();
    printedGroupIndex--;
  }

  if (pendingGroupArgs.length === 0) {
    nativeConsole.log = nativeConsoleLog;
    nativeConsoleLog = null;
  }
}

function log(...logArgs) {
  if (printedGroupIndex < pendingGroupArgs.length - 1) {
    for (let i = printedGroupIndex + 1; i < pendingGroupArgs.length; i++) {
      const groupArgs = pendingGroupArgs[i];
      nativeConsole.group(...groupArgs);
    }

    printedGroupIndex = pendingGroupArgs.length - 1;
  }

  if (typeof nativeConsoleLog === 'function') {
    nativeConsoleLog(...logArgs);
  } else {
    nativeConsole.log(...logArgs);
  }
}

const REACT_LOGO_STYLE = 'background-color: #20232a; color: #61dafb; padding: 0 2px;';
export function logCommitStarted(lanes) {}
export function logCommitStopped() {}
const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map; // $FlowFixMe: Flow cannot handle polymorphic WeakMaps

const wakeableIDs = new PossiblyWeakMap();
let wakeableID = 0;

function getWakeableID(wakeable) {
  if (!wakeableIDs.has(wakeable)) {
    wakeableIDs.set(wakeable, wakeableID++);
  }

  return wakeableIDs.get(wakeable);
}

export function logComponentSuspended(componentName, wakeable) {}
export function logLayoutEffectsStarted(lanes) {}
export function logLayoutEffectsStopped() {}
export function logPassiveEffectsStarted(lanes) {}
export function logPassiveEffectsStopped() {}
export function logRenderStarted(lanes) {}
export function logRenderStopped() {}
export function logForceUpdateScheduled(componentName, lane) {}
export function logStateUpdateScheduled(componentName, lane, payloadOrAction) {}