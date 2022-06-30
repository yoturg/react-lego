/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import ReactSharedInternals from 'shared/ReactSharedInternals';
import { warnsIfNotActing } from './ReactFiberHostConfig';
const {
  ReactCurrentActQueue
} = ReactSharedInternals;
export function isLegacyActEnvironment(fiber) {
  return false;
}
export function isConcurrentActEnvironment() {
  return false;
}