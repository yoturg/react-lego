/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
// import type {DevToolsProfilingHooks} from 'react-devtools-shared/src/backend/types';
// TODO: This import doesn't work because the DevTools depend on the DOM version of React
// and to properly type check against DOM React we can't also type check again non-DOM
// React which this hook might be in.
import { enableSchedulingProfiler } from '../../shared/ReactFeatureFlags';
let injectedProfilingHooks = null;
export const isDevToolsPresent = typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined'; // Profiler API hooks

export function markRenderScheduled(lane) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderScheduled === 'function') {
      injectedProfilingHooks.markRenderScheduled(lane);
    }
  }
}