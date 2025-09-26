# AT Supply Finder

## Overview

AT Supply Finder is a web application designed to help users discover, search, and source assistive technology (AT) supplies. It integrates with Amazon's Product Advertising API and Selling Partner API for real-time product searches, pricing, and scraping capabilities. The platform features user authentication, an admin dashboard for management, favorites functionality, and role-based access control.

Built with modern frontend technologies and Appwrite as the backend-as-a-service for database, authentication, and cloud functions.

## Features

- **User Authentication**: Secure login and registration using Appwrite.
- **Product Search**: Search assistive technology products via Amazon APIs.
- **Favorites Management**: Save and manage favorite products.
- **Admin Panel**: Manage users, products, and system settings.
- **Role-Based Access**: Different permissions for users, admins, etc.
- **Responsive UI**: Modern interface with Tailwind CSS and shadcn/ui components.
- **Cloud Functions**: Serverless functions for Amazon integration and AI product enhancement.

## Technologies

- **Frontend**: React with TypeScript, Vite for build tool
- **UI/Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Appwrite (Databases, Auth, Functions)
- **Integrations**: Amazon PA API, Amazon SP API, Supabase (partial)
- **Other**: Node.js for functions, ESLint for code quality

## Getting Started

### Prerequisites

- Node.js (v18+) and npm
- Appwrite project set up with databases and functions enabled
- Amazon Developer Account for PA API credentials
- Environment variables configured (e.g., Appwrite endpoint, Amazon API keys)

### Installation

1. Clone the repository:
   ```sh
git clone <YOUR_GIT_REPO_URL>
cd AT-Supply-Finder
   ```

2. Install dependencies:
   ```sh
npm install
   ```

3. Set up Appwrite:
   - Create databases, collections, and attributes as per the project requirements (see `functions/` for migrations).
   - Deploy cloud functions using Appwrite CLI.

4. Configure environment variables in `.env` (create if needed):
   - `VITE_APPWRITE_ENDPOINT`
   - `VITE_APPWRITE_PROJECT_ID`
   - Amazon API keys

5. Run the development server:
   ```sh
npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) to view it.

### Running Functions

For Appwrite functions:
```sh
# Install Appwrite CLI
npm install -g appwrite-cli

# Deploy functions
appwrite functions create --functionId "amazon-pa-search" --name "Amazon PA Search" --runtime "node-18.0"
# Add code and deploy
```

## Project Structure

- `src/`: React application source
  - `components/`: UI components, including features, layout, pages, ui
  - `context/`: React contexts for auth, favorites, theme, etc.
  - `hooks/`: Custom hooks like use-rbac, use-toast
  - `lib/`: Utilities, API clients, types, Supabase integration
  - `pages/`: Page components (Admin, auth, public, user)
- `functions/`: Appwrite cloud functions
  - `Amazon PA API/`: Product search functions
  - `Role Validation/`: User role checks
  - `amazon/`: Scraping and API scripts
  - `user-management/`: User listing and management
  - `utils/`: AI product enhancer
- `public/`: Static assets (logo, favicon)
- `server.js`: Possibly for SSR or API proxy (if used)

## Deployment

- **Frontend**: Deploy to Vercel or Netlify by connecting the repo.
- **Functions**: Deploy via Appwrite Console or CLI.
- **Database**: Use Appwrite's hosted service.

For custom domains, configure in your hosting provider's settings.

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Note: Update the placeholders like `<YOUR_GIT_REPO_URL>` with actual values.*