/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// This refers to a WWW module.
const warningWWW = require('warning');

let suppressWarning = false;
export function setSuppressWarning(newSuppressWarning) {}
export function warn(format, ...args) {}
export function error(format, ...args) {}

function printWarning(level, format, args) {}