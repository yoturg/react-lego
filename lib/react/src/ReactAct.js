/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import ReactCurrentActQueue from './ReactCurrentActQueue';
import enqueueTask from 'shared/enqueueTask';
let actScopeDepth = 0;
let didWarnNoAwaitAct = false;
export function act(callback) {
  throw new Error('act(...) is not supported in production builds of React.');
}

function popActScope(prevActScopeDepth) {}

function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {}

let isFlushing = false;

function flushActQueue(queue) {}