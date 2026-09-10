# Third-party notices

This web frontend includes the following direct third-party packages. Their complete license files remain in the installed package distribution and are included in the production dependency installation.

## marked 18.0.12

- License: MIT
- Purpose: Markdown parsing
- Copyright: Christopher Jeffrey

## DOMPurify 3.4.15

- License: Apache-2.0 OR MPL-2.0
- Purpose: Sanitizing rendered Markdown HTML
- Copyright: Cure53 and contributors

The sanitizer is used with a restricted URI policy and HTML profile. No package source is modified.

## JsBarcode 3.12.3

- License: MIT
- Purpose: Local SVG and PNG barcode generation
- Copyright: Lindell

## TypeScript declarations

`@types/dompurify` 3.0.5 and `@types/jsbarcode` 3.11.4 are MIT licensed declaration packages.

## Diagram editor

The diagram editor is the open-source draw.io editor from JGraph, licensed under Apache License 2.0. The current web build points to the configurable editor host (`NEXT_PUBLIC_DRAWIO_EMBED_HOST`), whose default is the upstream hosted editor. The upstream editor's own copyright, trademark, license, and attribution notices are not removed or obscured.

The source code in the upstream repository is Apache-2.0. The upstream project also states that its icon sets, stencil libraries, and templates have additional terms: they may not be used as software assets in, distributed for use with, or incorporated into Atlassian products or products distributed through the Atlassian marketplace or plugin ecosystem without explicit written permission. This restriction does not apply to end-user diagram output created with the editor.

If a deployment self-hosts the editor, it must use an official or otherwise authorized draw.io distribution and deploy its accompanying `LICENSE` and `NOTICE` files alongside the static assets. The distribution version and any local modifications should be recorded in that deployment's release materials.

## Excalidraw 0.18.1

- License: MIT
- Purpose: Embedded local whiteboard and diagram editor
- Copyright: Excalidraw contributors

The official `@excalidraw/excalidraw/index.css` stylesheet is included. The editor's built-in attribution and notices are not hidden or altered. This integration does not enable collaboration, cloud storage, or remote sharing.

## Univer 0.25.1

- Packages: `@univerjs/presets`, `@univerjs/preset-sheets-core`
- License: Apache-2.0
- Purpose: Embedded local spreadsheet editor
- Copyright: DreamNum Co., Ltd. and contributors

The core sheets preset and its official CSS are used without Pro exchange, collaboration, or cloud services. All `@univerjs/*` packages are kept on the same pinned version. The editor exports its native JSON workbook snapshot; no XLSX compatibility is claimed by this integration.

## Mind Elixir 5.15.1

- License: MIT
- Purpose: Embedded local mind-map editor
- Copyright: Mind Elixir contributors

The official `mind-elixir/style` stylesheet is included. The integration uses the core package rather than the separate React wrapper and keeps the editor's public data and export APIs.


MIT and Apache License 2.0 text is available in the corresponding package `LICENSE` files under `node_modules` and in the package-lock-resolved distributions. This project does not relicense those packages or claim ownership of their upstream code.
