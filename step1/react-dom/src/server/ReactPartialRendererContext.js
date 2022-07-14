/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { disableLegacyContext } from 'shared/ReactFeatureFlags';
import { REACT_CONTEXT_TYPE, REACT_PROVIDER_TYPE } from 'shared/ReactSymbols';
import getComponentNameFromType from 'shared/getComponentNameFromType';
import checkPropTypes from 'shared/checkPropTypes';
let didWarnAboutInvalidateContextType;
export const emptyObject = {};

function maskContext(type, context) {
  const contextTypes = type.contextTypes;

  if (!contextTypes) {
    return emptyObject;
  }

  const maskedContext = {};

  for (const contextName in contextTypes) {
    maskedContext[contextName] = context[contextName];
  }

  return maskedContext;
}

function checkContextTypes(typeSpecs, values, location) {}

export function validateContextBounds(context, threadID) {
  // If we don't have enough slots in this context to store this threadID,
  // fill it in without leaving any holes to ensure that the VM optimizes
  // this as non-holey index properties.
  // (Note: If `react` package is < 16.6, _threadCount is undefined.)
  for (let i = context._threadCount | 0; i <= threadID; i++) {
    // We assume that this is the same as the defaultValue which might not be
    // true if we're rendering inside a secondary renderer but they are
    // secondary because these use cases are very rare.
    context[i] = context._currentValue2;
    context._threadCount = i + 1;
  }
}
export function processContext(type, context, threadID, isClass) {
  if (isClass) {
    const contextType = type.contextType;

    if (typeof contextType === 'object' && contextType !== null) {
      validateContextBounds(contextType, threadID);
      return contextType[threadID];
    }

    if (disableLegacyContext) {
      return emptyObject;
    } else {
      const maskedContext = maskContext(type, context);
      return maskedContext;
    }
  } else {
    if (disableLegacyContext) {
      return undefined;
    } else {
      const maskedContext = maskContext(type, context);
      return maskedContext;
    }
  }
}