/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */
import { enableCreateEventHandleAPI } from '../../shared/ReactFeatureFlags'; // Don't change these two values. They're used by React Dev Tools.

export const NoFlags = /*                      */ 0b00000000000000000000000000;
export const PerformedWork = /*                */ 0b00000000000000000000000001; // You can change the rest (and add more).
export const Placement = /*                    */ 0b00000000000000000000000010;
export const Update = /*                       */ 0b00000000000000000000000100;
export const Deletion = /*                     */ 0b00000000000000000000001000;
export const ChildDeletion = /*                */ 0b00000000000000000000010000;
export const ContentReset = /*                 */ 0b00000000000000000000100000;
export const Callback = /*                     */ 0b00000000000000000001000000;
export const DidCapture = /*                   */ 0b00000000000000000010000000;
export const ForceClientRender = /*            */ 0b00000000000000000100000000;
export const Ref = /*                          */ 0b00000000000000001000000000;
export const Snapshot = /*                     */ 0b00000000000000010000000000;
export const Passive = /*                      */ 0b00000000000000100000000000;
export const Hydrating = /*                    */ 0b00000000000001000000000000;
export const Visibility = /*                   */ 0b00000000000010000000000000;
export const StoreConsistency = /*             */ 0b00000000000100000000000000;
export const LifecycleEffectMask = Passive | Update | Callback | Ref | Snapshot | StoreConsistency; 
//           LifecycleEffectMask /*         */ // 0b00000000000100111001000100
// Union of all commit flags (flags with the lifetime of a particular commit)
// 所有提交标志的联合（带有特定提交生命周期的标志）

export const HostEffectMask = /*               */ 0b00000000000111111111111111; 
// These are not really side effects, but we still reuse this field.
// 这些并不是真正的副作用，但我们仍然重用这个字段。

export const Incomplete = /*                   */ 0b00000000001000000000000000;
export const ShouldCapture = /*                */ 0b00000000010000000000000000;
export const ForceUpdateForLegacySuspense = /* */ 0b00000000100000000000000000;
export const DidPropagateContext = /*          */ 0b00000001000000000000000000;
export const NeedsPropagation = /*             */ 0b00000010000000000000000000;
export const Forked = /*                       */ 0b00000100000000000000000000; // Static tags describe aspects of a fiber that are not specific to a render,
// e.g. a fiber uses a passive effect (even if there are no updates on this particular render).
// This enables us to defer more work in the unmount case,
// since we can defer traversing the tree during layout to look for Passive effects,
// and instead rely on the static flag as a signal that there may be cleanup work.
/**
 * 例如 fiber使用被动效果（即使此特定渲染没有更新）。 
 * 这使我们能够在卸载情况下推迟更多工作， 
 * 因为我们可以在布局期间推迟遍历树来寻找被动效果， 
 * 而是依靠静态标志作为可能有清理工作的信号。
 */

export const RefStatic = /*                    */ 0b00001000000000000000000000;
export const LayoutStatic = /*                 */ 0b00010000000000000000000000;
export const PassiveStatic = /*                */ 0b00100000000000000000000000; // These flags allow us to traverse to fibers that have effects on mount
// without traversing the entire tree after every commit for
// double invoking
// 每次提交后无需遍历整个树以进行双重调用

export const MountLayoutDev = /*               */ 0b01000000000000000000000000;
export const MountPassiveDev = /*              */ 0b10000000000000000000000000; // Groups of flags that are used in the commit phase to skip over trees that
// don't contain effects, by checking subtreeFlags.

export const BeforeMutationMask = // TODO: Remove Update flag from before mutation phase by re-landing Visibility
// flag logic (see #20043)
Update | Snapshot | (enableCreateEventHandleAPI ? // createEventHandle needs to visit deleted and hidden trees to
// fire beforeblur
// TODO: Only need to visit Deletions during BeforeMutation phase if an
// element is focused.
ChildDeletion | Visibility : 0);
export const MutationMask = Placement | Update | ChildDeletion | ContentReset | Ref | Hydrating | Visibility;
export const LayoutMask = Update | Callback | Ref | Visibility; // TODO: Split into PassiveMountMask and PassiveUnmountMask

export const PassiveMask = Passive | ChildDeletion; // Union of tags that don't get reset on clones.
// This allows certain concepts to persist without recalculating them,
// e.g. whether a subtree contains passive effects or portals.
/**
 * 不会在克隆上重置的标签联合。 这允许某些概念在不重新计算的情况下持续存在，例如 子树是否包含被动效果或门户。
 */

export const StaticMask = LayoutStatic | PassiveStatic | RefStatic;