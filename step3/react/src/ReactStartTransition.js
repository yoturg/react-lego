/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import ReactCurrentBatchConfig from './ReactCurrentBatchConfig';
import { enableTransitionTracing } from '../../shared/ReactFeatureFlags';
export function startTransition(scope, options) {
  const prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = {};

  if (enableTransitionTracing) {
    if (options !== undefined && options.name !== undefined) {
      ReactCurrentBatchConfig.transition.name = options.name;
      ReactCurrentBatchConfig.transition.startTime = -1;
    }
  }

  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;
  }
}