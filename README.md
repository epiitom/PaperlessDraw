# 🎨 PaperlessDraw

*Collaborative drawing made simple and seamless*


## ✨ What is PaperlessDraw?

PaperlessDraw is a real-time collaborative drawing application that brings creativity to life in the digital realm. Whether you're brainstorming with colleagues, teaching students, or simply having fun with friends, PaperlessDraw provides an intuitive canvas where multiple users can draw, sketch, and create together seamlessly.

## 🚀 Key Features

- **🎯 Real-time Collaboration** - Draw simultaneously with multiple users
- **🌐 Web-based** - No downloads required, works in any modern browser  
- **⚡ WebSocket Integration** - Lightning-fast synchronization across all connected users
- **🎨 Rich Drawing Tools** - Complete set of brushes, colors, and drawing utilities
- **📱 Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- **🔐 Secure Authentication** - User management and session handling
- **🏗️ Modern Architecture** - Built with Next.js and TypeScript for reliability

## 🏗️ System Architecture

Our application follows a clean, scalable architecture designed for real-time collaboration:

![System Architecture](![image](<img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/7ab3a079-b45a-45c5-ac6a-999a02980800" />

)

The system consists of:

### Backend Services
- **Database (db)** - Persistent storage for user data, drawings, and sessions
- **HTTP Backend** - RESTful API handling authentication, user management, and data operations
- **WebSocket Server** - Real-time communication hub for live drawing synchronization

### Frontend Application  
- **Landing Page** - User onboarding and authentication interface
- **Drawing Canvas** - Multi-user collaborative drawing environment with comprehensive tools
- **Room Management** - Create and join drawing sessions with multiple participants

All components communicate seamlessly to provide a smooth, responsive collaborative experience.

## 🛠️ Technology Stack

### Frontend
- **Next.js** - React-based framework for optimal performance
- **TypeScript** - Type-safe development for better code quality
- **Canvas API** - High-performance drawing capabilities
- **Responsive Design** - Mobile-first approach

### Backend
- **WebSocket** - Real-time bidirectional communication
- **RESTful API** - Standard HTTP endpoints for data operations
- **Database Integration** - Persistent storage solution
- **Authentication System** - Secure user management

### Development Tools
- **Turborepo** - Monorepo management for scalable development
- **ESLint** - Code quality and consistency
- **Prettier** - Automated code formatting
- **TypeScript** - Static type checking across the entire codebase

## 🚀 Quick Start

### Prerequisites
- Node.js 16.0 or higher
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/epiitom/PaperlessDraw.git
   cd PaperlessDraw
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development servers**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   - Frontend: `http://localhost:3000`
   - API Documentation: `http://localhost:3001`

### Building for Production

```bash
# Build all applications
pnpm build

# Start production server
pnpm start
```

## 🎯 Usage

1. **Create or Join a Room**
   - Visit the landing page
   - Create a new drawing session or join an existing one
   - Share the room code with collaborators

2. **Start Drawing**
   - Select your preferred drawing tools
   - Start creating on the shared canvas
   - See real-time updates from other participants

3. **Collaborate**
   - Multiple users can draw simultaneously
   - Changes are synchronized instantly across all devices
   - Chat with other participants (if implemented)

## 📁 Project Structure

```
PaperlessDraw/
├── apps/
│   ├── web/              # Main frontend application
│   └── docs/             # Documentation site
├── packages/
│   ├── ui/               # Shared UI components
│   ├── eslint-config/    # ESLint configurations
│   └── typescript-config/ # TypeScript configurations
├── server/               # Backend services
│   ├── api/              # HTTP API endpoints
│   ├── websocket/        # WebSocket server
│   └── database/         # Database models and migrations
└── README.md
```

## 🤝 Contributing

We welcome contributions to PaperlessDraw! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests** (if applicable)
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Maintain code formatting with Prettier
- Ensure ESLint passes without warnings
- Add tests for new functionality
- Update documentation as needed

## 🐛 Bug Reports & Feature Requests

Found a bug or have an idea for improvement? We'd love to hear from you!

- **Bug Reports**: [Create an issue](https://github.com/epiitom/PaperlessDraw/issues/new?template=bug_report.md)
- **Feature Requests**: [Request a feature](https://github.com/epiitom/PaperlessDraw/issues/new?template=feature_request.md)

## 📋 Roadmap

- [ ] Advanced drawing tools (layers, effects)
- [ ] Voice chat integration
- [ ] Drawing templates and backgrounds
- [ ] Export functionality (PNG, SVG, PDF)
- [ ] User profiles and drawing galleries
- [ ] Mobile app development
- [ ] Whiteboard mode for presentations
- [ ] Integration with popular design tools

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


<div align="center">
  <strong>Made with ❤️ for collaborative creativity</strong>
  <br>
  <sub>Star ⭐ this repository if you find it helpful!</sub>
</div>
