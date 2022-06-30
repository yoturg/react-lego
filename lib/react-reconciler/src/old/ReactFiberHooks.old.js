/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import ReactSharedInternals from 'shared/ReactSharedInternals';
import { enableDebugTracing, enableSchedulingProfiler, enableNewReconciler, enableCache, enableUseRefAccessWarning, enableStrictEffects, enableLazyContextPropagation, enableUseMutableSource, enableTransitionTracing } from 'shared/ReactFeatureFlags';
import { NoMode, ConcurrentMode, DebugTracingMode, StrictEffectsMode } from './ReactTypeOfMode';
import { NoLane, SyncLane, NoLanes, isSubsetOfLanes, includesBlockingLane, includesOnlyNonUrgentLanes, claimNextTransitionLane, mergeLanes, removeLanes, intersectLanes, isTransitionLane, markRootEntangled, markRootMutableRead, NoTimestamp } from './ReactFiberLane.old';
import { ContinuousEventPriority, getCurrentUpdatePriority, setCurrentUpdatePriority, higherEventPriority } from './ReactEventPriorities.old';
import { readContext, checkIfContextChanged } from './ReactFiberNewContext.old';
import { HostRoot, CacheComponent } from './ReactWorkTags';
import { LayoutStatic as LayoutStaticEffect, MountLayoutDev as MountLayoutDevEffect, MountPassiveDev as MountPassiveDevEffect, Passive as PassiveEffect, PassiveStatic as PassiveStaticEffect, StaticMask as StaticMaskEffect, Update as UpdateEffect, StoreConsistency } from './ReactFiberFlags';
import { HasEffect as HookHasEffect, Layout as HookLayout, Passive as HookPassive, Insertion as HookInsertion } from './ReactHookEffectTags';
import { getWorkInProgressRoot, scheduleUpdateOnFiber, requestUpdateLane, requestEventTime, markSkippedUpdateLanes } from './ReactFiberWorkLoop.old';
import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
import is from 'shared/objectIs';
import isArray from 'shared/isArray';
import { markWorkInProgressReceivedUpdate, checkIfWorkInProgressReceivedUpdate } from './ReactFiberBeginWork.old';
import { getIsHydrating } from './ReactFiberHydrationContext.old';
import { getWorkInProgressVersion, markSourceAsDirty, setWorkInProgressVersion, warnAboutMultipleRenderersDEV } from './ReactMutableSource.old';
import { logStateUpdateScheduled } from './DebugTracing';
import { markStateUpdateScheduled } from './ReactFiberDevToolsHook.old';
import { createCache, CacheContext } from './ReactFiberCacheComponent.old';
import { createUpdate as createLegacyQueueUpdate, enqueueUpdate as enqueueLegacyQueueUpdate, entangleTransitions as entangleLegacyQueueTransitions } from './ReactFiberClassUpdateQueue.old';
import { enqueueConcurrentHookUpdate, enqueueConcurrentHookUpdateAndEagerlyBailout, enqueueConcurrentRenderForLane } from './ReactFiberConcurrentUpdates.old';
import { getTreeId } from './ReactFiberTreeContext.old';
import { now } from './Scheduler';
const {
  ReactCurrentDispatcher,
  ReactCurrentBatchConfig
} = ReactSharedInternals;
let didWarnAboutMismatchedHooksForComponent;
let didWarnUncachedGetSnapshot; // These are set right before calling the component.

let renderLanes = NoLanes; // The work-in-progress fiber. I've named it differently to distinguish it from
// the work-in-progress hook.

let currentlyRenderingFiber = null; // Hooks are stored as a linked list on the fiber's memoizedState field. The
// current hook list is the list that belongs to the current fiber. The
// work-in-progress hook list is a new list that will be added to the
// work-in-progress fiber.

let currentHook = null;
let workInProgressHook = null; // Whether an update was scheduled at any point during the render phase. This
// does not get reset if we do another render pass; only when we're completely
// finished evaluating this component. This is an optimization so we know
// whether we need to clear render phase updates after a throw.

let didScheduleRenderPhaseUpdate = false; // Where an update was scheduled only during the current render pass. This
// gets reset after each attempt.
// TODO: Maybe there's some way to consolidate this with
// `didScheduleRenderPhaseUpdate`. Or with `numberOfReRenders`.

let didScheduleRenderPhaseUpdateDuringThisPass = false; // Counts the number of useId hooks in this component.

let localIdCounter = 0; // Used for ids that are generated completely client-side (i.e. not during
// hydration). This counter is global, so client ids are not stable across
// render attempts.

let globalClientIdCounter = 0;
const RE_RENDER_LIMIT = 25; // In DEV, this is the name of the currently executing primitive hook

let currentHookNameInDev = null; // In DEV, this list ensures that hooks are called in the same order between renders.
// The list stores the order of hooks used during the initial render (mount).
// Subsequent renders (updates) reference this list.

let hookTypesDev = null;
let hookTypesUpdateIndexDev = -1; // In DEV, this tracks whether currently rendering component needs to ignore
// the dependencies for Hooks that need them (e.g. useEffect or useMemo).
// When true, such Hooks will always be "remounted". Only used during hot reload.

let ignorePreviousDependencies = false;

function mountHookTypesDev() {}

function updateHookTypesDev() {}

function checkDepsAreArrayDev(deps) {}

function warnOnHookMismatchInDev(currentHookName) {}

function throwInvalidHookError() {
  throw new Error('Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' + ' one of the following reasons:\n' + '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' + '2. You might be breaking the Rules of Hooks\n' + '3. You might have more than one copy of React in the same app\n' + 'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.');
}

function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) {
    return false;
  }

  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (is(nextDeps[i], prevDeps[i])) {
      continue;
    }

    return false;
  }

  return true;
}

