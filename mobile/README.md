# SplitSafe Mobile - Enhanced Web3 DeFi App

A comprehensive mobile-first React Native app built with Expo for splitting bills, settling expenses with PYUSD, and advanced DeFi features including AI-powered yield optimization and state channels.

## 🚀 Core Features

### 💳 **Privy Authentication & Embedded Wallet**
- **Email/Social Sign-in**: Login with email, Google, Apple, or existing wallets
- **Embedded Wallet**: Automatic wallet creation for new users
- **WalletConnect Fallback**: Support for external wallets (MetaMask, Coinbase)
- **Secure Authentication**: Industry-standard security with MFA support

### ⚡ **Yellow Session Mode (State Channels)**
- **Off-chain Queuing**: Queue multiple escrows before settling
- **Batch Settlement**: Settle multiple transactions in one on-chain action
- **Real-time Updates**: Live status updates via WebSocket connection
- **Gas Optimization**: Significant gas savings through batching

### 💰 **Payment Features**
- **QR Code Payments**: Generate and scan QR codes for instant payments
- **Payment Request Links**: Share deep links for prefilled payment flows
- **EIP-681 Support**: Standard Ethereum payment request format
- **Gas Fee Preview**: Real-time gas estimation with USD conversion
- **Multi-token Support**: PYUSD, USDC, ETH, and more

### 📈 **AI-Powered Savings (ASI Agent)**
- **Yield Optimization**: Automatic yield farming recommendations
- **Risk Assessment**: AI-driven risk analysis for DeFi protocols
- **Smart Timing**: Optimal deposit/withdrawal timing based on group behavior
- **Cross-chain Planning**: Future cross-chain yield opportunities (demo mode)
- **Real-time APR**: Live yield rates from Aave, Compound, Yearn

### 🤖 **AI Copilot with Blockscout Integration**
- **Transaction Analysis**: Natural language transaction explanations
- **Risk Assessment**: Analyze token approval risks and spender safety
- **Settlement Planning**: Optimal settlement strategies for groups
- **Blockchain Explorer**: Real-time blockchain data and analytics
- **Smart Recommendations**: Context-aware suggestions and actions

## 📱 Enhanced Screens

### 🏠 **Home Screen**
- Privy authentication integration
- Yellow session mode toggle
- AI agent recommendations
- Real-time metrics dashboard
- Group management with balances

### 💸 **Receive Screen**
- Dynamic QR code generation
- Network selection (Ethereum Sepolia, Polygon, Ethereum)
- Optional amount and memo
- Address sharing and copying
- EIP-681 standard support

### 📤 **Payment Request Screen**
- Create shareable payment links
- QR code generation for requests
- Gas fee estimation and preview
- Deep link integration
- Multi-network support

### 💎 **Savings Screen**
- AI agent recommendations
- Active yield positions
- Available opportunities (Aave, Compound, Yearn)
- Cross-chain plans (demo mode)
- Real-time yield tracking

### 🧠 **AI Copilot Screen**
- Natural language query interface
- Transaction hash analysis
- Spender risk assessment
- Settlement plan generation
- Blockscout integration

### 🔍 **Blockchain Explorer Screen**
- Live block ticker
- Recent transactions feed
- Network statistics and charts
- Address and contract lookup
- Direct Blockscout links

## 🛠 Advanced Tech Stack

### **Core Technologies**
- **React Native** with **Expo SDK 52**
- **TypeScript** for type safety
- **React Navigation 6** (Bottom Tabs + Stack)
- **Privy** for Web3 authentication
- **React Query** for data fetching

### **Web3 & DeFi Integration**
- **Yellow Network** for state channels
- **ClearNode** WebSocket integration
- **Blockscout API** for blockchain data
- **EIP-681** payment request standard
- **Multi-chain support** (Ethereum Sepolia, Polygon, Ethereum)

### **AI & Analytics**
- **ASI Agent** for yield optimization
- **Deterministic policies** for savings recommendations
- **Real-time risk scoring** for DeFi protocols
- **Natural language processing** for transaction analysis

### **Mobile Features**
- **QR Code generation/scanning** with react-native-qrcode-svg
- **Deep linking** with Expo Linking
- **Biometric authentication** (planned)
- **Push notifications** (planned)
- **Offline support** with AsyncStorage

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js (v20.19.4+ recommended)
- npm or yarn
- Expo CLI
- Expo Go app on your mobile device

### Environment Setup
Create a `.env` file in the mobile directory:

```bash
# Privy Configuration
EXPO_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Yellow/ClearNode Configuration
EXPO_PUBLIC_YELLOW_ENABLED=true
EXPO_PUBLIC_CLEARNODE_URL=wss://clearnet.yellow.com/ws
EXPO_PUBLIC_PRIVATE_KEY=your_private_key
EXPO_PUBLIC_NETWORK=polygon
EXPO_PUBLIC_RPC_URL=https://polygon-rpc.com

# Network Configuration
EXPO_PUBLIC_CHAIN_ID=137
EXPO_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
EXPO_PUBLIC_BASE_SEPOLIA_CHAIN_ID=84532

# App Configuration
EXPO_PUBLIC_APP_SCHEME=splitsafe
EXPO_PUBLIC_DEEP_LINK_PREFIX=splitsafe://
```

