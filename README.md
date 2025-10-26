# Divvy - Complete DeFi Bill Splitting Platform

**Split bills seamlessly, settle with PYUSD, and optimize yields via AI agents across chains**
![2025-10-26 21 28 25](https://github.com/user-attachments/assets/a6b75cf4-363c-42e8-8c74-9e70148382df)
![2025-10-26 21 28 33](https://github.com/user-attachments/assets/a7a38f41-0da7-4d0d-82a8-e66eed284203)
![2025-10-26 21 37 21](https://github.com/user-attachments/assets/25201202-9ba0-46c8-bd9f-f6f5afbe1c6b)

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
