# \<BackButton />

`<BackButton />` uses the browser's `history` API to transition
the user to the previous url.

If the previous url is not the same domain as the running application, or if no history entry exists `@fallbackUrl` will
be used to transition the user to a different location in the application.

This button is implemented as an html `<button />` element to maximize semantics and accessibility. The contents of the button
are an optimized SVG `<Icon::Fa::AngleLeftSolid />`

The button takes an optional `@label` to be used as the `aria-label` attribute. If no label is supplied the button expects to use the translation `misc.go-back`.

Any additional attributes and modifiers may be supplied and will be applied as "splattributes" on the button element.

## Usage

```hbs
<BackButton @fallbackUrl={{url-for "index"}} />
```