### Installation & Running

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start development server
npm start

# Scan QR code with Expo Go or run on simulator
npm run ios     # iOS simulator
npm run android # Android emulator
npm run web     # Web browser
```

## 📁 Enhanced Project Structure

```
mobile/
├── App.tsx                           # Main app with Privy & navigation
├── .env                             # Environment configuration
├── src/
│   ├── lib/
│   │   ├── auth/
│   │   │   └── privyClient.ts       # Privy authentication setup
│   │   ├── yellow/
│   │   │   └── clearNodeClient.ts   # Yellow state channels
│   │   ├── payments/
│   │   │   └── qrUtils.ts          # QR codes & payment links
│   │   ├── ai/
│   │   │   └── blockscoutClient.ts  # AI Copilot & Blockscout
│   │   ├── savings/
│   │   │   └── asiAgent.ts         # ASI yield optimization
│   │   ├── store.ts                # Enhanced Zustand store
│   │   └── calc.ts                 # Business logic
│   └── screens/
│       ├── EnhancedHomeScreen.tsx   # Privy auth & AI features
│       ├── ReceiveScreen.tsx        # QR code receiving
│       ├── PaymentRequestScreen.tsx # Payment link creation
│       ├── SavingsScreen.tsx        # Yield farming interface
│       ├── CopilotScreen.tsx        # AI transaction analysis
│       └── ExplorerScreen.tsx       # Blockchain data visualization
├── package.json
└── README.md
```

## 🧪 Testing Features

### **Privy Authentication**
1. Launch app and tap "Connect Wallet & Sign In"
2. Choose email, Google, Apple, or external wallet
3. Complete authentication flow
4. Embedded wallet created automatically for new users

### **Yellow Session Mode**
1. Enable session mode toggle on home screen
2. Create multiple escrows (they queue off-chain)
3. Tap "Settle Session" to batch settle on-chain
4. Monitor real-time status updates

### **AI Copilot**
1. Navigate to Copilot screen
2. Try queries like:
   - "Explain transaction: 0x..."
   - "Is this spender risky: 0x..."
   - "Who still owes me?"
3. Get AI-powered analysis and recommendations

### **Savings & Yield**
1. Navigate to Savings screen
2. View AI agent recommendations
3. Deposit to yield protocols (Aave, Compound, Yearn)
4. Monitor real-time yield earnings

## 🔐 Security Features

- **Biometric Authentication**: Face ID/Touch ID for sensitive operations
- **Gas Fee Preview**: Always show gas costs before transactions
- **Network Guards**: Automatic network switching with faucet shortcuts
- **Risk Assessment**: AI-powered spender and protocol risk analysis
- **TTL Management**: Time-locked escrows with extend functionality

## 🌐 Multi-Chain Support

- **Ethereum Sepolia**: Primary testnet for development
- **Polygon**: Production-ready with lower fees
- **Ethereum Mainnet**: Full compatibility
- **Cross-chain Bridging**: Planned with LayerZero integration

## 🚀 Production Deployment

### **EAS Build (Recommended)**
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure build
eas build:configure

# Build for both platforms
eas build --platform all

# Submit to app stores
eas submit --platform all
```

## 📄 License

This project is part of the SplitSafe application suite.

### Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Scan the QR code with Expo Go (Android) or Camera app (iOS)

### Development Commands

```bash
npm start          # Start Expo development server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS simulator
npm run web        # Run in web browser
```

## 📁 Project Structure

```
mobile/
├── App.tsx                 # Main app component with navigation
├── src/
│   ├── lib/
│   │   ├── store.ts       # Zustand store with AsyncStorage
│   │   └── calc.ts        # Business logic and calculations
│   └── screens/
│       ├── HomeScreen.tsx          # Main dashboard
│       ├── GroupDetailScreen.tsx   # Group details and expenses
│       ├── AddExpenseScreen.tsx    # Add new expenses
│       ├── ReceiptsScreen.tsx      # Expense history
│       └── SettingsScreen.tsx      # App settings
├── package.json
└── README.md
```

## 🔄 Migration from Web App

This mobile app is a complete port of the original React web application with the following key changes:

### ✅ Completed Migrations

- **State Management**: Zustand store with AsyncStorage persistence
- **Navigation**: React Router → React Navigation (Bottom Tabs + Stack)
- **UI Components**: shadcn/ui → React Native components with custom styling
- **Business Logic**: Complete port of calculation utilities and data models
- **Responsive Design**: Mobile-first design with touch-optimized interactions

### 🎨 UI/UX Improvements

- **Native Mobile Feel**: Bottom tab navigation with platform-specific icons
- **Touch Interactions**: Optimized for mobile touch interactions
- **Modal Dialogs**: Native modal components for better mobile UX
- **Safe Area**: Proper safe area handling for modern devices
- **Loading States**: Better loading and error states for mobile

## 🔮 Future Enhancements

