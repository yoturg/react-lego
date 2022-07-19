/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
function invokeGuardedCallbackProd(name, func, context, a, b, c, d, e, f) {
  const funcArgs = Array.prototype.slice.call(arguments, 3);

  try {
    func.apply(context, funcArgs);
  } catch (error) {
    this.onError(error);
  }
}

let invokeGuardedCallbackImpl = invokeGuardedCallbackProd;
export default invokeGuardedCallbackImpl;