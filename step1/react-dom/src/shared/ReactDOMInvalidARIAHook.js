/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ATTRIBUTE_NAME_CHAR } from './DOMProperty';
import isCustomComponent from './isCustomComponent';
import validAriaProperties from './validAriaProperties';
import hasOwnProperty from 'shared/hasOwnProperty';
const warnedProperties = {};
const rARIA = new RegExp('^(aria)-[' + ATTRIBUTE_NAME_CHAR + ']*$');
const rARIACamel = new RegExp('^(aria)[A-Z][' + ATTRIBUTE_NAME_CHAR + ']*$');

function validateProperty(tagName, name) {
  return true;
}

function warnInvalidARIAProps(type, props) {}

export function validateProperties(type, props) {
  if (isCustomComponent(type, props)) {
    return;
  }

  warnInvalidARIAProps(type, props);
}