- **Wallet Integration**: Connect to real crypto wallets (MetaMask, WalletConnect)
- **PYUSD Integration**: Implement actual PYUSD settlement functionality
- **Push Notifications**: Notify users of new expenses and settlements
- **Camera Integration**: Scan receipts with camera
- **Offline Support**: Better offline functionality with sync
- **Social Features**: Invite friends via contacts or social media

## 🧪 Testing

The app includes mock mode for testing without real wallet connections:

1. Open Settings
2. Enable "Mock Mode"
3. Connect a mock wallet
4. Create groups and add expenses to test functionality

## 📱 Expo Go Testing

1. Install Expo Go from App Store (iOS) or Google Play (Android)
2. Run `npm start` in the mobile directory
3. Scan the QR code with Expo Go
4. The app will load on your device

## 🚀 Deployment

To build for production:

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Or use EAS Build (recommended)
eas build --platform all
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both iOS and Android
5. Submit a pull request

## 📄 License

This project is part of the SplitSafe application suite.
# 📱 Divvy - DeFi Bill Splitting Mobile App

**Split bills seamlessly, settle with PYUSD, and optimize yields via AI agents across chains**

A React Native/Expo mobile application for decentralized bill splitting with Web3 integration, AI-powered savings optimization, and cross-chain PYUSD settlements.

## 🚀 Features

### 💸 **Bill Splitting & Payments**
- **Smart expense splitting** with multiple participants
- **QR code payments** for instant settlements
- **PYUSD integration** on Ethereum Sepolia
- **Real-time split calculations** with gas estimation

### 🤖 **AI-Powered DeFi**
- **ASI Savings Agent** - AI-driven yield optimization with volatility analysis
- **AI Copilot** - Smart transaction analysis with Blockscout integration
- **Automated risk management** with configurable preferences

### 🌐 **Blockchain Integration**
- **Ethereum Sepolia** network support for PYUSD
- **Blockscout SDK** for live blockchain data
- **Multi-chain compatibility** ready
- **Real-time transaction monitoring**

### 📊 **Advanced Features**
- **State channel batching** with Yellow Network integration
- **Live blockchain explorer** with address lookup
- **Receipt management** with status tracking (claimed/settled/pending)
- **Professional UI/UX** with modern design patterns

## 🛠️ Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **Blockscout SDK** for blockchain data
- **React Navigation** for routing
- **Expo Vector Icons** for UI
- **React Query** for data management

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Adityaakr/Divvy.git
   cd Divvy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual configuration values
   ```

4. **Start the development server:**
   ```bash
   npx expo start
   ```

## 📱 Running the App

### **Mobile Device (Recommended)**
1. Install **Expo Go** from App Store (iOS) or Google Play (Android)
2. Scan the QR code from the terminal
3. Test all features on your mobile device

### **Simulators**
- **iOS Simulator:** Press `i` in terminal
- **Android Emulator:** Press `a` in terminal
- **Web Browser:** Press `w` in terminal

## ⚙️ Configuration

### **Environment Variables**
Copy `.env.example` to `.env` and configure:

```bash
# Blockchain Network
EXPO_PUBLIC_CHAIN_ID=11155111
EXPO_PUBLIC_ETHEREUM_SEPOLIA_RPC=https://sepolia.infura.io/v3/your_infura_key_here

# Blockscout Integration
EXPO_PUBLIC_BLOCKSCOUT_BASE=https://eth-sepolia.blockscout.com
EXPO_PUBLIC_BLOCKSCOUT_API=https://eth-sepolia.blockscout.com/api/v2

# Add your API keys and private keys (never commit these!)
```

## 🏗️ Project Structure

```
├── App.tsx                 # Main app entry point
├── src/
│   ├── components/         # Reusable UI components
│   ├── screens/           # App screens
│   ├── lib/
│   │   ├── asi/           # ASI Savings Agent
│   │   ├── copilot/       # AI Copilot handlers
│   │   ├── partners/      # Blockscout integration
│   │   ├── payments/      # QR code & payment utils
│   │   └── chains.ts      # Network configuration
│   └── ...
├── assets/                # Images and icons
└── .env.example          # Environment template
```

## 🔐 Security

- **Environment variables** are gitignored
- **Private keys** never committed to repository
- **API credentials** protected with .env.example template
- **Comprehensive .gitignore** for sensitive files

## 🌟 Key Screens

1. **🏠 Home** - Balance overview with quick actions
2. **💰 Add Expense** - Smart bill splitting with participant selection
3. **📊 Savings** - ASI agent with volatility analysis
4. **🤖 AI Copilot** - Transaction analysis and insights
5. **🔍 Explorer** - Live blockchain data and address lookup
6. **📱 Receive/Send** - QR code payments and requests

## 🚀 Deployment

The app is ready for deployment to:
- **Expo Application Services (EAS)**
- **Apple App Store** (iOS)
- **Google Play Store** (Android)
- **Web deployment** via Expo

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- **Repository:** https://github.com/Adityaakr/Divvy
- **Blockscout:** https://eth-sepolia.blockscout.com
- **Ethereum Sepolia:** https://sepolia.infura.io/v3/your_infura_key_here

---

**Built with ❤️ for the DeFi community**