export function renderWithHooks(current, workInProgress, Component, props, secondArg, nextRenderLanes) {
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress;
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.lanes = NoLanes; // The following should have already been reset
  // currentHook = null;
  // workInProgressHook = null;
  // didScheduleRenderPhaseUpdate = false;
  // localIdCounter = 0;
  // TODO Warn if no hooks are used at all during mount, then some are used during update.
  // Currently we will identify the update render as a mount because memoizedState === null.
  // This is tricky because it's valid for certain types of components (e.g. React.lazy)
  // Using memoizedState to differentiate between mount/update only works if at least one stateful hook is used.
  // Non-stateful hooks (e.g. context) don't get added to memoizedState,
  // so memoizedState would be null during updates and mounts.

  ReactCurrentDispatcher.current = current === null || current.memoizedState === null ? HooksDispatcherOnMount : HooksDispatcherOnUpdate;
  let children = Component(props, secondArg); // Check if there was a render phase update

  if (didScheduleRenderPhaseUpdateDuringThisPass) {
    // Keep rendering in a loop for as long as render phase updates continue to
    // be scheduled. Use a counter to prevent infinite loops.
    let numberOfReRenders = 0;

    do {
      didScheduleRenderPhaseUpdateDuringThisPass = false;
      localIdCounter = 0;

      if (numberOfReRenders >= RE_RENDER_LIMIT) {
        throw new Error('Too many re-renders. React limits the number of renders to prevent ' + 'an infinite loop.');
      }

      numberOfReRenders += 1; // Start over from the beginning of the list

      currentHook = null;
      workInProgressHook = null;
      workInProgress.updateQueue = null;
      ReactCurrentDispatcher.current = HooksDispatcherOnRerender;
      children = Component(props, secondArg);
    } while (didScheduleRenderPhaseUpdateDuringThisPass);
  } // We can assume the previous dispatcher is always this one, since we set it
  // at the beginning of the render phase and there's no re-entrance.


  ReactCurrentDispatcher.current = ContextOnlyDispatcher; // This check uses currentHook so that it works the same in DEV and prod bundles.
  // hookTypesDev could catch more cases (e.g. context) but only in DEV bundles.

  const didRenderTooFewHooks = currentHook !== null && currentHook.next !== null;
  renderLanes = NoLanes;
  currentlyRenderingFiber = null;
  currentHook = null;
  workInProgressHook = null;
  didScheduleRenderPhaseUpdate = false; // This is reset by checkDidRenderIdHook
  // localIdCounter = 0;

  if (didRenderTooFewHooks) {
    throw new Error('Rendered fewer hooks than expected. This may be caused by an accidental ' + 'early return statement.');
  }

  if (enableLazyContextPropagation) {
    if (current !== null) {
      if (!checkIfWorkInProgressReceivedUpdate()) {
        // If there were no changes to props or state, we need to check if there
        // was a context change. We didn't already do this because there's no
        // 1:1 correspondence between dependencies and hooks. Although, because
        // there almost always is in the common case (`readContext` is an
        // internal API), we could compare in there. OTOH, we only hit this case
        // if everything else bails out, so on the whole it might be better to
        // keep the comparison out of the common path.
        const currentDependencies = current.dependencies;

        if (currentDependencies !== null && checkIfContextChanged(currentDependencies)) {
          markWorkInProgressReceivedUpdate();
        }
      }
    }
  }

  return children;
}
export function checkDidRenderIdHook() {
  // This should be called immediately after every renderWithHooks call.
  // Conceptually, it's part of the return value of renderWithHooks; it's only a
  // separate function to avoid using an array tuple.
  const didRenderIdHook = localIdCounter !== 0;
  localIdCounter = 0;
  return didRenderIdHook;
}
export function bailoutHooks(current, workInProgress, lanes) {
  workInProgress.updateQueue = current.updateQueue; // TODO: Don't need to reset the flags here, because they're reset in the
  // complete phase (bubbleProperties).

  workInProgress.flags &= ~(PassiveEffect | UpdateEffect);
  current.lanes = removeLanes(current.lanes, lanes);
}
export function resetHooksAfterThrow() {
  // We can assume the previous dispatcher is always this one, since we set it
  // at the beginning of the render phase and there's no re-entrance.
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;

  if (didScheduleRenderPhaseUpdate) {
    // There were render phase updates. These are only valid for this render
    // phase, which we are now aborting. Remove the updates from the queues so
    // they do not persist to the next render. Do not remove updates from hooks
    // that weren't processed.
    //
    // Only reset the updates from the queue if it has a clone. If it does
    // not have a clone, that means it wasn't processed, and the updates were
    // scheduled before we entered the render phase.
    let hook = currentlyRenderingFiber.memoizedState;

    while (hook !== null) {
      const queue = hook.queue;

      if (queue !== null) {
        queue.pending = null;
      }

      hook = hook.next;
    }

    didScheduleRenderPhaseUpdate = false;
  }

  renderLanes = NoLanes;
  currentlyRenderingFiber = null;
  currentHook = null;
  workInProgressHook = null;
  didScheduleRenderPhaseUpdateDuringThisPass = false;
  localIdCounter = 0;
}

function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null
  };

  if (workInProgressHook === null) {
    // This is the first hook in the list
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // Append to the end of the list
    workInProgressHook = workInProgressHook.next = hook;
  }

  return workInProgressHook;
}

function updateWorkInProgressHook() {
  // This function is used both for updates and for re-renders triggered by a
  // render phase update. It assumes there is either a current hook we can
  // clone, or a work-in-progress hook from a previous render pass that we can
  // use as a base. When we reach the end of the base list, we must switch to
  // the dispatcher used for mounts.
  let nextCurrentHook;

  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;

    if (current !== null) {
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    nextCurrentHook = currentHook.next;
  }

  let nextWorkInProgressHook;

  if (workInProgressHook === null) {
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
  } else {
    nextWorkInProgressHook = workInProgressHook.next;
  }

  if (nextWorkInProgressHook !== null) {
    // There's already a work-in-progress. Reuse it.
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = workInProgressHook.next;
    currentHook = nextCurrentHook;
  } else {
    // Clone from the current hook.
    if (nextCurrentHook === null) {
      throw new Error('Rendered more hooks than during the previous render.');
    }

    currentHook = nextCurrentHook;
    const newHook = {
      memoizedState: currentHook.memoizedState,
      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,
      next: null
    };

    if (workInProgressHook === null) {
      // This is the first hook in the list.
      currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
      // Append to the end of the list.
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }

  return workInProgressHook;
}

function createFunctionComponentUpdateQueue() {
  return {
    lastEffect: null,
    stores: null
  };
}

function basicStateReducer(state, action) {
  // $FlowFixMe: Flow doesn't like mixed types
  return typeof action === 'function' ? action(state) : action;
}

function mountReducer(reducer, initialArg, init) {
  const hook = mountWorkInProgressHook();
  let initialState;

  if (init !== undefined) {
    initialState = init(initialArg);
  } else {
    initialState = initialArg;
  }

  hook.memoizedState = hook.baseState = initialState;
  const queue = {
    pending: null,
    interleaved: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: initialState
  };
  hook.queue = queue;
  const dispatch = queue.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue);
  return [hook.memoizedState, dispatch];
}

