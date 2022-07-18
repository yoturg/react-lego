/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { SVG_NAMESPACE } from '../shared/DOMNamespaces';
import createMicrosoftUnsafeLocalFunction from './createMicrosoftUnsafeLocalFunction'; // SVG temp container for IE lacking innerHTML

let reusableSVGContainer;
/**
 * Set the innerHTML property of a node
 *
 * @param {DOMElement} node
 * @param {string} html
 * @internal
 */

const setInnerHTML = createMicrosoftUnsafeLocalFunction(function (node, html) {
  if (node.namespaceURI === SVG_NAMESPACE) {
    if (!('innerHTML' in node)) {
      // IE does not have innerHTML for SVG nodes, so instead we inject the
      // new markup in a temp node and then move the child nodes across into
      // the target node
      reusableSVGContainer = reusableSVGContainer || document.createElement('div');
      reusableSVGContainer.innerHTML = '<svg>' + html.valueOf().toString() + '</svg>';
      const svgNode = reusableSVGContainer.firstChild;

      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }

      while (svgNode.firstChild) {
        node.appendChild(svgNode.firstChild);
      }

      return;
    }
  }

  node.innerHTML = html;
});
export default setInnerHTML;