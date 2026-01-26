# Bolt's Journal - Performance Learnings

## 2025-05-14 - Canvas RAF Leak and Loop Optimization
**Learning:** In a single-page application or a landing page with an "entry overlay," `requestAnimationFrame` loops used for background effects (like a flicker grid) often continue to run even after the overlay is hidden (`is-hidden`). This consumes CPU/GPU resources indefinitely. Additionally, setting `ctx.fillStyle` and performing string concatenations (like `rgba()`) inside nested loops is a significant bottleneck.
**Action:** Always include a visibility check or a "kill switch" in RAF loops. Use `ctx.globalAlpha` to handle opacity instead of recreating `rgba` strings in every iteration, and hoist constant calculations/canvas state changes out of loops.
