# Project Overview

This is a Next.js project bootstrapped with `create-next-app`. It appears to be a web application, likely an image editor, based on the directory name "image-editor-konva-1.0". The project uses React, and Tailwind CSS.

# Building and Running

To get the development server running, use the following command:

```bash
npm run dev
```

This will start the server on [http://localhost:3000](http://localhost:3000).

To build the application for production, use:

```bash
npm run build
```

To start the production server, use:

```bash
npm run start
```

# Routing

The application uses the Next.js App Router. Here are the main routes:

- `/`: The main landing page.
- `/edit-flow`: The main page for the image editor.

# Development Conventions

The project includes a linting script that can be run with:

```bash
npm run lint
```

This uses ESLint to enforce code quality. It's recommended to run this command before committing changes.

# Dependencies

## Production Dependencies
- next: 16.0.10
- react: 19.2.1
- react-dom: 19.2.1

## Development Dependencies
- @tailwindcss/postcss": ^4.1.18
- autoprefixer: ^10.4.23
- eslint: ^9
- eslint-config-next: 16.0.10
- postcss: ^8.5.6
- tailwindcss: ^4.1.18