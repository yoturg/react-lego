/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import * as React from 'react';
import isArray from 'shared/isArray';
import getComponentNameFromType from 'shared/getComponentNameFromType';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import { disableLegacyContext, disableModulePatternComponents, enableScopeAPI } from 'shared/ReactFeatureFlags';
import { REACT_DEBUG_TRACING_MODE_TYPE, REACT_FORWARD_REF_TYPE, REACT_FRAGMENT_TYPE, REACT_STRICT_MODE_TYPE, REACT_SUSPENSE_TYPE, REACT_SUSPENSE_LIST_TYPE, REACT_PORTAL_TYPE, REACT_PROFILER_TYPE, REACT_PROVIDER_TYPE, REACT_CONTEXT_TYPE, REACT_LAZY_TYPE, REACT_MEMO_TYPE, REACT_SCOPE_TYPE, REACT_LEGACY_HIDDEN_TYPE } from 'shared/ReactSymbols';
import { emptyObject, processContext, validateContextBounds } from './ReactPartialRendererContext';
import { allocThreadID, freeThreadID } from './ReactThreadIDAllocator';
import { createMarkupForCustomAttribute, createMarkupForProperty } from './DOMMarkupOperations';
import escapeTextForBrowser from './escapeTextForBrowser';
import { prepareToUseHooks, finishHooks, resetHooksState, Dispatcher, currentPartialRenderer, setCurrentPartialRenderer } from './ReactPartialRendererHooks';
import { HTML_NAMESPACE, getIntrinsicNamespace, getChildNamespace } from '../shared/DOMNamespaces';
import assertValidProps from '../shared/assertValidProps';
import dangerousStyleValue from '../shared/dangerousStyleValue';
import hyphenateStyleName from '../shared/hyphenateStyleName';
import isCustomComponentFn from '../shared/isCustomComponent';
import omittedCloseTags from '../shared/omittedCloseTags';
import assign from 'shared/assign';
import hasOwnProperty from 'shared/hasOwnProperty'; // Based on reading the React.Children implementation. TODO: type this somewhere?

const toArray = React.Children.toArray; // This is only used in DEV.
// Each entry is `this.stack` from a currently executing renderer instance.
// (There may be more than one because ReactDOMServer is reentrant).
// Each stack is an array of frames which may contain nested stacks of elements.

const ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
const newlineEatingTags = {
  listing: true,
  pre: true,
  textarea: true
}; // We accept any tag to be rendered but since this gets injected into arbitrary
// HTML, we want to make sure that it's a safe tag.
// http://www.w3.org/TR/REC-xml/#NT-Name

const VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/; // Simplified subset

const validatedTagCache = {};

function validateDangerousTag(tag) {
  if (!validatedTagCache.hasOwnProperty(tag)) {
    if (!VALID_TAG_REGEX.test(tag)) {
      throw new Error(`Invalid tag: ${tag}`);
    }

    validatedTagCache[tag] = true;
  }
}

const styleNameCache = {};

const processStyleName = function (styleName) {
  if (styleNameCache.hasOwnProperty(styleName)) {
    return styleNameCache[styleName];
  }

  const result = hyphenateStyleName(styleName);
  styleNameCache[styleName] = result;
  return result;
};

function createMarkupForStyles(styles) {
  let serialized = '';
  let delimiter = '';

  for (const styleName in styles) {
    if (!styles.hasOwnProperty(styleName)) {
      continue;
    }

    const isCustomProperty = styleName.indexOf('--') === 0;
    const styleValue = styles[styleName];

    if (styleValue != null) {
      serialized += delimiter + (isCustomProperty ? styleName : processStyleName(styleName)) + ':';
      serialized += dangerousStyleValue(styleName, styleValue, isCustomProperty);
      delimiter = ';';
    }
  }

  return serialized || null;
}

function warnNoop(publicInstance, callerName) {}

function shouldConstruct(Component) {
  return Component.prototype && Component.prototype.isReactComponent;
}