function updateReducer(reducer, initialArg, init) {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;

  if (queue === null) {
    throw new Error('Should have a queue. This is likely a bug in React. Please file an issue.');
  }

  queue.lastRenderedReducer = reducer;
  const current = currentHook; // The last rebase update that is NOT part of the base state.

  let baseQueue = current.baseQueue; // The last pending update that hasn't been processed yet.

  const pendingQueue = queue.pending;

  if (pendingQueue !== null) {
    // We have new updates that haven't been processed yet.
    // We'll add them to the base queue.
    if (baseQueue !== null) {
      // Merge the pending queue and the base queue.
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }

    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }

  if (baseQueue !== null) {
    // We have a queue to process.
    const first = baseQueue.next;
    let newState = current.baseState;
    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;
    let update = first;

    do {
      const updateLane = update.lane;

      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        // Priority is insufficient. Skip this update. If this is the first
        // skipped update, the previous update/state is the new base
        // update/state.
        const clone = {
          lane: updateLane,
          action: update.action,
          hasEagerState: update.hasEagerState,
          eagerState: update.eagerState,
          next: null
        };

        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone;
          newBaseState = newState;
        } else {
          newBaseQueueLast = newBaseQueueLast.next = clone;
        } // Update the remaining priority in the queue.
        // TODO: Don't need to accumulate this. Instead, we can remove
        // renderLanes from the original lanes.


        currentlyRenderingFiber.lanes = mergeLanes(currentlyRenderingFiber.lanes, updateLane);
        markSkippedUpdateLanes(updateLane);
      } else {
        // This update does have sufficient priority.
        if (newBaseQueueLast !== null) {
          const clone = {
            // This update is going to be committed so we never want uncommit
            // it. Using NoLane works because 0 is a subset of all bitmasks, so
            // this will never be skipped by the check above.
            lane: NoLane,
            action: update.action,
            hasEagerState: update.hasEagerState,
            eagerState: update.eagerState,
            next: null
          };
          newBaseQueueLast = newBaseQueueLast.next = clone;
        } // Process this update.


        if (update.hasEagerState) {
          // If this update is a state update (not a reducer) and was processed eagerly,
          // we can use the eagerly computed state
          newState = update.eagerState;
        } else {
          const action = update.action;
          newState = reducer(newState, action);
        }
      }

      update = update.next;
    } while (update !== null && update !== first);

    if (newBaseQueueLast === null) {
      newBaseState = newState;
    } else {
      newBaseQueueLast.next = newBaseQueueFirst;
    } // Mark that the fiber performed work, but only if the new state is
    // different from the current state.


    if (!is(newState, hook.memoizedState)) {
      markWorkInProgressReceivedUpdate();
    }

    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;
    queue.lastRenderedState = newState;
  } // Interleaved updates are stored on a separate queue. We aren't going to
  // process them during this render, but we do need to track which lanes
  // are remaining.


  const lastInterleaved = queue.interleaved;

  if (lastInterleaved !== null) {
    let interleaved = lastInterleaved;

    do {
      const interleavedLane = interleaved.lane;
      currentlyRenderingFiber.lanes = mergeLanes(currentlyRenderingFiber.lanes, interleavedLane);
      markSkippedUpdateLanes(interleavedLane);
      interleaved = interleaved.next;
    } while (interleaved !== lastInterleaved);
  } else if (baseQueue === null) {
    // `queue.lanes` is used for entangling transitions. We can set it back to
    // zero once the queue is empty.
    queue.lanes = NoLanes;
  }

  const dispatch = queue.dispatch;
  return [hook.memoizedState, dispatch];
}

function rerenderReducer(reducer, initialArg, init) {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;

  if (queue === null) {
    throw new Error('Should have a queue. This is likely a bug in React. Please file an issue.');
  }

  queue.lastRenderedReducer = reducer; // This is a re-render. Apply the new render phase updates to the previous
  // work-in-progress hook.

  const dispatch = queue.dispatch;
  const lastRenderPhaseUpdate = queue.pending;
  let newState = hook.memoizedState;

  if (lastRenderPhaseUpdate !== null) {
    // The queue doesn't persist past this render pass.
    queue.pending = null;
    const firstRenderPhaseUpdate = lastRenderPhaseUpdate.next;
    let update = firstRenderPhaseUpdate;

    do {
      // Process this render phase update. We don't have to check the
      // priority because it will always be the same as the current
      // render's.
      const action = update.action;
      newState = reducer(newState, action);
      update = update.next;
    } while (update !== firstRenderPhaseUpdate); // Mark that the fiber performed work, but only if the new state is
    // different from the current state.


    if (!is(newState, hook.memoizedState)) {
      markWorkInProgressReceivedUpdate();
    }

    hook.memoizedState = newState; // Don't persist the state accumulated from the render phase updates to
    // the base state unless the queue is empty.
    // TODO: Not sure if this is the desired semantics, but it's what we
    // do for gDSFP. I can't remember why.

    if (hook.baseQueue === null) {
      hook.baseState = newState;
    }

    queue.lastRenderedState = newState;
  }

  return [newState, dispatch];
}

