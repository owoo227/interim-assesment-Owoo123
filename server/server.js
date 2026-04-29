require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const priceSimulator = require('./utils/priceSimulator');
const { seedCrypto } = require('./utils/seedCrypto');

const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message);
  process.exit(1);
});

connectDB().then(async () => {
  await seedCrypto();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
  priceSimulator.start();
});