function getNonChildrenInnerMarkup(props) {
  const innerHTML = props.dangerouslySetInnerHTML;

  if (innerHTML != null) {
    if (innerHTML.__html != null) {
      return innerHTML.__html;
    }
  } else {
    const content = props.children;

    if (typeof content === 'string' || typeof content === 'number') {
      return escapeTextForBrowser(content);
    }
  }

  return null;
}

function flattenTopLevelChildren(children) {
  if (!React.isValidElement(children)) {
    return toArray(children);
  }

  const element = children;

  if (element.type !== REACT_FRAGMENT_TYPE) {
    return [element];
  }

  const fragmentChildren = element.props.children;

  if (!React.isValidElement(fragmentChildren)) {
    return toArray(fragmentChildren);
  }

  const fragmentChildElement = fragmentChildren;
  return [fragmentChildElement];
}

function flattenOptionChildren(children) {
  if (children === undefined || children === null) {
    return children;
  }

  let content = ''; // Flatten children and warn if they aren't strings or numbers;
  // invalid types are ignored.

  React.Children.forEach(children, function (child) {
    if (child == null) {
      return;
    }

    content += child;
  });
  return content;
}

const STYLE = 'style';
const RESERVED_PROPS = {
  children: null,
  dangerouslySetInnerHTML: null,
  suppressContentEditableWarning: null,
  suppressHydrationWarning: null
};

function createOpenTagMarkup(tagVerbatim, tagLowercase, props, namespace, makeStaticMarkup, isRootElement) {
  let ret = '<' + tagVerbatim;
  const isCustomComponent = isCustomComponentFn(tagLowercase, props);

  for (const propKey in props) {
    if (!hasOwnProperty.call(props, propKey)) {
      continue;
    }

    let propValue = props[propKey];

    if (propValue == null) {
      continue;
    }

    if (propKey === STYLE) {
      propValue = createMarkupForStyles(propValue);
    }

    let markup = null;

    if (isCustomComponent) {
      if (!RESERVED_PROPS.hasOwnProperty(propKey)) {
        markup = createMarkupForCustomAttribute(propKey, propValue);
      }
    } else {
      markup = createMarkupForProperty(propKey, propValue);
    }

    if (markup) {
      ret += ' ' + markup;
    }
  }

  return ret;
}

