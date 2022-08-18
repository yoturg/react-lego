/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { push, pop } from './ReactFiberStack.new'; // The Suspense Context is split into two parts. The lower bits is
// inherited deeply down the subtree. The upper bits only affect
// this immediate suspense boundary and gets reset each new
// boundary or suspense list.

const SubtreeSuspenseContextMask = 0b01; // Subtree Flags:
// InvisibleParentSuspenseContext indicates that one of our parent Suspense
// boundaries is not currently showing visible main content.
// Either because it is already showing a fallback or is not mounted at all.
// We can use this to determine if it is desirable to trigger a fallback at
// the parent. If not, then we might need to trigger undesirable boundaries
// and/or suspend the commit to avoid hiding the parent content.

export function hasSuspenseContext(parentContext, flag) {
  return (parentContext & flag) !== 0;
}
export function setDefaultShallowSuspenseContext(parentContext) {
  return parentContext & SubtreeSuspenseContextMask;
}
export function setShallowSuspenseContext(parentContext, shallowContext) {
  return parentContext & SubtreeSuspenseContextMask | shallowContext;
}
export function pushSuspenseContext(fiber, newContext) {
  push(suspenseStackCursor, newContext, fiber);
}
export function popSuspenseContext(fiber) {
  pop(suspenseStackCursor, fiber);
}