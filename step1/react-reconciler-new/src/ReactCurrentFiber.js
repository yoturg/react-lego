/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import ReactSharedInternals from 'shared/ReactSharedInternals';
import { getStackByFiberInDevAndProd } from './ReactFiberComponentStack';
import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
const ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
export let current = null;
export let isRendering = false;
export function getCurrentFiberOwnerNameInDevOrNull() {
  return null;
}

function getCurrentFiberStackInDev() {
  return '';
}

export function resetCurrentFiber() {}
export function setCurrentFiber(fiber) {}
export function getCurrentFiber() {
  return null;
}
export function setIsRendering(rendering) {}
export function getIsRendering() {}