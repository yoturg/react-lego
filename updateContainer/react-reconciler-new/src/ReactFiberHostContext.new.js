/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { createCursor, pop } from './ReactFiberStack.new';
const NO_CONTEXT = {};
const contextStackCursor = createCursor(NO_CONTEXT);
const contextFiberStackCursor = createCursor(NO_CONTEXT);
const rootInstanceStackCursor = createCursor(NO_CONTEXT);

function requiredContext(c) {
  if (c === NO_CONTEXT) {
    throw new Error('Expected host context to exist. This error is likely caused by a bug ' + 'in React. Please file an issue.');
  }

  return c;
}

function getRootHostContainer() {
  const rootInstance = requiredContext(rootInstanceStackCursor.current);
  return rootInstance;
}

function popHostContainer(fiber) {
  pop(contextStackCursor, fiber);
  pop(contextFiberStackCursor, fiber);
  pop(rootInstanceStackCursor, fiber);
}

function getHostContext() {
  const context = requiredContext(contextStackCursor.current);
  return context;
}

function popHostContext(fiber) {
  // Do not pop unless this Fiber provided the current context.
  // pushHostContext() only pushes Fibers that provide unique contexts.
  if (contextFiberStackCursor.current !== fiber) {
    return;
  }

  pop(contextStackCursor, fiber);
  pop(contextFiberStackCursor, fiber);
}

export { getHostContext, getRootHostContainer, popHostContainer, popHostContext };