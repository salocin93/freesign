# FreeSign - Free Document Signing Platform

[![Netlify Status](https://api.netlify.com/api/v1/badges/911a1613-4586-4e9f-b2b7-bbb1d475d923/deploy-status)](https://app.netlify.com/sites/free-sign/deploys)

FreeSign is an open-source document signing platform that allows users to securely sign and manage documents online. Built with modern web technologies and a focus on user privacy and security.

[MIT License](./LICENSE) • [Report a Bug](https://github.com/yourusername/freesign/issues) • [Request a Feature](https://github.com/yourusername/freesign/issues)

## Features

- 📝 Upload and manage PDF documents
- ✍️ Draw, type, or upload signatures
- 👥 Add multiple recipients for document signing
- 📱 Responsive design for mobile and desktop
- 🔒 Secure document storage with Supabase
- 🔑 User authentication and authorization
- 📊 Document status tracking
- 📨 Email notifications for signing requests

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend/Storage**: Supabase (PostgreSQL, Storage)
- **Authentication**: Supabase Auth
- **PDF Handling**: PDF.js
- **Deployment**: Netlify

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/freesign.git
cd freesign
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your Supabase credentials.

4. Start the development server:
```bash
npm run dev
```

## Project Structure

- `/src/components` - Reusable React components
- `/src/pages` - Page components and routes
- `/src/hooks` - Custom React hooks
- `/src/lib` - Utility functions and API clients
- `/src/contexts` - React context providers
- `/supabase` - Database migrations and types

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

Copyright (c) 2025 Nicolas Freiherr von Rosen
