import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { createClerkClient, verifyToken } from "@clerk/backend";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import mime from "mime-types";
import { typeDefs } from "./graphQl/typeDefs.js";
import { resolvers } from "./graphQl/resolvers.js";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import { users as usersCollection } from "./config/mongoCollections.js";
import { ensureUserProvisioned } from "./helpers/userProvisioning.js";
import { initializeDatabase } from "./helpers/initializeDatabase.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dev tools configuration
const DEV_AUTH_TOOLS_ENABLED = process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_AUTH_TOOLS === 'true';

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Authentication helper
async function authenticateUser(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { isAuthenticated: false, currentUser: null };
  }

  const token = authHeader.substring(7);

  try {
    // Verify token and get user from Clerk
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const userId = payload.sub;
    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || clerkUser.email;

    console.log("[AUTH] Clerk user verification:", {
      clerkUserId: clerkUser.id,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      hasEmail: !!email,
    });

    // Get users collection
    const users = await usersCollection();

    // Log database connection info
    const dbName = users.s?.db?.databaseName || users.dbName || "unknown";
    const collectionName = users.collectionName || users.s?.namespace?.collection || "unknown";
    console.log("[AUTH] MongoDB connection:", {
      database: dbName,
      collection: collectionName,
    });

    // Ensure user is provisioned in MongoDB (atomic upsert by clerkId)
    let currentUser;
    try {
      currentUser = await ensureUserProvisioned({
        clerkUser,
        dbUsersCollection: users,
      });
    } catch (provisionError) {
      console.error("[AUTH] ERROR: User provisioning failed", {
        clerkUserId: clerkUser.id,
        email,
        error: provisionError.message,
      });
      // Return auth failure if provisioning fails
      throw new Error(`User provisioning failed: ${provisionError.message}`);
    }

    return {
      isAuthenticated: true,
      currentUser,
      clerkUserId: clerkUser.id,
      tokenEmail: email,
    };
  } catch (error) {
    console.error("[AUTH] ERROR during authentication:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return { isAuthenticated: false, currentUser: null };
  }
}

// Express app setup
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uploadDir = path.join(__dirname, 'public', 'uploads', String(year), month);

    // Create directory if it doesn't exist
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const ext = mime.extension(file.mimetype) || 'bin';
    cb(null, `${timestamp}-${random}.${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 40 * 1024 * 1024, // 40MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    if (allowedTypes.includes(file.mimetype)) {
      // Check size limits based on type
      if (allowedImageTypes.includes(file.mimetype) && req.headers['content-length'] > 6 * 1024 * 1024) {
        cb(new Error('Image file size must be less than 6MB'));
      } else {
        cb(null, true);
      }
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// Upload endpoint
app.post('/api/upload', async (req, res) => {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization || "";
    const auth = await authenticateUser(authHeader);

    if (!auth.isAuthenticated) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in to upload files'
      });
    }

    // Handle file upload
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({
          error: 'Upload failed',
          message: err.message
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided',
          message: 'Please select a file to upload'
        });
      }

      // Determine media type
      const isImage = req.file.mimetype.startsWith('image/');
      const mediaType = isImage ? 'IMAGE' : 'VIDEO';

      // Build URL
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const url = `http://localhost:4000/static/uploads/${year}/${month}/${req.file.filename}`;

      res.json({
        url,
        type: mediaType,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    });
  } catch (error) {
    console.error('Upload endpoint error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to process upload'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    services: {
      graphql: 'running',
      upload: 'running',
      port: 4000,
    },
    timestamp: new Date().toISOString(),
  });
});

// Dev-only debug endpoint to inspect auth state (gated behind env flags)
app.get('/debug/auth', async (req, res) => {
  // Require both non-production env AND explicit flag
  if (!DEV_AUTH_TOOLS_ENABLED) {
    return res.status(404).json({ error: 'Not found' });
  }

  const authHeader = req.headers.authorization || "";
  const hasAuthHeader = !!authHeader;
  const tokenPresent = authHeader.startsWith("Bearer ");

  let debugInfo = {
    environment: process.env.NODE_ENV || 'development',
    hasAuthHeader,
    tokenPresent,
    authHeaderPrefix: authHeader ? authHeader.substring(0, 20) + "..." : "none",
  };

  if (tokenPresent) {
    try {
      const auth = await authenticateUser(authHeader);
      debugInfo = {
        ...debugInfo,
        isAuthenticated: auth.isAuthenticated,
        clerkUserId: auth.clerkUserId || null,
        tokenEmail: auth.tokenEmail || null,
        mongoUser: auth.currentUser ? {
          _id: auth.currentUser._id.toString(),
          clerkId: auth.currentUser.clerkId,
          email: auth.currentUser.email,
          firstName: auth.currentUser.firstName,
          lastName: auth.currentUser.lastName,
          hasHeadline: !!auth.currentUser.headline,
          hasBio: !!auth.currentUser.bio,
          hasProfilePhoto: !!auth.currentUser.profilePhoto,
        } : null,
      };
    } catch (error) {
      debugInfo.error = error.message;
      debugInfo.isAuthenticated = false;
    }
  } else {
    debugInfo.message = "No Authorization header or invalid format. Expected: 'Authorization: Bearer <token>'";
  }

  res.json(debugInfo);
});

// Apollo Server setup
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});

// Start server
const startServer = async () => {
  // PHASE 1.1 - Print MongoDB connection details at startup
  console.log("\n" + "=".repeat(70));
  console.log("🚀 BACKEND SERVER STARTUP");
  console.log("=".repeat(70));

  // Redact credentials from connection string
  const redactedUrl = process.env.mongoServerUrl
    ? process.env.mongoServerUrl.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@")
    : "NOT_SET";

  console.log("\n📡 MongoDB Configuration:");
  console.log(`   Host (redacted): ${redactedUrl}`);
  console.log(`   Database name:   ${process.env.mongoDbname || "NOT_SET"}`);
  console.log(`   Collection:      users`);
  console.log();

  // Initialize database indexes
  await initializeDatabase();

  await apolloServer.start();

  // Apply Apollo middleware
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || "";

        // Explicit auth context logging (gated behind env flags)
        if (DEV_AUTH_TOOLS_ENABLED) {
          console.log("[CONTEXT] GraphQL request auth state:", {
            hasAuthHeader: !!authHeader,
            authHeaderPrefix: authHeader ? authHeader.substring(0, 20) + "..." : "none",
            tokenPresent: authHeader.startsWith("Bearer "),
          });
        }

        const auth = await authenticateUser(authHeader);

        if (DEV_AUTH_TOOLS_ENABLED) {
          console.log("[CONTEXT] After authentication:", {
            isAuthenticated: auth.isAuthenticated,
            hasCurrentUser: !!auth.currentUser,
            currentUserId: auth.currentUser?._id?.toString(),
            currentUserClerkId: auth.currentUser?.clerkId,
            currentUserEmail: auth.currentUser?.email,
          });
        }

        return {
          auth: {
            isAuthenticated: auth.isAuthenticated,
            clerkUserId: auth.clerkUserId,
            tokenEmail: auth.tokenEmail,
          },
          currentUser: auth.currentUser,
          clerkClient,
        };
      },
    })
  );

  httpServer.listen(4000, () => {
    console.log(`🚀 GraphQL Server ready at: http://localhost:4000/graphql`);
    console.log(`📁 Static files served at: http://localhost:4000/static`);
    console.log(`📤 Upload endpoint at: http://localhost:4000/api/upload`);
  });
};

startServer();
