/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
'use strict';

import { createRoot as createRootImpl, hydrateRoot as hydrateRootImpl } from './';
export function createRoot(container, options) {
  try {
    return createRootImpl(container, options);
  } finally {}
}
export function hydrateRoot(container, children, options) {
  try {
    return hydrateRootImpl(container, children, options);
  } finally {}
}