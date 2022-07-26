/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

/*
 * The `'' + value` pattern (used in in perf-sensitive code) throws for Symbol
 * and Temporal.* types. See https://github.com/facebook/react/pull/22064.
 *
 * The functions in this module will throw an easier-to-understand,
 * easier-to-debug exception with a clear errors message message explaining the
 * problem. (Instead of a confusing exception thrown inside the implementation
 * of the `value` object).
 */
// $FlowFixMe only called in DEV, so void return is not possible.
// $FlowFixMe only called in DEV, so void return is not possible.
export function checkAttributeStringCoercion(value, attributeName) {}
export function checkKeyStringCoercion(value) {}
export function checkPropStringCoercion(value, propName) {}
export function checkCSSPropertyStringCoercion(value, propName) {}
export function checkHtmlStringCoercion(value) {}
export function checkFormFieldValueStringCoercion(value) {}