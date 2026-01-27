# Bolt's Journal - Critical Learnings

## 2025-05-15 - [Optimization: Canvas Grid Rendering]
**Learning:** String concatenation for colors (e.g., `rgba(r, g, b, ${opacity})`) inside a high-frequency loop is a major CPU bottleneck in Canvas. The browser must parse the string and calculate color values for every call.
**Action:** Always hoist `ctx.fillStyle` outside the loop if the base color is constant, and use `ctx.globalAlpha` for opacity. This improved rendering performance by reducing overhead and allowing the browser's 2D context to stay in a "hot" state.

## 2025-05-15 - [Optimization: Random Updates]
**Learning:** Iterating over a large array to perform conditional random updates (O(N)) is significantly slower than calculating the expected number of updates and picking random indices (O(updates)).
**Action:** For "flicker" or "starfield" effects, calculate the number of items to change based on `deltaTime` and update only that subset.
