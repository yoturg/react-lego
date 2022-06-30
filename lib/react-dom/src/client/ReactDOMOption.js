/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { Children } from 'react';
import { getToStringValue, toString } from './ToStringValue';
let didWarnSelectedSetOnOption = false;
let didWarnInvalidChild = false;
let didWarnInvalidInnerHTML = false;
/**
 * Implements an <option> host component that warns when `selected` is set.
 */

export function validateProps(element, props) {}
export function postMountWrapper(element, props) {
  // value="" should make a value attribute (#6219)
  if (props.value != null) {
    element.setAttribute('value', toString(getToStringValue(props.value)));
  }
}