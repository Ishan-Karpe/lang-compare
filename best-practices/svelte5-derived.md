# Svelte 5 Derived State (`$derived`)

Derived state creates reactive values that automatically update when their dependencies change. Use [`$derived`](https://svelte.dev/docs/runes#$derived) for simple expressions and [`$derived.by`](https://svelte.dev/docs/runes#$derived-by) for complex computations.

## Basic Usage

```svelte
<script>
	let count = $state(0);
	let doubled = $derived(count * 2);
</script>

<button onclick={() => count++}>{doubled}</button>
```

## Complex Derivations

For complex logic, use `$derived.by` with a function:

```js
let numbers = $state([1, 2, 3]);
let total = $derived.by(() => {
	let sum = 0;
	for (const n of numbers) sum += n;
	return sum;
});
```

## Key Concepts

- **Dependencies**: Any state read inside `$derived` becomes a dependency
- **Side-effects**: Expressions must be pure (no state mutations)
- **Class fields**: Can be marked as `$derived`
- **Overridable**: Derived values can be temporarily reassigned (since Svelte 5.25+)
- **Reactivity**: Unlike `$state`, derived values are not deeply reactive proxies
- **Push-pull**: Dependencies notify immediately, but values recalculate only when read

## Destructuring

```js
let { a, b, c } = $derived(someObject());
// Each variable becomes individually reactive
```
