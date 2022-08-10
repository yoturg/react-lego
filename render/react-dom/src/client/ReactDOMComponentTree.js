/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
const randomKey = Math.random().toString(36).slice(2);
const internalContainerInstanceKey = '__reactContainer$' + randomKey;
export function markContainerAsRoot(hostRoot, node) {
  node[internalContainerInstanceKey] = hostRoot;
}