function readFromUnsubscribedMutableSource(root, source, getSnapshot) {
  const getVersion = source._getVersion;
  const version = getVersion(source._source); // Is it safe for this component to read from this source during the current render?

  let isSafeToReadFromSource = false; // Check the version first.
  // If this render has already been started with a specific version,
  // we can use it alone to determine if we can safely read from the source.

  const currentRenderVersion = getWorkInProgressVersion(source);

  if (currentRenderVersion !== null) {
    // It's safe to read if the store hasn't been mutated since the last time
    // we read something.
    isSafeToReadFromSource = currentRenderVersion === version;
  } else {
    // If there's no version, then this is the first time we've read from the
    // source during the current render pass, so we need to do a bit more work.
    // What we need to determine is if there are any hooks that already
    // subscribed to the source, and if so, whether there are any pending
    // mutations that haven't been synchronized yet.
    //
    // If there are no pending mutations, then `root.mutableReadLanes` will be
    // empty, and we know we can safely read.
    //
    // If there *are* pending mutations, we may still be able to safely read
    // if the currently rendering lanes are inclusive of the pending mutation
    // lanes, since that guarantees that the value we're about to read from
    // the source is consistent with the values that we read during the most
    // recent mutation.
    isSafeToReadFromSource = isSubsetOfLanes(renderLanes, root.mutableReadLanes);

    if (isSafeToReadFromSource) {
      // If it's safe to read from this source during the current render,
      // store the version in case other components read from it.
      // A changed version number will let those components know to throw and restart the render.
      setWorkInProgressVersion(source, version);
    }
  }

  if (isSafeToReadFromSource) {
    const snapshot = getSnapshot(source._source);
    return snapshot;
  } else {
    // This handles the special case of a mutable source being shared between renderers.
    // In that case, if the source is mutated between the first and second renderer,
    // The second renderer don't know that it needs to reset the WIP version during unwind,
    // (because the hook only marks sources as dirty if it's written to their WIP version).
    // That would cause this tear check to throw again and eventually be visible to the user.
    // We can avoid this infinite loop by explicitly marking the source as dirty.
    //
    // This can lead to tearing in the first renderer when it resumes,
    // but there's nothing we can do about that (short of throwing here and refusing to continue the render).
    markSourceAsDirty(source); // Intentioally throw an error to force React to retry synchronously. During
    // the synchronous retry, it will block interleaved mutations, so we should
    // get a consistent read. Therefore, the following error should never be
    // visible to the user.
    // We expect this error not to be thrown during the synchronous retry,
    // because we blocked interleaved mutations.

    throw new Error('Cannot read from mutable source during the current render without tearing. This may be a bug in React. Please file an issue.');
  }
}

function useMutableSource(hook, source, getSnapshot, subscribe) {
  if (!enableUseMutableSource) {
    return undefined;
  }

  const root = getWorkInProgressRoot();

  if (root === null) {
    throw new Error('Expected a work-in-progress root. This is a bug in React. Please file an issue.');
  }

  const getVersion = source._getVersion;
  const version = getVersion(source._source);
  const dispatcher = ReactCurrentDispatcher.current; // eslint-disable-next-line prefer-const

  let [currentSnapshot, setSnapshot] = dispatcher.useState(() => readFromUnsubscribedMutableSource(root, source, getSnapshot));
  let snapshot = currentSnapshot; // Grab a handle to the state hook as well.
  // We use it to clear the pending update queue if we have a new source.

  const stateHook = workInProgressHook;
  const memoizedState = hook.memoizedState;
  const refs = memoizedState.refs;
  const prevGetSnapshot = refs.getSnapshot;
  const prevSource = memoizedState.source;
  const prevSubscribe = memoizedState.subscribe;
  const fiber = currentlyRenderingFiber;
  hook.memoizedState = {
    refs,
    source,
    subscribe
  }; // Sync the values needed by our subscription handler after each commit.

  dispatcher.useEffect(() => {
    refs.getSnapshot = getSnapshot; // Normally the dispatch function for a state hook never changes,
    // but this hook recreates the queue in certain cases  to avoid updates from stale sources.
    // handleChange() below needs to reference the dispatch function without re-subscribing,
    // so we use a ref to ensure that it always has the latest version.

    refs.setSnapshot = setSnapshot; // Check for a possible change between when we last rendered now.

    const maybeNewVersion = getVersion(source._source);

    if (!is(version, maybeNewVersion)) {
      const maybeNewSnapshot = getSnapshot(source._source);

      if (!is(snapshot, maybeNewSnapshot)) {
        setSnapshot(maybeNewSnapshot);
        const lane = requestUpdateLane(fiber);
        markRootMutableRead(root, lane);
      } // If the source mutated between render and now,
      // there may be state updates already scheduled from the old source.
      // Entangle the updates so that they render in the same batch.


      markRootEntangled(root, root.mutableReadLanes);
    }
  }, [getSnapshot, source, subscribe]); // If we got a new source or subscribe function, re-subscribe in a passive effect.

  dispatcher.useEffect(() => {
    const handleChange = () => {
      const latestGetSnapshot = refs.getSnapshot;
      const latestSetSnapshot = refs.setSnapshot;

      try {
        latestSetSnapshot(latestGetSnapshot(source._source)); // Record a pending mutable source update with the same expiration time.

        const lane = requestUpdateLane(fiber);
        markRootMutableRead(root, lane);
      } catch (error) {
        // A selector might throw after a source mutation.
        // e.g. it might try to read from a part of the store that no longer exists.
        // In this case we should still schedule an update with React.
        // Worst case the selector will throw again and then an error boundary will handle it.
        latestSetSnapshot(() => {
          throw error;
        });
      }
    };

    const unsubscribe = subscribe(source._source, handleChange);
    return unsubscribe;
  }, [source, subscribe]); // If any of the inputs to useMutableSource change, reading is potentially unsafe.
  //
  // If either the source or the subscription have changed we can't can't trust the update queue.
  // Maybe the source changed in a way that the old subscription ignored but the new one depends on.
  //
  // If the getSnapshot function changed, we also shouldn't rely on the update queue.
  // It's possible that the underlying source was mutated between the when the last "change" event fired,
  // and when the current render (with the new getSnapshot function) is processed.
  //
  // In both cases, we need to throw away pending updates (since they are no longer relevant)
  // and treat reading from the source as we do in the mount case.

  if (!is(prevGetSnapshot, getSnapshot) || !is(prevSource, source) || !is(prevSubscribe, subscribe)) {
    // Create a new queue and setState method,
    // So if there are interleaved updates, they get pushed to the older queue.
    // When this becomes current, the previous queue and dispatch method will be discarded,
    // including any interleaving updates that occur.
    const newQueue = {
      pending: null,
      interleaved: null,
      lanes: NoLanes,
      dispatch: null,
      lastRenderedReducer: basicStateReducer,
      lastRenderedState: snapshot
    };
    newQueue.dispatch = setSnapshot = dispatchSetState.bind(null, currentlyRenderingFiber, newQueue);
    stateHook.queue = newQueue;
    stateHook.baseQueue = null;
    snapshot = readFromUnsubscribedMutableSource(root, source, getSnapshot);
    stateHook.memoizedState = stateHook.baseState = snapshot;
  }

  return snapshot;
}

function mountMutableSource(source, getSnapshot, subscribe) {
  if (!enableUseMutableSource) {
    return undefined;
  }

  const hook = mountWorkInProgressHook();
  hook.memoizedState = {
    refs: {
      getSnapshot,
      setSnapshot: null
    },
    source,
    subscribe
  };
  return useMutableSource(hook, source, getSnapshot, subscribe);
}