function resolve(child, context, threadID) {
  while (React.isValidElement(child)) {
    // Safe because we just checked it's an element.
    const element = child;
    const Component = element.type;

    if (typeof Component !== 'function') {
      break;
    }

    processChild(element, Component);
  } // Extra closure so queue and replace can be captured properly


  function processChild(element, Component) {
    const isClass = shouldConstruct(Component);
    const publicContext = processContext(Component, context, threadID, isClass);
    let queue = [];
    let replace = false;
    const updater = {
      isMounted: function (publicInstance) {
        return false;
      },
      enqueueForceUpdate: function (publicInstance) {
        if (queue === null) {
          warnNoop(publicInstance, 'forceUpdate');
          return null;
        }
      },
      enqueueReplaceState: function (publicInstance, completeState) {
        replace = true;
        queue = [completeState];
      },
      enqueueSetState: function (publicInstance, currentPartialState) {
        if (queue === null) {
          warnNoop(publicInstance, 'setState');
          return null;
        }

        queue.push(currentPartialState);
      }
    };
    let inst;

    if (isClass) {
      inst = new Component(element.props, publicContext, updater);

      if (typeof Component.getDerivedStateFromProps === 'function') {
        const partialState = Component.getDerivedStateFromProps.call(null, element.props, inst.state);

        if (partialState != null) {
          inst.state = assign({}, inst.state, partialState);
        }
      }
    } else {
      const componentIdentity = {};
      prepareToUseHooks(componentIdentity);
      inst = Component(element.props, publicContext, updater);
      inst = finishHooks(Component, element.props, inst, publicContext); // If the flag is on, everything is assumed to be a function component.
      // Otherwise, we also do the unfortunate dynamic checks.

      if (disableModulePatternComponents || inst == null || inst.render == null) {
        child = inst;
        return;
      }
    }

    inst.props = element.props;
    inst.context = publicContext;
    inst.updater = updater;
    let initialState = inst.state;

    if (initialState === undefined) {
      inst.state = initialState = null;
    }

    if (typeof inst.UNSAFE_componentWillMount === 'function' || typeof inst.componentWillMount === 'function') {
      if (typeof inst.componentWillMount === 'function') {
        // In order to support react-lifecycles-compat polyfilled components,
        // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
        if (typeof Component.getDerivedStateFromProps !== 'function') {
          inst.componentWillMount();
        }
      }

      if (typeof inst.UNSAFE_componentWillMount === 'function' && typeof Component.getDerivedStateFromProps !== 'function') {
        // In order to support react-lifecycles-compat polyfilled components,
        // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
        inst.UNSAFE_componentWillMount();
      }

      if (queue.length) {
        const oldQueue = queue;
        const oldReplace = replace;
        queue = null;
        replace = false;

        if (oldReplace && oldQueue.length === 1) {
          inst.state = oldQueue[0];
        } else {
          let nextState = oldReplace ? oldQueue[0] : inst.state;
          let dontMutate = true;

          for (let i = oldReplace ? 1 : 0; i < oldQueue.length; i++) {
            const partial = oldQueue[i];
            const partialState = typeof partial === 'function' ? partial.call(inst, nextState, element.props, publicContext) : partial;

            if (partialState != null) {
              if (dontMutate) {
                dontMutate = false;
                nextState = assign({}, nextState, partialState);
              } else {
                assign(nextState, partialState);
              }
            }
          }

          inst.state = nextState;
        }
      } else {
        queue = null;
      }
    }

    child = inst.render();
    let childContext;

    if (disableLegacyContext) {} else {
      if (typeof inst.getChildContext === 'function') {
        const childContextTypes = Component.childContextTypes;

        if (typeof childContextTypes === 'object') {
          childContext = inst.getChildContext();

          for (const contextKey in childContext) {
            if (!(contextKey in childContextTypes)) {
              throw new Error(`${getComponentNameFromType(Component) || 'Unknown'}.getChildContext(): key "${contextKey}" is not defined in childContextTypes.`);
            }
          }
        } else {}
      }

      if (childContext) {
        context = assign({}, context, childContext);
      }
    }
  }

  return {
    child,
    context
  };
}

class ReactDOMServerRenderer {
  threadID;
  stack;
  exhausted; // TODO: type this more strictly:

  currentSelectValue;
  previousWasTextNode;
  makeStaticMarkup;
  suspenseDepth;
  contextIndex;
  contextStack;
  contextValueStack;
  contextProviderStack; // DEV-only

  constructor(children, makeStaticMarkup) {
    const flatChildren = flattenTopLevelChildren(children);
    const topFrame = {
      type: null,
      // Assume all trees start in the HTML namespace (not totally true, but
      // this is what we did historically)
      domNamespace: HTML_NAMESPACE,
      children: flatChildren,
      childIndex: 0,
      context: emptyObject,
      footer: ''
    };
    this.threadID = allocThreadID();
    this.stack = [topFrame];
    this.exhausted = false;
    this.currentSelectValue = null;
    this.previousWasTextNode = false;
    this.makeStaticMarkup = makeStaticMarkup;
    this.suspenseDepth = 0; // Context (new API)

    this.contextIndex = -1;
    this.contextStack = [];
    this.contextValueStack = [];
  }

  destroy() {
    if (!this.exhausted) {
      this.exhausted = true;
      this.clearProviders();
      freeThreadID(this.threadID);
    }
  }
  /**
   * Note: We use just two stacks regardless of how many context providers you have.
   * Providers are always popped in the reverse order to how they were pushed
   * so we always know on the way down which provider you'll encounter next on the way up.
   * On the way down, we push the current provider, and its context value *before*
   * we mutated it, onto the stacks. Therefore, on the way up, we always know which
   * provider needs to be "restored" to which value.
   * https://github.com/facebook/react/pull/12985#issuecomment-396301248
   */


