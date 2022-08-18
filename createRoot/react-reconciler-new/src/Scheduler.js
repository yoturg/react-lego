/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
// This module only exists as an ESM wrapper around the external CommonJS
// Scheduler dependency. Notice that we're intentionally not using named imports
// because Rollup would use dynamic dispatch for CommonJS interop named imports.
// When we switch to ESM, we can delete this module.
import * as Scheduler from '../../scheduler';
export const getCurrentPriorityLevel = Scheduler.unstable_getCurrentPriorityLevel;