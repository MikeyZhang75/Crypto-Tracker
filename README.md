# Crypto Address Tracker

A real-time cryptocurrency address monitoring application built with Next.js and Convex, designed to track incoming transactions and send webhook notifications.

## Features

- 🔐 **Secure Authentication**: Password-based authentication using Convex Auth
- 📊 **Real-time Transaction Monitoring**: Track incoming USDT transactions on the Tron network
- 🔔 **Webhook Notifications**: Automated webhook calls when new transactions are detected
- 🎯 **Duplicate Prevention**: Robust scheduled function management prevents duplicate monitoring processes
- 📈 **Transaction History**: View complete transaction history for monitored addresses
- 🔄 **Automatic Polling**: Configurable polling intervals with error recovery
- 🛡️ **Verification Codes**: Secure webhook endpoints with verification codes

## Tech Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Database/Backend**: Convex (real-time database with TypeScript functions)
- **Authentication**: Convex Auth with Password provider
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Code Quality**: Biome for linting and formatting
- **Package Manager**: Bun

## Getting Started

### Prerequisites

- Node.js 18+ and Bun installed
- A Convex account (free tier available)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/MikeyZhang75/Crypto-Tracker.git
cd crypto-tracker
```

1. Install dependencies:

```bash
bun install
```

1. Set up Convex:

```bash
bunx convex dev
```

This will prompt you to log in to Convex and set up your project.

1. Configure environment variables:
   Create a `.env.local` file with:

```env
NEXT_PUBLIC_CONVEX_URL=<your-convex-deployment-url>
```

1. Run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Architecture

### Database Schema

The application uses the following main tables:

- **addresses**: Stores crypto addresses with webhook configurations
- **transactions**: Records all detected transactions
- **scheduledFunctions**: Tracks active monitoring processes (prevents duplicates)
- **webhookLogs**: Maintains webhook delivery history

### Scheduled Function Management

The system implements a robust pattern to prevent duplicate scheduled functions:

1. **User Intent vs Runtime State**:

   - `addresses.isListening`: Persistent user preference
   - `scheduledFunctions.status`: Current runtime state

2. **Duplicate Prevention**: Only one monitoring process can run per address

3. **Recovery Mechanisms**:
   - `restartListeningAddresses`: Restart monitoring after system restarts
   - `cleanupStaleScheduledFunctions`: Clean up crashed processes

### Transaction Monitoring Flow

1. User adds a crypto address with webhook URL
2. Toggle listening to start monitoring
3. System polls TronGrid API every 5 seconds (30s on error)
4. New transactions trigger webhook notifications
5. All transactions are stored with complete history

## API Integration

### TronGrid API

The application uses the TronGrid API to fetch TRC20 (USDT) transactions:

- Endpoint: `https://api.trongrid.io/v1/accounts/{address}/transactions/trc20`
- Filters for USDT contract: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`
- Only processes confirmed incoming transfers

### Webhook Payload

When a new transaction is detected, the following payload is sent:

```json
{
  "transactionId": "string",
  "cryptoType": "USDT",
  "from": "string",
  "to": "string",
  "amount": "string",
  "timestamp": "number",
  "type": "received",
  "verificationCode": "string"
}
```

## Development Commands

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Run linter
bun run lint

# Format code
bun run format
```

## Convex Functions

Key Convex functions include:

- `addresses.add`: Add a new address to monitor
- `addresses.toggleListening`: Start/stop monitoring
- `addresses.restartListeningAddresses`: Restart all monitoring after crashes
- `transactions.processTransactionFetch`: Core polling logic
- `webhooks.send`: Webhook delivery with retry logic

## Security Considerations

- All API routes require authentication
- Webhook verification codes prevent unauthorized notifications
- User data isolation ensures privacy
- No sensitive data in logs or error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0).

### You are free to

- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

The licensor cannot revoke these freedoms as long as you follow the license terms.

### Under the following terms

- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

- **NonCommercial** — You may not use the material for commercial purposes.

### Restrictions

- **No Commercial Use** — This software may not be used for commercial purposes, including but not limited to:

  - Selling the software or services based on it
  - Using it in a commercial product or service
  - Using it to generate revenue in any way

- **No Warranty** — This software is provided "as is", without warranty of any kind, express or implied.

For commercial licensing options, please contact the repository owner.

Full license text: [CC BY-NC 4.0 Legal Code](https://creativecommons.org/licenses/by-nc/4.0/legalcode)

© 2024 Mikey Zhang. All rights reserved for commercial use.
