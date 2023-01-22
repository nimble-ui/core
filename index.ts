import type { Render, Accessor, Attrs, Component, Block } from '../utils/types'

/**
 * Renders a static text node to the document.
 * @param text a value for the DOM to display
 */
export function t(text: string): Render {
    return render => render.text(text)
}

/**
 * Renders a dynamic text node to the document.
 * @param text An accessor that contains a value for the DOM to display
 */
export function _(text: Accessor): Render {
    return render => render.dynamic(text)
}

/**
 * Renders an HTML element to the document.
 * @param el the type of element to render
 * @param attrs the element's attributes and event listeners
 * @param children the element's child text and elements
 */
export function e(el: string, attrs: Attrs[] = [], children: Render[] = []): Render {
    return render => render.element(el, attrs, children)
}

/**
 * Adds an attribute to the consuming element
 * @param name the name of the attribute
 * @param value an accessor containing the attribute's value
 */
export function attr(name: string, value: Accessor): Attrs {
    return attr => attr.attr(name, value)
}

/**
 * Adds an event listener to the consuming element
 * @param name the type of event for the event listener to listen for
 * @param value an accessor containing the callback to call when the event fires
 */
export function on(name: string, value: Accessor<(<E extends Event>(e: E) => void)|void|null|undefined>): Attrs {
    return attr => attr.on(name, value)
}

/**
 * Renders a component.
 * @param comp the component to instantiate
 * @param props an accessor containing the component's props
 */
export function c<Props extends Record<string, any>>(
    comp: Component<Props>,
    props: Accessor<Props>
): Render {
    return render => render.component(comp, props)
}

/**
 * Renders a fragment, or a group of child nodes, to the document.
 * @param children
 */
export function f(children: Render[] = []): Render {
    return render => render.fragment(children)
}

/**
 * Allows for conditional and list rendering with a Virtual DOM-like approach.
 * This allows control flow customizability and cross-platform compatability, meaning the consuming API can be rendered in CSR, SSR, and SSG environments.
 * @param blocks A factory function that returns an array of blocks to be rendered to the DOM
 * @see block
 * @see when
 * @see each
 */
export function directive(blocks: Accessor<Block[]>): Render {
    return render => render.directive(blocks)
}

/**
 * Adds a block to a `directive`'s blocks array
 * @param id the block's id used to track the block
 * @param template a factory function to render when the block is created or updated
 * @param context a context that a block uses in the `template`
 */
export function block<Context>(id: string, template: (context: Accessor<Context>) => Render, context: Context): Block {
    return block => block(id, template, context)
}

/**
 * Conditionally renders content
 * @param cond an accessor containing the condition to test
 * @param then child nodes to render if the condition is truthy
 * @param alt child nodes to render if the condition is falsey
 */
export function when(cond: Accessor, then: Render, alt: Render = f()) {
    return directive(() => {
        if (cond()) return [block('if:then', () => then, null)]
        else return [block('if:else', () => alt, null)]
    })
}

/**
 * Renders a list of items to the document.
 * @param ... has two properties: `items` contains the items to iterate over, and `trackBy` contains a function to track each item
 * @param renderItems a function that returns a render instruction for each item
 * @param alt a render instruction to render when the `items` array is empty
 */
export function each<TItem>(
    {items, trackBy = () => (_, idx) => idx}: {
        items: Accessor<TItem[]>,
        trackBy?: Accessor<(item: TItem, index: number, array: TItem[]) => any>,
    },
    renderItems: (item: Accessor<TItem>, index: Accessor<number>, array: Accessor<TItem[]>) => Render,
    alt: Render = f()
): Render {
    const template = (context: () => {item: TItem, index: number, array: TItem[]}) => renderItems(
        () => context().item,
        () => context().index,
        () => context().array,
    )
    return directive(() => {
        const tb = trackBy(), i = items()
        if (i.length == 0) return [block('for:empty', () => alt, null)]
        return i.map((item, index) => block(`for:item(${tb(item, index, i)})`, template, {item,index,array: i}))
    })
}
