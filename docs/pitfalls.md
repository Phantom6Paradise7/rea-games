# Pitfalls

Mistakes already made in this repository, each with the rule that prevents it. Add one in the same change whenever a
mistake is worth not repeating.

**A fixture with wrong tile positions made the original misbehave.** 2048 moves tiles by their own `x`/`y`, not by their
place in the grid, so a saved game built with every `position.x = 0` produced a trace no sane port could match. Build
fixtures so every field agrees with the cell it sits in, and look at a few steps of each hand-made case.

**A stale snapshot was recorded as truth.** 2048's `keepPlaying` never calls the actuator, so the last actuated state
still said "terminated" and the port correctly said it was not. Read state from the live game object, not from the
last callback.

**Comparing JSON as text failed a correct Rust port.** `serde_json` sorts keys, JavaScript keeps insertion order, and every
case "differed". Compare parsed values (`lib/compare.mjs`), never `JSON.stringify` output.

**A check that cannot fail looks like a pass.** After a port is green, break it three ways (a constant, a branch, an
offset) and watch `verify` fail each time; otherwise the cases may not reach the code you think they do.

**Third-party libraries can consume `Math.random()` before the game starts.** jQuery 1.8.3 calls `Math.random()` twice during initialization, which prepended two stray draws to `tape` and shifted every mine placement. Reset the RNG tape after page load finishes so `tape` records only calls from the game itself.