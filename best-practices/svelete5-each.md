# Svelte 5 Each Blocks

Iterate over arrays, array-like objects, or iterables (Map, Set) using `{#each}` blocks. Supports destructuring and optional keys for efficient DOM updates.

## Basic Syntax

```svelte
{#each expression as name}...{/each}
{#each expression as name, index}...{/each}
```

```svelte
<ul>
	{#each items as item}
		<li>{item.name} x {item.qty}</li>
	{/each}
</ul>
```

## Keyed Each Blocks

Use unique keys to optimize DOM updates when data changes:

```svelte
{#each expression as name (key)}...{/each}
```

```svelte
{#each items as item (item.id)}
	<li>{item.name} x {item.qty}</li>
{/each}
```

Keys should be strings or numbers for identity persistence.

## Destructuring

```svelte
{#each items as { id, name, qty }, i (id)}
	<li>{i + 1}: {name} x {qty}</li>
{/each}
```

## Rendering N Times

```svelte
{#each { length: 8 }, index}
	<div>Item {index}</div>
{/each}
```

## Else Clause

```svelte
{#each todos as todo}
	<p>{todo.text}</p>
{:else}
	<p>No tasks today!</p>
{/each}
```
