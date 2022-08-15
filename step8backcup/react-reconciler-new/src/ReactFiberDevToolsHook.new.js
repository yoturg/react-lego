/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
// import type {DevToolsProfilingHooks} from 'react-devtools-shared/src/backend/types';
// TODO: This import doesn't work because the DevTools depend on the DOM version of React
// and to properly type check against DOM React we can't also type check again non-DOM
// React which this hook might be in.
import { DidCapture } from './ReactFiberFlags';
import { enableProfilerTimer, enableSchedulingProfiler } from '../../shared/ReactFeatureFlags';
import { DiscreteEventPriority, ContinuousEventPriority, DefaultEventPriority, IdleEventPriority } from './ReactEventPriorities.new';
import { ImmediatePriority as ImmediateSchedulerPriority, UserBlockingPriority as UserBlockingSchedulerPriority, NormalPriority as NormalSchedulerPriority, IdlePriority as IdleSchedulerPriority } from './Scheduler';
let rendererID = null;
let injectedHook = null;
let injectedProfilingHooks = null;
export function onCommitRoot(root, eventPriority) {
  if (injectedHook && typeof injectedHook.onCommitFiberRoot === 'function') {
    try {
      const didError = (root.current.flags & DidCapture) === DidCapture;

      if (enableProfilerTimer) {
        let schedulerPriority;

        switch (eventPriority) {
          case DiscreteEventPriority:
            schedulerPriority = ImmediateSchedulerPriority;
            break;

          case ContinuousEventPriority:
            schedulerPriority = UserBlockingSchedulerPriority;
            break;

          case DefaultEventPriority:
            schedulerPriority = NormalSchedulerPriority;
            break;

          case IdleEventPriority:
            schedulerPriority = IdleSchedulerPriority;
            break;

          default:
            schedulerPriority = NormalSchedulerPriority;
            break;
        }

        injectedHook.onCommitFiberRoot(rendererID, root, schedulerPriority, didError);
      } else {
        injectedHook.onCommitFiberRoot(rendererID, root, undefined, didError);
      }
    } catch (err) {}
  }
}
export function onPostCommitRoot(root) {
  if (injectedHook && typeof injectedHook.onPostCommitFiberRoot === 'function') {
    try {
      injectedHook.onPostCommitFiberRoot(rendererID, root);
    } catch (err) {}
  }
}
export function onCommitUnmount(fiber) {
  if (injectedHook && typeof injectedHook.onCommitFiberUnmount === 'function') {
    try {
      injectedHook.onCommitFiberUnmount(rendererID, fiber);
    } catch (err) {}
  }
} // Profiler API hooks

export function markCommitStarted(lanes) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markCommitStarted === 'function') {
      injectedProfilingHooks.markCommitStarted(lanes);
    }
  }
}
export function markCommitStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markCommitStopped === 'function') {
      injectedProfilingHooks.markCommitStopped();
    }
  }
}
export function markComponentRenderStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentRenderStopped === 'function') {
      injectedProfilingHooks.markComponentRenderStopped();
    }
  }
}
export function markComponentPassiveEffectMountStarted(fiber) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentPassiveEffectMountStarted === 'function') {
      injectedProfilingHooks.markComponentPassiveEffectMountStarted(fiber);
    }
  }
}
export function markComponentPassiveEffectMountStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentPassiveEffectMountStopped === 'function') {
      injectedProfilingHooks.markComponentPassiveEffectMountStopped();
    }
  }
}
export function markComponentPassiveEffectUnmountStarted(fiber) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentPassiveEffectUnmountStarted === 'function') {
      injectedProfilingHooks.markComponentPassiveEffectUnmountStarted(fiber);
    }
  }
}
export function markComponentPassiveEffectUnmountStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentPassiveEffectUnmountStopped === 'function') {
      injectedProfilingHooks.markComponentPassiveEffectUnmountStopped();
    }
  }
}
export function markComponentLayoutEffectMountStarted(fiber) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentLayoutEffectMountStarted === 'function') {
      injectedProfilingHooks.markComponentLayoutEffectMountStarted(fiber);
    }
  }
}
export function markComponentLayoutEffectMountStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentLayoutEffectMountStopped === 'function') {
      injectedProfilingHooks.markComponentLayoutEffectMountStopped();
    }
  }
}
export function markComponentLayoutEffectUnmountStarted(fiber) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentLayoutEffectUnmountStarted === 'function') {
      injectedProfilingHooks.markComponentLayoutEffectUnmountStarted(fiber);
    }
  }
}
export function markComponentLayoutEffectUnmountStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentLayoutEffectUnmountStopped === 'function') {
      injectedProfilingHooks.markComponentLayoutEffectUnmountStopped();
    }
  }
}
export function markComponentErrored(fiber, thrownValue, lanes) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentErrored === 'function') {
      injectedProfilingHooks.markComponentErrored(fiber, thrownValue, lanes);
    }
  }
}
export function markComponentSuspended(fiber, wakeable, lanes) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markComponentSuspended === 'function') {
      injectedProfilingHooks.markComponentSuspended(fiber, wakeable, lanes);
    }
  }
}
export function markLayoutEffectsStarted(lanes) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markLayoutEffectsStarted === 'function') {
      injectedProfilingHooks.markLayoutEffectsStarted(lanes);
    }
  }
}
export function markLayoutEffectsStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markLayoutEffectsStopped === 'function') {
      injectedProfilingHooks.markLayoutEffectsStopped();
    }
  }
}
export function markPassiveEffectsStarted(lanes) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markPassiveEffectsStarted === 'function') {
      injectedProfilingHooks.markPassiveEffectsStarted(lanes);
    }
  }
}
export function markPassiveEffectsStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markPassiveEffectsStopped === 'function') {
      injectedProfilingHooks.markPassiveEffectsStopped();
    }
  }
}
export function markRenderStarted(lanes) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderStarted === 'function') {
      injectedProfilingHooks.markRenderStarted(lanes);
    }
  }
}
export function markRenderYielded() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderYielded === 'function') {
      injectedProfilingHooks.markRenderYielded();
    }
  }
}
export function markRenderStopped() {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderStopped === 'function') {
      injectedProfilingHooks.markRenderStopped();
    }
  }
}
export function markRenderScheduled(lane) {
  if (enableSchedulingProfiler) {
    if (injectedProfilingHooks !== null && typeof injectedProfilingHooks.markRenderScheduled === 'function') {
      injectedProfilingHooks.markRenderScheduled(lane);
    }
  }
}