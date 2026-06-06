## 2024-06-06 - [React Performance: Nested Component Definitions]
**Learning:** Defining React components inside other components (like `<HeaderRow>`, `<Cell>`) causes React to unmount and remount them on every render because the component reference changes. This leads to expensive DOM manipulation and performance bottlenecks, especially in tables.
**Action:** Inline the JSX or define the components outside the main component to maintain stable component references.
