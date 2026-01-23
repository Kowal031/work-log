# WorkLog

A simple and effective application for monitoring time spent on various tasks.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

WorkLog is designed to provide users with a straightforward tool for tracking work time. The application allows for recording time spent on individual tasks through start and pause functionalities. Users can create and manage tasks, as well as review daily summaries of their activity. This helps solve the problem of inaccurate manual time logging, especially for remote or computer-based work, by offering a centralized and convenient solution.

## Tech Stack

### Frontend
- **Astro 5**: For building fast, content-focused websites.
- **React 19**: For creating interactive UI components.
- **TypeScript 5**: For strong typing and improved code quality.
- **Tailwind CSS 4**: A utility-first CSS framework for rapid UI development.
- **Shadcn/ui**: A collection of reusable UI components.

### Backend
- **Supabase**: An open-source Firebase alternative for database, authentication, and backend services.

### AI Integration
- **Openrouter.ai**: A middleware layer for accessing various large language models.

### CI/CD & Hosting
- **GitHub Actions**: For automating build, test, and deployment pipelines.
- **DigitalOcean (Docker)**: For scalable and straightforward application hosting.

## Getting Started Locally

To get a local copy up and running, follow these simple steps.

### Prerequisites

- **Node.js**: Version `22.14.0`. We recommend using a version manager like `nvm`.
  ```sh
  nvm use
  ```
- **npm** (or your preferred package manager)
  ```sh
  npm install -g npm@latest
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/your_username/work-log.git
   ```
2. Navigate to the project directory
   ```sh
   cd work-log
   ```
3. Install NPM packages
   ```sh
   npm install
   ```
4. Create a `.env` file in the root directory and add your environment variables (e.g., for Supabase).

5. Run the development server
   ```sh
   npm run dev
   ```

## Available Scripts

In the project directory, you can run the following scripts:

- `npm run dev`: Runs the app in the development mode.
- `npm run build`: Builds the app for production to the `dist/` folder.
- `npm run preview`: Serves the production build locally for preview.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run lint:fix`: Fixes linting errors automatically.
- `npm run format`: Formats the code using Prettier.

## Project Scope

### Included Features (MVP)
- **User Authentication**: Secure registration and login.
- **Task Management**: Create, edit, and archive tasks.
- **Time Tracking**: Start, pause, and stop a timer for each task.
- **Manual Time Entry**: Manually add or edit time entries.
- **Daily Summary**: View a summary of time spent per day.
- **History**: Browse through past work logs using a calendar view.

### Out of Scope (Future Enhancements)
- Advanced productivity analytics and charts.
- Data export to CSV or PDF.
- Integrations with third-party project management tools (Jira, Trello, etc.).
- Invoicing and billing features.
- Automatic idle time detection.

## Project Status

This project is currently **in development**. The core features for the Minimum Viable Product (MVP) are being implemented.

## License

This project is licensed under the MIT License.
