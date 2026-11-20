import mongoose from 'mongoose';
import dns from 'dns';

let memoryServerInstance = null;

export const connectDatabase = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    // In development or testing if no live MongoDB URI is configured,
    // spin up an in-memory MongoDB cluster for instant friction-free development
    if (!mongoUri || mongoUri.includes('placeholder') || mongoUri === 'memory') {
      console.log('⚡ Initializing embedded MongoDB server for local/test environment...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create();
      mongoUri = memoryServerInstance.getUri();
      console.log(`⚡ Connected to embedded MongoDB at: ${mongoUri}`);
    } else if (mongoUri.startsWith('mongodb+srv://')) {
      // Use public reliable DNS resolvers on Windows to prevent querySrv ECONNREFUSED from local ISP/routers
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (dnsErr) {
        console.warn('DNS server customization skipped:', dnsErr.message);
      }
    }

    const options = {
      autoIndex: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoUri, options);
    console.log(`🍃 MongoDB Connected successfully to database: ${mongoose.connection.name}`);
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Failure:', error.message);
    throw error;
  }
};

export const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    if (memoryServerInstance) {
      await memoryServerInstance.stop();
    }
  } catch (error) {
    console.error('Error closing database connection:', error.message);
  }
};
