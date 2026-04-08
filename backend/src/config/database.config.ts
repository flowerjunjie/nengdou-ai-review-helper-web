export default () => ({
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/lingxi_ai',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'lingxi-ai-secret-key-2024',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
});
