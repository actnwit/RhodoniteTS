# Scene graph world-matrix update

Code: `src/foundation/components/SceneGraph/SceneGraphComponent.ts`, `ComponentRepository._componentCreationCount`.

## Adopted

- **Skipping unchanged nodes.** `SceneGraphComponent.$logic` returns early when its `worldMatrixVersion` has not
  changed since the last `logicForce`. Meshes attached later are caught through
  `ComponentRepository._componentCreationCount`.
- **Pruned upward AABB invalidation.** `setWorldAABBDirtyParentRecursively` marks each visited node with the current
  `__aabbDirtyChainEpoch`, and stops at a node already marked in this epoch. Advancing the static epoch invalidates
  every mark at once.

## Rejected

- **A flattened parent-before-child pass**, as in Unity and Bevy, driven by `TransformComponent.common_$logic`. It was
  equal to or slower than the adopted version: static scenes went from 0.40 to 0.66 ms, because the common pass
  scans every transform, and a full-tree change ran at 0.83–1.0× the speed. The cost is dominated by each node's
  matrix composition and 4×4 multiply, not by the traversal.

  A DFS-ordered flat array was also ~2× slower than a level order sorted by SID when entities are not created in
  hierarchy order, because of memory locality.
- **Per-node dirty bit flags by depth.** Rejected on analysis: reads are already O(1), setting the bits still needs
  the subtree walk, and there is a depth limit of 32.

## Measurements (2026-11-20)

| Scene | Before | After |
|---|---|---|
| Static 11k nodes, 10 moving leaves | 1.7–1.95 ms | 0.4 ms |
| 40 spring chains, depth 64 | 1.7–2.3 ms | 1.1–1.3 ms |
| 40 humanoids | ~1.1 ms | ~0.9 ms |
| Whole tree moving | — | no change (±15% run-to-run noise) |

In RhodoniteEditor2 (production build, WebGPU, simple mode), orbiting the camera around `NodePerformanceTest.glb`
(10k nodes) took `engine.process` from 7.4–7.6 to 5.3–5.4 ms. The SceneGraph Logic stage went from 2.4–2.5 to
0.27 ms per frame. Dragging the camera writes ~7 transforms per frame (gizmos and editor state), and before this
change that forced `logicForce` on all 10k nodes.

## Benchmark harness

Use a Vitest config whose `root` is the repository, with an environment variable that selects a git worktree to
benchmark (symlink its `node_modules`). Dynamic-import `${worktree}/src/...`, and run the Load stage once so that
the components reach Logic. For a CPU profile in Node, run with `--pool=forks --execArgv=--cpu-prof`.