function updateMutableSource(source, getSnapshot, subscribe) {
  if (!enableUseMutableSource) {
    return undefined;
  }

  const hook = updateWorkInProgressHook();
  return useMutableSource(hook, source, getSnapshot, subscribe);
}

function mountSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
  const fiber = currentlyRenderingFiber;
  const hook = mountWorkInProgressHook();
  let nextSnapshot;
  const isHydrating = getIsHydrating();

  if (isHydrating) {
    if (getServerSnapshot === undefined) {
      throw new Error('Missing getServerSnapshot, which is required for ' + 'server-rendered content. Will revert to client rendering.');
    }

    nextSnapshot = getServerSnapshot();
  } else {
    nextSnapshot = getSnapshot(); // Unless we're rendering a blocking lane, schedule a consistency check.
    // Right before committing, we will walk the tree and check if any of the
    // stores were mutated.
    //
    // We won't do this if we're hydrating server-rendered content, because if
    // the content is stale, it's already visible anyway. Instead we'll patch
    // it up in a passive effect.

    const root = getWorkInProgressRoot();

    if (root === null) {
      throw new Error('Expected a work-in-progress root. This is a bug in React. Please file an issue.');
    }

    if (!includesBlockingLane(root, renderLanes)) {
      pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
    }
  } // Read the current snapshot from the store on every render. This breaks the
  // normal rules of React, and only works because store updates are
  // always synchronous.


  hook.memoizedState = nextSnapshot;
  const inst = {
    value: nextSnapshot,
    getSnapshot
  };
  hook.queue = inst; // Schedule an effect to subscribe to the store.

  mountEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [subscribe]); // Schedule an effect to update the mutable instance fields. We will update
  // this whenever subscribe, getSnapshot, or value changes. Because there's no
  // clean-up function, and we track the deps correctly, we can call pushEffect
  // directly, without storing any additional state. For the same reason, we
  // don't need to set a static flag, either.
  // TODO: We can move this to the passive phase once we add a pre-commit
  // consistency check. See the next comment.

  fiber.flags |= PassiveEffect;
  pushEffect(HookHasEffect | HookPassive, updateStoreInstance.bind(null, fiber, inst, nextSnapshot, getSnapshot), undefined, null);
  return nextSnapshot;
}

function updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
  const fiber = currentlyRenderingFiber;
  const hook = updateWorkInProgressHook(); // Read the current snapshot from the store on every render. This breaks the
  // normal rules of React, and only works because store updates are
  // always synchronous.

  const nextSnapshot = getSnapshot();
  const prevSnapshot = hook.memoizedState;
  const snapshotChanged = !is(prevSnapshot, nextSnapshot);

  if (snapshotChanged) {
    hook.memoizedState = nextSnapshot;
    markWorkInProgressReceivedUpdate();
  }

  const inst = hook.queue;
  updateEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [subscribe]); // Whenever getSnapshot or subscribe changes, we need to check in the
  // commit phase if there was an interleaved mutation. In concurrent mode
  // this can happen all the time, but even in synchronous mode, an earlier
  // effect may have mutated the store.

  if (inst.getSnapshot !== getSnapshot || snapshotChanged || // Check if the susbcribe function changed. We can save some memory by
  // checking whether we scheduled a subscription effect above.
  workInProgressHook !== null && workInProgressHook.memoizedState.tag & HookHasEffect) {
    fiber.flags |= PassiveEffect;
    pushEffect(HookHasEffect | HookPassive, updateStoreInstance.bind(null, fiber, inst, nextSnapshot, getSnapshot), undefined, null); // Unless we're rendering a blocking lane, schedule a consistency check.
    // Right before committing, we will walk the tree and check if any of the
    // stores were mutated.

    const root = getWorkInProgressRoot();

    if (root === null) {
      throw new Error('Expected a work-in-progress root. This is a bug in React. Please file an issue.');
    }

    if (!includesBlockingLane(root, renderLanes)) {
      pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
    }
  }

  return nextSnapshot;
}

function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
  fiber.flags |= StoreConsistency;
  const check = {
    getSnapshot,
    value: renderedSnapshot
  };
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;

  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.stores = [check];
  } else {
    const stores = componentUpdateQueue.stores;

    if (stores === null) {
      componentUpdateQueue.stores = [check];
    } else {
      stores.push(check);
    }
  }
}

function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
  // These are updated in the passive phase
  inst.value = nextSnapshot;
  inst.getSnapshot = getSnapshot; // Something may have been mutated in between render and commit. This could
  // have been in an event that fired before the passive effects, or it could
  // have been in a layout effect. In that case, we would have used the old
  // snapsho and getSnapshot values to bail out. We need to check one more time.

  if (checkIfSnapshotChanged(inst)) {
    // Force a re-render.
    forceStoreRerender(fiber);
  }
}

function subscribeToStore(fiber, inst, subscribe) {
  const handleStoreChange = () => {
    // The store changed. Check if the snapshot changed since the last time we
    // read from the store.
    if (checkIfSnapshotChanged(inst)) {
      // Force a re-render.
      forceStoreRerender(fiber);
    }
  }; // Subscribe to the store and return a clean-up function.


  return subscribe(handleStoreChange);
}

function checkIfSnapshotChanged(inst) {
  const latestGetSnapshot = inst.getSnapshot;
  const prevValue = inst.value;

  try {
    const nextValue = latestGetSnapshot();
    return !is(prevValue, nextValue);
  } catch (error) {
    return true;
  }
}

function forceStoreRerender(fiber) {
  const root = enqueueConcurrentRenderForLane(fiber, SyncLane);

  if (root !== null) {
    scheduleUpdateOnFiber(root, fiber, SyncLane, NoTimestamp);
  }
}

function mountState(initialState) {
  const hook = mountWorkInProgressHook();

  if (typeof initialState === 'function') {
    // $FlowFixMe: Flow doesn't like mixed types
    initialState = initialState();
  }

  hook.memoizedState = hook.baseState = initialState;
  const queue = {
    pending: null,
    interleaved: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState
  };
  hook.queue = queue;
  const dispatch = queue.dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
  return [hook.memoizedState, dispatch];
}

function updateState(initialState) {
  return updateReducer(basicStateReducer, initialState);
}

function rerenderState(initialState) {
  return rerenderReducer(basicStateReducer, initialState);
}

function pushEffect(tag, create, destroy, deps) {
  const effect = {
    tag,
    create,
    destroy,
    deps,
    // Circular
    next: null
  };
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;

  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;

    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }

  return effect;
}

let stackContainsErrorMessage = null;

