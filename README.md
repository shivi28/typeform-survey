# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Typeform Survey Application

A survey application built with React and Vite, with a backend hosted on Render.

## Environment Setup

This project uses environment variables to manage configuration for different environments. Follow these steps to set up your environment:

1. Copy `.env.example` to `.env` for local development:
   ```
   cp .env.example .env
   ```

2. Fill in your actual Google Client ID and API URL values in the `.env` file.

## GitHub Pages Deployment with Secrets

This project is configured to deploy to GitHub Pages using GitHub Actions. To set up secure deployment:

1. Make sure your repository is set to private (to protect the workflow file containing your secrets references).

2. Add the following secrets to your GitHub repository:
   - `VITE_API_URL`: Your production API URL
   - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID

### Adding GitHub Secrets

1. Go to your GitHub repository
2. Click on "Settings"
3. Click on "Secrets and variables" > "Actions"
4. Click on "New repository secret"
5. Add each secret with the appropriate name and value

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Production Build

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

## Note on Security

- Never commit `.env` files containing real credentials
- Always use GitHub Secrets for storing sensitive information
- Keep the repository private to protect workflow files that reference secrets
