# Bridge Notes

Notes shown in Bridge Mode tooltips. Format: `## <Feature>` then `### <Home Language> -> <Target Language>` followed by the note text. Feature and language names must match `data/language_comparison.md` exactly.

## Variable Declaration (Mutable/Immutable)

### Python 3.12 -> Rust

Python variables are rebindable names; Rust bindings are immutable unless you opt in with `mut`. There is no rebinding without `let` shadowing.

### Python 3.12 -> JavaScript (ES6+)

Python has no `const`/`let` distinction — every name is rebindable. In JS, prefer `const` by default; `const` freezes the binding, not the object.

### JavaScript (ES6+) -> TypeScript

Identical at runtime — TypeScript only adds optional type annotations (`let x: number = 5`).

### Java (LTS) -> Python 3.12

Java's `final` has no direct Python equivalent; immutability in Python is by convention (UPPER_CASE names) or immutable types like tuples.

## Null Safety / Optional Types

### Python 3.12 -> Rust

Rust has no `None`-by-surprise: absence must be declared as `Option<T>` and the compiler forces you to handle both `Some` and `None` before using the value.

### Java (LTS) -> Python 3.12

Python's `None` behaves like Java's `null` (runtime checks only), but `Optional[T]` type hints plus a type checker give Java-`Optional`-style explicitness.

### JavaScript (ES6+) -> TypeScript

TypeScript makes `null`/`undefined` part of the type system: with `strictNullChecks`, `T | null` must be narrowed before use — the compiler catches what would be a runtime `TypeError` in JS.

## Switch / Match

### Python 3.12 -> Rust

Rust's `match` is an expression that returns a value and must be exhaustive — closer to Python's `match` than to C-style `switch`, but checked at compile time.

### JavaScript (ES6+) -> TypeScript

Same `switch` statement; TypeScript adds exhaustiveness checking when switching over union types (use a `never` default).

## Closures (Lexical Scope Capture)

### Python 3.12 -> JavaScript (ES6+)

Both capture lexically, but Python closures need `nonlocal` to assign to captured variables; JS closures can assign freely.

### Python 3.12 -> Rust

Rust closures must declare how they capture (`Fn`/`FnMut`/`FnOnce`), and the borrow checker prevents the captured-variable bugs Python allows.

## Functional: Lambdas

### Python 3.12 -> JavaScript (ES6+)

Python lambdas are limited to a single expression; JS arrow functions can have full bodies and are the idiomatic default for callbacks.

### Java (LTS) -> Python 3.12

Java lambdas require a functional interface target type; Python lambdas are first-class values with no interface needed.

## Error Handling (Primary)

### Python 3.12 -> Rust

Rust has no exceptions: recoverable errors are `Result<T, E>` values propagated with `?`. Forgetting to handle an error is a compile error, not a runtime surprise.

### Python 3.12 -> Go

Go returns errors as ordinary values (`val, err := f()`); there is no `try/except` — every call site checks `err != nil` explicitly.

### JavaScript (ES6+) -> TypeScript

Same `try/catch`, but TS types the caught value as `unknown` — narrow with `instanceof Error` before reading `.message`.

## Memory Management

### Python 3.12 -> Rust

No garbage collector: Rust frees memory deterministically when the owner goes out of scope. Ownership and borrowing replace Python's reference counting.

### Java (LTS) -> Rust

No JVM, no GC pauses: lifetimes are resolved at compile time. RAII (like try-with-resources, but for everything) is the core idiom.