function getCallerStackFrame() {
  // eslint-disable-next-line react-internal/prod-error-codes
  const stackFrames = new Error('Error message').stack.split('\n'); // Some browsers (e.g. Chrome) include the error message in the stack
  // but others (e.g. Firefox) do not.

  if (stackContainsErrorMessage === null) {
    stackContainsErrorMessage = stackFrames[0].includes('Error message');
  }

  return stackContainsErrorMessage ? stackFrames.slice(3, 4).join('\n') : stackFrames.slice(2, 3).join('\n');
}

function mountRef(initialValue) {
  const hook = mountWorkInProgressHook();

  if (enableUseRefAccessWarning) {
    const ref = {
      current: initialValue
    };
    hook.memoizedState = ref;
    return ref;
  } else {
    const ref = {
      current: initialValue
    };
    hook.memoizedState = ref;
    return ref;
  }
}

function updateRef(initialValue) {
  const hook = updateWorkInProgressHook();
  return hook.memoizedState;
}

function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, undefined, nextDeps);
}

function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destroy = undefined;

  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;

    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;

      if (areHookInputsEqual(nextDeps, prevDeps)) {
        hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps);
        return;
      }
    }
  }

  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(HookHasEffect | hookFlags, create, destroy, nextDeps);
}

function mountEffect(create, deps) {
  return mountEffectImpl(PassiveEffect | PassiveStaticEffect, HookPassive, create, deps);
}

function updateEffect(create, deps) {
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}

function mountInsertionEffect(create, deps) {
  return mountEffectImpl(UpdateEffect, HookInsertion, create, deps);
}

function updateInsertionEffect(create, deps) {
  return updateEffectImpl(UpdateEffect, HookInsertion, create, deps);
}

function mountLayoutEffect(create, deps) {
  let fiberFlags = UpdateEffect | LayoutStaticEffect;
  return mountEffectImpl(fiberFlags, HookLayout, create, deps);
}

function updateLayoutEffect(create, deps) {
  return updateEffectImpl(UpdateEffect, HookLayout, create, deps);
}

function imperativeHandleEffect(create, ref) {
  if (typeof ref === 'function') {
    const refCallback = ref;
    const inst = create();
    refCallback(inst);
    return () => {
      refCallback(null);
    };
  } else if (ref !== null && ref !== undefined) {
    const refObject = ref;
    const inst = create();
    refObject.current = inst;
    return () => {
      refObject.current = null;
    };
  }
}

function mountImperativeHandle(ref, create, deps) {
  // TODO: If deps are provided, should we skip comparing the ref itself?
  const effectDeps = deps !== null && deps !== undefined ? deps.concat([ref]) : null;
  let fiberFlags = UpdateEffect | LayoutStaticEffect;
  return mountEffectImpl(fiberFlags, HookLayout, imperativeHandleEffect.bind(null, create, ref), effectDeps);
}

function updateImperativeHandle(ref, create, deps) {
  // TODO: If deps are provided, should we skip comparing the ref itself?
  const effectDeps = deps !== null && deps !== undefined ? deps.concat([ref]) : null;
  return updateEffectImpl(UpdateEffect, HookLayout, imperativeHandleEffect.bind(null, create, ref), effectDeps);
}

function mountDebugValue(value, formatterFn) {// This hook is normally a no-op.
  // The react-debug-hooks package injects its own implementation
  // so that e.g. DevTools can display custom hook values.
}

const updateDebugValue = mountDebugValue;

function mountCallback(callback, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  hook.memoizedState = [callback, nextDeps];
  return callback;
}

function updateCallback(callback, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;

  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps = prevState[1];

      if (areHookInputsEqual(nextDeps, prevDeps)) {
        return prevState[0];
      }
    }
  }

  hook.memoizedState = [callback, nextDeps];
  return callback;
}

