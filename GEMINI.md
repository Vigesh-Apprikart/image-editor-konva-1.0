## Project Overview

This is a Next.js project bootstrapped with `create-next-app`. It appears to be a web-based image editor.

The main application logic seems to be within the `app/edit-flow` directory. The editor uses `Konva.js` for the canvas functionality and has components for a toolbar, sidebar, and properties panel.

**Key Technologies:**

*   **Framework:** Next.js
*   **Language:** JavaScript (with some TypeScript configuration files)
*   **UI Library:** React
*   **Styling:** Tailwind CSS
*   **Linting:** ESLint
*   **Canvas:** Konva.js (inferred from `konvacanvas`)

## Building and Running

To get the development environment running, use the following command:

```bash
npm run dev
```

This will start the development server on [http://localhost:3000](http://localhost:3000).

**Other available scripts:**

*   `npm run build`: Builds the application for production.
*   `npm run start`: Starts a production server.
*   `npm run lint`: Runs the ESLint linter to check for code quality.

## Development Conventions

*   The project uses `ESLint` for code linting. The configuration is in `eslint.config.mjs`.
*   Styling is done using Tailwind CSS. The configuration is in `postcss.config.mjs` and `tailwind.config.js` (though `tailwind.config.js` is not present in the file listing, it's a standard file for Tailwind CSS).
*   The project is configured for TypeScript, as indicated by `tsconfig.json` and `.ts` files in the root. However, most of the application code seems to be in JavaScript (`.js` and `.jsx`).
*   The application is structured using Next.js App Router.