  pushProvider(provider) {
    const index = ++this.contextIndex;
    const context = provider.type._context;
    const threadID = this.threadID;
    validateContextBounds(context, threadID);
    const previousValue = context[threadID]; // Remember which value to restore this context to on our way up.

    this.contextStack[index] = context;
    this.contextValueStack[index] = previousValue; // Mutate the current value.

    context[threadID] = provider.props.value;
  }

  popProvider(provider) {
    const index = this.contextIndex;
    const context = this.contextStack[index];
    const previousValue = this.contextValueStack[index]; // "Hide" these null assignments from Flow by using `any`
    // because conceptually they are deletions--as long as we
    // promise to never access values beyond `this.contextIndex`.

    this.contextStack[index] = null;
    this.contextValueStack[index] = null;
    this.contextIndex--; // Restore to the previous value we stored as we were walking down.
    // We've already verified that this context has been expanded to accommodate
    // this thread id, so we don't need to do it again.

    context[this.threadID] = previousValue;
  }

  clearProviders() {
    // Restore any remaining providers on the stack to previous values
    for (let index = this.contextIndex; index >= 0; index--) {
      const context = this.contextStack[index];
      const previousValue = this.contextValueStack[index];
      context[this.threadID] = previousValue;
    }
  }

  read(bytes) {
    if (this.exhausted) {
      return null;
    }

    const prevPartialRenderer = currentPartialRenderer;
    setCurrentPartialRenderer(this);
    const prevDispatcher = ReactCurrentDispatcher.current;
    ReactCurrentDispatcher.current = Dispatcher;

    try {
      // Markup generated within <Suspense> ends up buffered until we know
      // nothing in that boundary suspended
      const out = [''];
      let suspended = false;

      while (out[0].length < bytes) {
        if (this.stack.length === 0) {
          this.exhausted = true;
          freeThreadID(this.threadID);
          break;
        }

        const frame = this.stack[this.stack.length - 1];

        if (suspended || frame.childIndex >= frame.children.length) {
          const footer = frame.footer;

          if (footer !== '') {
            this.previousWasTextNode = false;
          }

          this.stack.pop();

          if (frame.type === 'select') {
            this.currentSelectValue = null;
          } else if (frame.type != null && frame.type.type != null && frame.type.type.$$typeof === REACT_PROVIDER_TYPE) {
            const provider = frame.type;
            this.popProvider(provider);
          } else if (frame.type === REACT_SUSPENSE_TYPE) {
            this.suspenseDepth--;
            const buffered = out.pop();

            if (suspended) {
              suspended = false; // If rendering was suspended at this boundary, render the fallbackFrame

              const fallbackFrame = frame.fallbackFrame;

              if (!fallbackFrame) {
                throw new Error('ReactDOMServer did not find an internal fallback frame for Suspense. ' + 'This is a bug in React. Please file an issue.');
              }

              this.stack.push(fallbackFrame);
              out[this.suspenseDepth] += '<!--$!-->'; // Skip flushing output since we're switching to the fallback

              continue;
            } else {
              out[this.suspenseDepth] += buffered;
            }
          } // Flush output


          out[this.suspenseDepth] += footer;
          continue;
        }

        const child = frame.children[frame.childIndex++];
        let outBuffer = '';

        try {
          outBuffer += this.render(child, frame.context, frame.domNamespace);
        } catch (err) {
          if (err != null && typeof err.then === 'function') {
            if (this.suspenseDepth <= 0) {
              throw new Error( // TODO: include component name. This is a bit tricky with current factoring.
              'A React component suspended while rendering, but no fallback UI was specified.\n' + '\n' + 'Add a <Suspense fallback=...> component higher in the tree to ' + 'provide a loading indicator or placeholder to display.');
            }

            suspended = true;
          } else {
            throw err;
          }
        } finally {}

        if (out.length <= this.suspenseDepth) {
          out.push('');
        }

        out[this.suspenseDepth] += outBuffer;
      }

      return out[0];
    } finally {
      ReactCurrentDispatcher.current = prevDispatcher;
      setCurrentPartialRenderer(prevPartialRenderer);
      resetHooksState();
    }
  }