function mountMemo(nextCreate, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

function updateMemo(nextCreate, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;

  if (prevState !== null) {
    // Assume these are defined. If they're not, areHookInputsEqual will warn.
    if (nextDeps !== null) {
      const prevDeps = prevState[1];

      if (areHookInputsEqual(nextDeps, prevDeps)) {
        return prevState[0];
      }
    }
  }

  const nextValue = nextCreate();
  hook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

function mountDeferredValue(value) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = value;
  return value;
}

function updateDeferredValue(value) {
  const hook = updateWorkInProgressHook();
  const resolvedCurrentHook = currentHook;
  const prevValue = resolvedCurrentHook.memoizedState;
  return updateDeferredValueImpl(hook, prevValue, value);
}

function rerenderDeferredValue(value) {
  const hook = updateWorkInProgressHook();

  if (currentHook === null) {
    // This is a rerender during a mount.
    hook.memoizedState = value;
    return value;
  } else {
    // This is a rerender during an update.
    const prevValue = currentHook.memoizedState;
    return updateDeferredValueImpl(hook, prevValue, value);
  }
}

function updateDeferredValueImpl(hook, prevValue, value) {
  const shouldDeferValue = !includesOnlyNonUrgentLanes(renderLanes);

  if (shouldDeferValue) {
    // This is an urgent update. If the value has changed, keep using the
    // previous value and spawn a deferred render to update it later.
    if (!is(value, prevValue)) {
      // Schedule a deferred render
      const deferredLane = claimNextTransitionLane();
      currentlyRenderingFiber.lanes = mergeLanes(currentlyRenderingFiber.lanes, deferredLane);
      markSkippedUpdateLanes(deferredLane); // Set this to true to indicate that the rendered value is inconsistent
      // from the latest value. The name "baseState" doesn't really match how we
      // use it because we're reusing a state hook field instead of creating a
      // new one.

      hook.baseState = true;
    } // Reuse the previous value


    return prevValue;
  } else {
    // This is not an urgent update, so we can use the latest value regardless
    // of what it is. No need to defer it.
    // However, if we're currently inside a spawned render, then we need to mark
    // this as an update to prevent the fiber from bailing out.
    //
    // `baseState` is true when the current value is different from the rendered
    // value. The name doesn't really match how we use it because we're reusing
    // a state hook field instead of creating a new one.
    if (hook.baseState) {
      // Flip this back to false.
      hook.baseState = false;
      markWorkInProgressReceivedUpdate();
    }

    hook.memoizedState = value;
    return value;
  }
}

function startTransition(setPending, callback, options) {
  const previousPriority = getCurrentUpdatePriority();
  setCurrentUpdatePriority(higherEventPriority(previousPriority, ContinuousEventPriority));
  setPending(true);
  const prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = {};
  const currentTransition = ReactCurrentBatchConfig.transition;

  if (enableTransitionTracing) {
    if (options !== undefined && options.name !== undefined) {
      ReactCurrentBatchConfig.transition.name = options.name;
      ReactCurrentBatchConfig.transition.startTime = now();
    }
  }

  try {
    setPending(false);
    callback();
  } finally {
    setCurrentUpdatePriority(previousPriority);
    ReactCurrentBatchConfig.transition = prevTransition;
  }
}

function mountTransition() {
  const [isPending, setPending] = mountState(false); // The `start` method never changes.

  const start = startTransition.bind(null, setPending);
  const hook = mountWorkInProgressHook();
  hook.memoizedState = start;
  return [isPending, start];
}

function updateTransition() {
  const [isPending] = updateState(false);
  const hook = updateWorkInProgressHook();
  const start = hook.memoizedState;
  return [isPending, start];
}

function rerenderTransition() {
  const [isPending] = rerenderState(false);
  const hook = updateWorkInProgressHook();
  const start = hook.memoizedState;
  return [isPending, start];
}

let isUpdatingOpaqueValueInRenderPhase = false;
export function getIsUpdatingOpaqueValueInRenderPhaseInDEV() {}

function mountId() {
  const hook = mountWorkInProgressHook();
  const root = getWorkInProgressRoot(); // TODO: In Fizz, id generation is specific to each server config. Maybe we
  // should do this in Fiber, too? Deferring this decision for now because
  // there's no other place to store the prefix except for an internal field on
  // the public createRoot object, which the fiber tree does not currently have
  // a reference to.

  const identifierPrefix = root.identifierPrefix;
  let id;

  if (getIsHydrating()) {
    const treeId = getTreeId(); // Use a captial R prefix for server-generated ids.

    id = ':' + identifierPrefix + 'R' + treeId; // Unless this is the first id at this level, append a number at the end
    // that represents the position of this useId hook among all the useId
    // hooks for this fiber.

    const localId = localIdCounter++;

    if (localId > 0) {
      id += 'H' + localId.toString(32);
    }

    id += ':';
  } else {
    // Use a lowercase r prefix for client-generated ids.
    const globalClientId = globalClientIdCounter++;
    id = ':' + identifierPrefix + 'r' + globalClientId.toString(32) + ':';
  }

  hook.memoizedState = id;
  return id;
}

function updateId() {
  const hook = updateWorkInProgressHook();
  const id = hook.memoizedState;
  return id;
}

function mountRefresh() {
  const hook = mountWorkInProgressHook();
  const refresh = hook.memoizedState = refreshCache.bind(null, currentlyRenderingFiber);
  return refresh;
}

function updateRefresh() {
  const hook = updateWorkInProgressHook();
  return hook.memoizedState;
}

function refreshCache(fiber, seedKey, seedValue) {
  if (!enableCache) {
    return;
  } // TODO: Does Cache work in legacy mode? Should decide and write a test.
  // TODO: Consider warning if the refresh is at discrete priority, or if we
  // otherwise suspect that it wasn't batched properly.


  let provider = fiber.return;

  while (provider !== null) {
    switch (provider.tag) {
      case CacheComponent:
      case HostRoot:
        {
          // Schedule an update on the cache boundary to trigger a refresh.
          const lane = requestUpdateLane(provider);
          const eventTime = requestEventTime();
          const refreshUpdate = createLegacyQueueUpdate(eventTime, lane);
          const root = enqueueLegacyQueueUpdate(provider, refreshUpdate, lane);

          if (root !== null) {
            scheduleUpdateOnFiber(root, provider, lane, eventTime);
            entangleLegacyQueueTransitions(root, provider, lane);
          } // TODO: If a refresh never commits, the new cache created here must be
          // released. A simple case is start refreshing a cache boundary, but then
          // unmount that boundary before the refresh completes.


          const seededCache = createCache();

          if (seedKey !== null && seedKey !== undefined && root !== null) {
            // Seed the cache with the value passed by the caller. This could be
            // from a server mutation, or it could be a streaming response.
            seededCache.data.set(seedKey, seedValue);
          }

          const payload = {
            cache: seededCache
          };
          refreshUpdate.payload = payload;
          return;
        }
    }

    provider = provider.return;
  } // TODO: Warn if unmounted?

}

function dispatchReducerAction(fiber, queue, action) {
  const lane = requestUpdateLane(fiber);
  const update = {
    lane,
    action,
    hasEagerState: false,
    eagerState: null,
    next: null
  };

  if (isRenderPhaseUpdate(fiber)) {
    enqueueRenderPhaseUpdate(queue, update);
  } else {
    const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);

    if (root !== null) {
      const eventTime = requestEventTime();
      scheduleUpdateOnFiber(root, fiber, lane, eventTime);
      entangleTransitionUpdate(root, queue, lane);
    }
  }

  markUpdateInDevTools(fiber, lane, action);
}

function dispatchSetState(fiber, queue, action) {
  const lane = requestUpdateLane(fiber);
  const update = {
    lane,
    action,
    hasEagerState: false,
    eagerState: null,
    next: null
  };

  if (isRenderPhaseUpdate(fiber)) {
    enqueueRenderPhaseUpdate(queue, update);
  } else {
    const alternate = fiber.alternate;

    if (fiber.lanes === NoLanes && (alternate === null || alternate.lanes === NoLanes)) {
      // The queue is currently empty, which means we can eagerly compute the
      // next state before entering the render phase. If the new state is the
      // same as the current state, we may be able to bail out entirely.
      const lastRenderedReducer = queue.lastRenderedReducer;

      if (lastRenderedReducer !== null) {
        let prevDispatcher;

        try {
          const currentState = queue.lastRenderedState;
          const eagerState = lastRenderedReducer(currentState, action); // Stash the eagerly computed state, and the reducer used to compute
          // it, on the update object. If the reducer hasn't changed by the
          // time we enter the render phase, then the eager state can be used
          // without calling the reducer again.

          update.hasEagerState = true;
          update.eagerState = eagerState;

          if (is(eagerState, currentState)) {
            // Fast path. We can bail out without scheduling React to re-render.
            // It's still possible that we'll need to rebase this update later,
            // if the component re-renders for a different reason and by that
            // time the reducer has changed.
            // TODO: Do we still need to entangle transitions in this case?
            enqueueConcurrentHookUpdateAndEagerlyBailout(fiber, queue, update, lane);
            return;
          }
        } catch (error) {// Suppress the error. It will throw again in the render phase.
        } finally {}
      }
    }

    const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);

    if (root !== null) {
      const eventTime = requestEventTime();
      scheduleUpdateOnFiber(root, fiber, lane, eventTime);
      entangleTransitionUpdate(root, queue, lane);
    }
  }

  markUpdateInDevTools(fiber, lane, action);
}

