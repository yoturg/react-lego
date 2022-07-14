/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { resetCurrentFiber as resetCurrentDebugFiberInDEV, setCurrentFiber as setCurrentDebugFiberInDEV } from './ReactCurrentFiber';
import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
import { StrictLegacyMode } from './ReactTypeOfMode';
const ReactStrictModeWarnings = {
  recordUnsafeLifecycleWarnings(fiber, instance) {},

  flushPendingUnsafeLifecycleWarnings() {},

  recordLegacyContextWarning(fiber, instance) {},

  flushLegacyContextWarning() {},

  discardPendingWarnings() {}

};
export default ReactStrictModeWarnings;