  render(child, context, parentNamespace) {
    if (typeof child === 'string' || typeof child === 'number') {
      const text = '' + child;

      if (text === '') {
        return '';
      }

      if (this.makeStaticMarkup) {
        return escapeTextForBrowser(text);
      }

      if (this.previousWasTextNode) {
        return '<!-- -->' + escapeTextForBrowser(text);
      }

      this.previousWasTextNode = true;
      return escapeTextForBrowser(text);
    } else {
      let nextChild;
      ({
        child: nextChild,
        context
      } = resolve(child, context, this.threadID));

      if (nextChild === null || nextChild === false) {
        return '';
      } else if (!React.isValidElement(nextChild)) {
        if (nextChild != null && nextChild.$$typeof != null) {
          // Catch unexpected special types early.
          const $$typeof = nextChild.$$typeof;

          if ($$typeof === REACT_PORTAL_TYPE) {
            throw new Error('Portals are not currently supported by the server renderer. ' + 'Render them conditionally so that they only appear on the client render.');
          } // Catch-all to prevent an infinite loop if React.Children.toArray() supports some new type.


          throw new Error(`Unknown element-like object type: ${$$typeof.toString()}. This is likely a bug in React. ` + 'Please file an issue.');
        }

        const nextChildren = toArray(nextChild);
        const frame = {
          type: null,
          domNamespace: parentNamespace,
          children: nextChildren,
          childIndex: 0,
          context: context,
          footer: ''
        };
        this.stack.push(frame);
        return '';
      } // Safe because we just checked it's an element.


      const nextElement = nextChild;
      const elementType = nextElement.type;

      if (typeof elementType === 'string') {
        return this.renderDOM(nextElement, context, parentNamespace);
      }

      switch (elementType) {
        // TODO: LegacyHidden acts the same as a fragment. This only works
        // because we currently assume that every instance of LegacyHidden is
        // accompanied by a host component wrapper. In the hidden mode, the host
        // component is given a `hidden` attribute, which ensures that the
        // initial HTML is not visible. To support the use of LegacyHidden as a
        // true fragment, without an extra DOM node, we would have to hide the
        // initial HTML in some other way.
        case REACT_LEGACY_HIDDEN_TYPE:
        case REACT_DEBUG_TRACING_MODE_TYPE:
        case REACT_STRICT_MODE_TYPE:
        case REACT_PROFILER_TYPE:
        case REACT_SUSPENSE_LIST_TYPE:
        case REACT_FRAGMENT_TYPE:
          {
            const nextChildren = toArray(nextChild.props.children);
            const frame = {
              type: null,
              domNamespace: parentNamespace,
              children: nextChildren,
              childIndex: 0,
              context: context,
              footer: ''
            };
            this.stack.push(frame);
            return '';
          }

        case REACT_SUSPENSE_TYPE:
          {
            const fallback = nextChild.props.fallback;
            const fallbackChildren = toArray(fallback);
            const nextChildren = toArray(nextChild.props.children);
            const fallbackFrame = {
              type: null,
              domNamespace: parentNamespace,
              children: fallbackChildren,
              childIndex: 0,
              context: context,
              footer: '<!--/$-->'
            };
            const frame = {
              fallbackFrame,
              type: REACT_SUSPENSE_TYPE,
              domNamespace: parentNamespace,
              children: nextChildren,
              childIndex: 0,
              context: context,
              footer: '<!--/$-->'
            };
            this.stack.push(frame);
            this.suspenseDepth++;
            return '<!--$-->';
          }
        // eslint-disable-next-line-no-fallthrough

        case REACT_SCOPE_TYPE:
          {
            if (enableScopeAPI) {
              const nextChildren = toArray(nextChild.props.children);
              const frame = {
                type: null,
                domNamespace: parentNamespace,
                children: nextChildren,
                childIndex: 0,
                context: context,
                footer: ''
              };
              this.stack.push(frame);
              return '';
            }

            throw new Error('ReactDOMServer does not yet support scope components.');
          }
        // eslint-disable-next-line-no-fallthrough

        default:
          break;
      }

      if (typeof elementType === 'object' && elementType !== null) {
        switch (elementType.$$typeof) {
          case REACT_FORWARD_REF_TYPE:
            {
              const element = nextChild;
              let nextChildren;
              const componentIdentity = {};
              prepareToUseHooks(componentIdentity);
              nextChildren = elementType.render(element.props, element.ref);
              nextChildren = finishHooks(elementType.render, element.props, nextChildren, element.ref);
              nextChildren = toArray(nextChildren);
              const frame = {
                type: null,
                domNamespace: parentNamespace,
                children: nextChildren,
                childIndex: 0,
                context: context,
                footer: ''
              };
              this.stack.push(frame);
              return '';
            }

          case REACT_MEMO_TYPE:
            {
              const element = nextChild;
              const nextChildren = [React.createElement(elementType.type, assign({
                ref: element.ref
              }, element.props))];
              const frame = {
                type: null,
                domNamespace: parentNamespace,
                children: nextChildren,
                childIndex: 0,
                context: context,
                footer: ''
              };
              this.stack.push(frame);
              return '';
            }

          case REACT_PROVIDER_TYPE:
            {
              const provider = nextChild;
              const nextProps = provider.props;
              const nextChildren = toArray(nextProps.children);
              const frame = {
                type: provider,
                domNamespace: parentNamespace,
                children: nextChildren,
                childIndex: 0,
                context: context,
                footer: ''
              };
              this.pushProvider(provider);
              this.stack.push(frame);
              return '';
            }

          case REACT_CONTEXT_TYPE:
            {
              let reactContext = nextChild.type; // The logic below for Context differs depending on PROD or DEV mode. In
              // DEV mode, we create a separate object for Context.Consumer that acts
              // like a proxy to Context. This proxy object adds unnecessary code in PROD
              // so we use the old behaviour (Context.Consumer references Context) to
              // reduce size and overhead. The separate object references context via
              // a property called "_context", which also gives us the ability to check
              // in DEV mode if this property exists or not and warn if it does not.

              const nextProps = nextChild.props;
              const threadID = this.threadID;
              validateContextBounds(reactContext, threadID);
              const nextValue = reactContext[threadID];
              const nextChildren = toArray(nextProps.children(nextValue));
              const frame = {
                type: nextChild,
                domNamespace: parentNamespace,
                children: nextChildren,
                childIndex: 0,
                context: context,
                footer: ''
              };
              this.stack.push(frame);
              return '';
            }
          // eslint-disable-next-line-no-fallthrough

          case REACT_LAZY_TYPE:
            {
              const element = nextChild;
              const lazyComponent = nextChild.type; // Attempt to initialize lazy component regardless of whether the
              // suspense server-side renderer is enabled so synchronously
              // resolved constructors are supported.

              const payload = lazyComponent._payload;
              const init = lazyComponent._init;
              const result = init(payload);
              const nextChildren = [React.createElement(result, assign({
                ref: element.ref
              }, element.props))];
              const frame = {
                type: null,
                domNamespace: parentNamespace,
                children: nextChildren,
                childIndex: 0,
                context: context,
                footer: ''
              };
              this.stack.push(frame);
              return '';
            }
        }
      }

      let info = '';
      throw new Error('Element type is invalid: expected a string (for built-in ' + 'components) or a class/function (for composite components) ' + `but got: ${elementType == null ? elementType : typeof elementType}.${info}`);
    }
  }

