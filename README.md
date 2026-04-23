# ChatPlay - Real-Time Social & Gaming Platform

ChatPlay is a modern, real-time social networking and interactive gaming application. Built with the MERN stack (MySQL, Express, React, Node.js) and powered by Socket.io, ChatPlay allows users to connect with friends, exchange real-time messages, and engage in interactive multiplayer games like Tic-Tac-Toe.

This project was successfully migrated from a legacy Java/JSP environment into a fully modernized, highly responsive, and beautifully animated web application.

## Features

### 🔐 Authentication & Security
- **User Registration & Login**: Secure account creation with encrypted passwords using `bcryptjs` and session management via JSON Web Tokens (JWT).
- **Password Recovery**: Secure "Forgot Password" and "Change Password" flows.
- **Role-Based Access**: Specialized views and capabilities for standard users and administrators.

### 💬 Real-Time Messaging
- **Instant Chat**: Send and receive messages instantly using `Socket.io` without needing to refresh the page.
- **Inbox Management**: Dedicated inbox for reviewing ongoing conversations and unread messages.
- **Unread Indicators**: Dynamic notification dots and bold text to instantly alert users of new messages.

### 👥 Friend Management
- **Find Friends**: Browse and search for other registered users on the platform.
- **Friend Requests**: Send, accept, or decline friend requests in real time.
- **Friends List**: Easily view and manage your network of connected friends.

### 🎮 Interactive Gaming (Tic-Tac-Toe)
- **Real-Time Multiplayer**: Challenge your friends to live games of Tic-Tac-Toe.
- **Game Invites**: Send and receive game invitations directly through the platform.
- **In-Game Chat**: Chat simultaneously with your opponent while playing.
- **Game Feedback**: Celebrate victories with explosive, dynamic visual fireworks and automatic game summaries sent directly to chat!

### 👤 Profile Management
- **Customizable Profiles**: Update your bio, personal details, and profile picture.
- **Real-Time Synchronization**: Profile picture updates immediately reflect across the entire application (navbar, chat, friend lists) for all users through global state and Socket.io events.

### 🛡️ Admin Dashboard
- **User Moderation**: View all registered users, their statuses, and activities.
- **Content Reporting**: A dedicated portal to review and handle user reports, ensuring a safe community environment.

### ✨ Dynamic UI & UX
- **Framer Motion Animations**: Liquid page transitions, animated background carousels, 3D card tilts, pulsing buttons, and staggered text appearances.
- **Theme Toggling**: Seamlessly switch between light and dark modes across the entire app.
- **Micro-Interactions**: Click ripple effects, hover states, and fireworks celebrations designed to WOW users with a premium feel.

## Technology Stack

- **Frontend**: React.js, React Router, Framer Motion, Axios, Lucide React (Icons), Vanilla CSS
- **Backend**: Node.js, Express.js
- **Real-Time Engine**: Socket.io
- **Database**: MySQL (using `mysql2/promise` pool)
- **Authentication**: JWT, bcryptjs
- **File Uploads**: Multer (for profile pictures)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server

### Database Setup
1. Create a new MySQL database named `chatplay` (or your preferred name).
2. Configure your `.env` file in the `server` directory with your database credentials.

### Installation

1. **Clone the repository** (if applicable) and navigate to the root directory.
2. **Install Server Dependencies:**
   ```bash
   cd server
   npm install
   ```
3. **Install Client Dependencies:**
   ```bash
   cd ../client
   npm install
   ```

### Environment Variables
Create a `.env` file in the `server` directory:
```env
PORT=5000
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
JWT_SECRET=your_super_secret_jwt_key
```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd server
   npm start
   ```
   *(The server will run on http://localhost:5000)*

2. **Start the frontend client:**
   ```bash
   cd client
   npm start
   ```
   *(The React app will automatically open at http://localhost:3000)*

## Project Structure

- `/client` - Contains the React frontend application, UI components, pages, context providers, and styles.
- `/server` - Contains the Express backend, route handlers, controllers, database configurations, and Socket.io events.