function isRenderPhaseUpdate(fiber) {
  const alternate = fiber.alternate;
  return fiber === currentlyRenderingFiber || alternate !== null && alternate === currentlyRenderingFiber;
}

function enqueueRenderPhaseUpdate(queue, update) {
  // This is a render phase update. Stash it in a lazily-created map of
  // queue -> linked list of updates. After this render pass, we'll restart
  // and apply the stashed updates on top of the work-in-progress hook.
  didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
  const pending = queue.pending;

  if (pending === null) {
    // This is the first update. Create a circular list.
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }

  queue.pending = update;
} // TODO: Move to ReactFiberConcurrentUpdates?


function entangleTransitionUpdate(root, queue, lane) {
  if (isTransitionLane(lane)) {
    let queueLanes = queue.lanes; // If any entangled lanes are no longer pending on the root, then they
    // must have finished. We can remove them from the shared queue, which
    // represents a superset of the actually pending lanes. In some cases we
    // may entangle more than we need to, but that's OK. In fact it's worse if
    // we *don't* entangle when we should.

    queueLanes = intersectLanes(queueLanes, root.pendingLanes); // Entangle the new transition lane with the other transition lanes.

    const newQueueLanes = mergeLanes(queueLanes, lane);
    queue.lanes = newQueueLanes; // Even if queue.lanes already include lane, we don't know for certain if
    // the lane finished since the last time we entangled it. So we need to
    // entangle it again, just to be sure.

    markRootEntangled(root, newQueueLanes);
  }
}

function markUpdateInDevTools(fiber, lane, action) {
  if (enableSchedulingProfiler) {
    markStateUpdateScheduled(fiber, lane);
  }
}

function getCacheSignal() {
  if (!enableCache) {
    throw new Error('Not implemented.');
  }

  const cache = readContext(CacheContext);
  return cache.controller.signal;
}

function getCacheForType(resourceType) {
  if (!enableCache) {
    throw new Error('Not implemented.');
  }

  const cache = readContext(CacheContext);
  let cacheForType = cache.data.get(resourceType);

  if (cacheForType === undefined) {
    cacheForType = resourceType();
    cache.data.set(resourceType, cacheForType);
  }

  return cacheForType;
}

export const ContextOnlyDispatcher = {
  readContext,
  useCallback: throwInvalidHookError,
  useContext: throwInvalidHookError,
  useEffect: throwInvalidHookError,
  useImperativeHandle: throwInvalidHookError,
  useInsertionEffect: throwInvalidHookError,
  useLayoutEffect: throwInvalidHookError,
  useMemo: throwInvalidHookError,
  useReducer: throwInvalidHookError,
  useRef: throwInvalidHookError,
  useState: throwInvalidHookError,
  useDebugValue: throwInvalidHookError,
  useDeferredValue: throwInvalidHookError,
  useTransition: throwInvalidHookError,
  useMutableSource: throwInvalidHookError,
  useSyncExternalStore: throwInvalidHookError,
  useId: throwInvalidHookError,
  unstable_isNewReconciler: enableNewReconciler
};

if (enableCache) {
  ContextOnlyDispatcher.getCacheSignal = getCacheSignal;
  ContextOnlyDispatcher.getCacheForType = getCacheForType;
  ContextOnlyDispatcher.useCacheRefresh = throwInvalidHookError;
}

const HooksDispatcherOnMount = {
  readContext,
  useCallback: mountCallback,
  useContext: readContext,
  useEffect: mountEffect,
  useImperativeHandle: mountImperativeHandle,
  useLayoutEffect: mountLayoutEffect,
  useInsertionEffect: mountInsertionEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
  useDebugValue: mountDebugValue,
  useDeferredValue: mountDeferredValue,
  useTransition: mountTransition,
  useMutableSource: mountMutableSource,
  useSyncExternalStore: mountSyncExternalStore,
  useId: mountId,
  unstable_isNewReconciler: enableNewReconciler
};

if (enableCache) {
  HooksDispatcherOnMount.getCacheSignal = getCacheSignal;
  HooksDispatcherOnMount.getCacheForType = getCacheForType;
  HooksDispatcherOnMount.useCacheRefresh = mountRefresh;
}

const HooksDispatcherOnUpdate = {
  readContext,
  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useInsertionEffect: updateInsertionEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState,
  useDebugValue: updateDebugValue,
  useDeferredValue: updateDeferredValue,
  useTransition: updateTransition,
  useMutableSource: updateMutableSource,
  useSyncExternalStore: updateSyncExternalStore,
  useId: updateId,
  unstable_isNewReconciler: enableNewReconciler
};

if (enableCache) {
  HooksDispatcherOnUpdate.getCacheSignal = getCacheSignal;
  HooksDispatcherOnUpdate.getCacheForType = getCacheForType;
  HooksDispatcherOnUpdate.useCacheRefresh = updateRefresh;
}

const HooksDispatcherOnRerender = {
  readContext,
  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useInsertionEffect: updateInsertionEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: rerenderReducer,
  useRef: updateRef,
  useState: rerenderState,
  useDebugValue: updateDebugValue,
  useDeferredValue: rerenderDeferredValue,
  useTransition: rerenderTransition,
  useMutableSource: updateMutableSource,
  useSyncExternalStore: updateSyncExternalStore,
  useId: updateId,
  unstable_isNewReconciler: enableNewReconciler
};

if (enableCache) {
  HooksDispatcherOnRerender.getCacheSignal = getCacheSignal;
  HooksDispatcherOnRerender.getCacheForType = getCacheForType;
  HooksDispatcherOnRerender.useCacheRefresh = updateRefresh;
}

let HooksDispatcherOnMountInDEV = null;
let HooksDispatcherOnMountWithHookTypesInDEV = null;
let HooksDispatcherOnUpdateInDEV = null;
let HooksDispatcherOnRerenderInDEV = null;
let InvalidNestedHooksDispatcherOnMountInDEV = null;
let InvalidNestedHooksDispatcherOnUpdateInDEV = null;
let InvalidNestedHooksDispatcherOnRerenderInDEV = null;