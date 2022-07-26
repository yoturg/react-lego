/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import isCustomComponent from './isCustomComponent';

const warnUnknownProperties = function (type, props, eventRegistry) {};

export function validateProperties(type, props, eventRegistry) {
  if (isCustomComponent(type, props)) {
    return;
  }

  warnUnknownProperties(type, props, eventRegistry);
}