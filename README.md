# Distribution Retail Management System

An Electron-based desktop application built for managing distribution retail operations, featuring customer management, supplier tracking, purchase order processing, and analytics.

## Project Overview

This is a modern, cross-platform desktop application designed specifically for distribution retail businesses. It provides a comprehensive suite of tools for managing customers, suppliers, purchase orders, and business analytics in a single, unified interface.

## Features

### Core Functionality
- **Customer Management**: Complete CRUD operations for customer records
- **Supplier Management**: Track and manage supplier relationships
- **Purchase Orders**: Create and manage purchase orders
- **User Management**: Role-based access control with different permission levels
- **Analytics Dashboard**: Visual insights into business performance
- **Authentication**: Secure login and registration system
- **Settings & Profile**: Customizable user preferences and profile management

### Technical Features
- **Cross-platform**: Runs on Windows, macOS, and Linux
- **Modern UI**: Built with React and styled with Tailwind CSS
- **Advanced Data Tables**: TanStack Table with sorting, filtering, and search (NEW! ✨)
- **Real-time Updates**: Toast notifications for user feedback
- **Protected Routes**: Secure routing with authentication requirements
- **Responsive Design**: Adapts to different screen sizes
- **Offline Capability**: Works without internet connection

## Tech Stack

### Stack
- **React 18** - Modern UI library for building user interfaces
- **TanStack Table v8** - Powerful table & data grid library (NEW! ✨)
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Heroicons** - Beautiful hand-crafted SVG icons
- **Webpack** - Module bundling and build optimization
- **Electron Forge** - Complete tooling for building and packaging Electron apps
- **Node.js** - JavaScript runtime for server-side operations
- **Electron** - Cross-platform desktop app framework

### Development Tools
- **PostCSS** - CSS processing and optimization
- **Babel** - JavaScript transpilation for cross-browser compatibility

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── atoms/         # Basic building blocks (HeroIcon)
│   ├── molecules/     # Composite components (NotificationBell)
│   ├── organisms/     # Complex components (Sidebar)
│   └── ProtectedRoute.jsx
├── pages/             # Application pages/screens
│   ├── Analytics.jsx
│   ├── Customers.jsx
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   ├── Profile.jsx
│   ├── PurchaseOrders.jsx
│   ├── Register.jsx
│   ├── RoleManagement.jsx
│   ├── Settings.jsx
│   ├── Suppliers.jsx
│   └── Users.jsx
├── services/          # Business logic and API services
│   ├── authService.js
│   ├── notificationService.js
│   └── toastService.js
├── templates/         # Layout templates
│   └── MainLayout.jsx
├── App.jsx           # Main application component
├── main.js           # Electron main process
├── renderer.js        # Electron renderer process
├── index.html        # HTML entry point
├── index.css         # Global styles
└── preload.js       # Electron preload scripts
```

## Pages & Features

### Dashboard (`/pages/Dashboard.jsx`)
- Business overview and key metrics
- Quick access to frequently used features
- Recent activity summary

### Customer Management (`/pages/Customers.jsx`)
- Add new customers with comprehensive details
- Edit existing customer information
- View customer history and interactions
- Customer creation modal interface

### Supplier Management (`/pages/Suppliers.jsx`)
- Supplier information management
- Contact details and relationship tracking
- Supplier performance metrics

### Purchase Orders (`/pages/PurchaseOrders.jsx`)
- Create new purchase orders
- Track order status and history
- Manage supplier relationships

### User Management (`/pages/Users.jsx`)
- User account administration
- Role-based access control
- Permission management

### Analytics (`/pages/Analytics.jsx`)
- Business performance insights
- Customer and supplier analytics
- Financial reports and trends

### Settings & Profile
- **Settings** (`/pages/Settings.jsx`) - Application preferences
- **Profile** (`/pages/Profile.jsx`) - User profile management
- **SettingProfile** (`/pages/SettingProfile.jsx`) - Profile settings

## Authentication System

The application includes a complete authentication system with:
- **Login** (`/pages/Login.jsx`) - Secure user authentication
- **Register** (`/pages/Register.jsx`) - New user registration
- **Protected Routes** - Secure page access based on authentication status
- **Role Management** (`/pages/RoleManagement.jsx`) - User roles and permissions

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application in development mode:
   ```bash
   npm start
   ```

### Building for Production
```bash
npm run make
```

This will create distributable packages for your current platform.

## Development

### Available Scripts
- `npm start` - Start the application in development mode
- `npm run make` - Build the application for production
- `npm run package` - Package the application without distribution
- `npm run publish` - Publish the application

### Environment Variables
The application uses standard Electron configuration. Environment-specific settings can be configured in the `forge.config.js` file.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please contact nandokun69@gmail.com or create an issue in the GitHub repository.

---

**Built with ❤️ for distribution retail businesses**
