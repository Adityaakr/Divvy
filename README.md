# Divvy - Complete DeFi Bill Splitting Platform

**Split bills seamlessly, settle with PYUSD, and optimize yields via AI agents across chains**

A comprehensive platform for decentralized bill splitting with Web3 integration, featuring both web and mobile applications.

## 📱 Mobile App (Primary)

The main application is a **React Native/Expo mobile app** located in the `/mobile` directory.

### Features:
- 💸 **Smart bill splitting** with PYUSD on Arbitrum Sepolia
- 🤖 **AI-powered savings optimization** with ASI agents
- 🔍 **Live blockchain explorer** with Blockscout integration
- 📱 **Modern mobile UI/UX** with professional design

### Quick Start:
```bash
cd mobile
npm install
npx expo start
```

## 🌐 Web Components

Additional web components and utilities for the platform built with:
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## 🏗️ Project Structure

```
├── mobile/                 # 📱 React Native/Expo Mobile App
│   ├── App.tsx            # Main mobile app entry
│   ├── src/               # Mobile app source code
│   ├── assets/            # Mobile app assets
│   └── package.json       # Mobile dependencies
├── src/                   # 🌐 Web components
├── public/                # Web assets
└── package.json          # Root dependencies
```

## 🚀 Getting Started

### Mobile App (Primary):
```bash
cd mobile
npm install
cp .env.example .env
# Configure your environment variables
npx expo start
```

### Web Components:
```bash
npm install
npm run dev
```

## 🔐 Security

- Environment variables are gitignored
- Private keys never committed
- Comprehensive .gitignore for sensitive files
- .env.example templates provided

## 📄 License

MIT License

---

**Built with ❤️ for the DeFi community**
