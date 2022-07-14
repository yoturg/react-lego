/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
const loggedTypeFailures = {};
import { describeUnknownElementTypeFrameInDEV } from 'shared/ReactComponentStackFrame';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import hasOwnProperty from 'shared/hasOwnProperty';
const ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

function setCurrentlyValidatingElement(element) {}

export default function checkPropTypes(typeSpecs, values, location, componentName, element) {}