  renderDOM(element, context, parentNamespace) {
    const tag = element.type;
    let namespace = parentNamespace;

    if (parentNamespace === HTML_NAMESPACE) {
      namespace = getIntrinsicNamespace(tag);
    }

    let props = element.props;
    validateDangerousTag(tag);

    if (tag === 'input') {
      props = assign({
        type: undefined
      }, props, {
        defaultChecked: undefined,
        defaultValue: undefined,
        value: props.value != null ? props.value : props.defaultValue,
        checked: props.checked != null ? props.checked : props.defaultChecked
      });
    } else if (tag === 'textarea') {
      let initialValue = props.value;

      if (initialValue == null) {
        let defaultValue = props.defaultValue; // TODO (yungsters): Remove support for children content in <textarea>.

        let textareaChildren = props.children;

        if (textareaChildren != null) {
          if (defaultValue != null) {
            throw new Error('If you supply `defaultValue` on a <textarea>, do not pass children.');
          }

          if (isArray(textareaChildren)) {
            if (textareaChildren.length > 1) {
              throw new Error('<textarea> can only have at most one child.');
            }

            textareaChildren = textareaChildren[0];
          }

          defaultValue = '' + textareaChildren;
        }

        if (defaultValue == null) {
          defaultValue = '';
        }

        initialValue = defaultValue;
      }

      props = assign({}, props, {
        value: undefined,
        children: '' + initialValue
      });
    } else if (tag === 'select') {
      this.currentSelectValue = props.value != null ? props.value : props.defaultValue;
      props = assign({}, props, {
        value: undefined
      });
    } else if (tag === 'option') {
      let selected = null;
      const selectValue = this.currentSelectValue;

      if (selectValue != null) {
        let value;

        if (props.value != null) {
          value = props.value + '';
        } else {
          value = flattenOptionChildren(props.children);
        }

        selected = false;

        if (isArray(selectValue)) {
          // multiple
          for (let j = 0; j < selectValue.length; j++) {
            if ('' + selectValue[j] === value) {
              selected = true;
              break;
            }
          }
        } else {
          selected = '' + selectValue === value;
        }

        props = assign({
          selected: undefined
        }, props, {
          selected: selected
        });
      }
    }

    assertValidProps(tag, props);
    let out = createOpenTagMarkup(element.type, tag, props, namespace, this.makeStaticMarkup, this.stack.length === 1);
    let footer = '';

    if (omittedCloseTags.hasOwnProperty(tag)) {
      out += '/>';
    } else {
      out += '>';
      footer = '</' + element.type + '>';
    }

    let children;
    const innerMarkup = getNonChildrenInnerMarkup(props);

    if (innerMarkup != null) {
      children = [];

      if (newlineEatingTags.hasOwnProperty(tag) && innerMarkup.charAt(0) === '\n') {
        // text/html ignores the first character in these tags if it's a newline
        // Prefer to break application/xml over text/html (for now) by adding
        // a newline specifically to get eaten by the parser. (Alternately for
        // textareas, replacing "^\n" with "\r\n" doesn't get eaten, and the first
        // \r is normalized out by HTMLTextAreaElement#value.)
        // See: <http://www.w3.org/TR/html-polyglot/#newlines-in-textarea-and-pre>
        // See: <http://www.w3.org/TR/html5/syntax.html#element-restrictions>
        // See: <http://www.w3.org/TR/html5/syntax.html#newlines>
        // See: Parsing of "textarea" "listing" and "pre" elements
        //  from <http://www.w3.org/TR/html5/syntax.html#parsing-main-inbody>
        out += '\n';
      }

      out += innerMarkup;
    } else {
      children = toArray(props.children);
    }

    const frame = {
      domNamespace: getChildNamespace(parentNamespace, element.type),
      type: tag,
      children,
      childIndex: 0,
      context: context,
      footer: footer
    };
    this.stack.push(frame);
    this.previousWasTextNode = false;
    return out;
  }

}

export default ReactDOMServerRenderer;