/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import ReactSharedInternals from 'shared/ReactSharedInternals';
let suppressWarning = false;
export function setSuppressWarning(newSuppressWarning) {} // In DEV, calls to console.warn and console.error get replaced
// by calls to these methods by a Babel plugin.
//
// In PROD (or in packages without access to React internals),
// they are left as they are instead.

export function warn(format, ...args) {}
export function error(format, ...args) {}

function printWarning(level, format, args) {}