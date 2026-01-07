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
import { users as usersCollection, conversations as conversationsCollection } from "./config/mongoCollections.js";
import { ensureUserProvisioned } from "./helpers/userProvisioning.js";
import { initializeDatabase } from "./helpers/initializeDatabase.js";
import { Server as SocketServer } from "socket.io";
import { addMessage, getMessagesByChannel } from "./messageOperations/index.js";

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
  // Production-safe: Log whether header exists (not the token itself)
  const hasAuthHeader = !!authHeader;
  const hasBearerPrefix = authHeader?.startsWith("Bearer ");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[AUTH] No Authorization header or invalid format", {
      hasAuthHeader,
      hasBearerPrefix,
      expected: "Authorization: Bearer <token>"
    });
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

    // Get users collection
    const users = await usersCollection();

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

    // Production-safe: Log success without exposing tokens
    console.log("[AUTH] Authentication successful", {
      clerkUserId: clerkUser.id,
      email,
      mongoUserId: currentUser._id.toString()
    });

    return {
      isAuthenticated: true,
      currentUser,
      clerkUserId: clerkUser.id,
      tokenEmail: email,
    };
  } catch (error) {
    // Production-safe: Log error name/message but never log tokens or secrets
    console.error("[AUTH] ERROR during authentication:", {
      errorName: error.name,
      errorMessage: error.message,
      // Only include stack in development
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
    return { isAuthenticated: false, currentUser: null };
  }
}

// Express app setup
const app = express();
const httpServer = createServer(app);

// CORS configuration from env (comma-separated origins)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
const allowedOrigins = FRONTEND_ORIGIN.split(",").map(origin => origin.trim().replace(/\/$/, '')); // Remove trailing slashes

// Socket.IO setup (same httpServer instance!)
const io = new SocketServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});
const activeUsers = {}; // Store active users

// CORS middleware configuration (shared for all routes)
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Normalize origin (remove trailing slash)
    const normalizedOrigin = origin.replace(/\/$/, '');

    // Check if origin is allowed (support wildcard or exact match)
    if (allowedOrigins.includes('*') || allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy. Allowed origins: ${allowedOrigins.join(', ')}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// Socket.IO JWT Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.error("[Socket.IO Auth] No token provided");
      return next(new Error('Authentication token required'));
    }

    // Verify JWT with Clerk
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    });

    const userId = payload.sub;
    const clerkUser = await clerkClient.users.getUser(userId);

    // Get user from MongoDB
    const users = await usersCollection();
    const dbUser = await users.findOne({ clerkId: clerkUser.id });

    if (!dbUser) {
      console.error("[Socket.IO Auth] User not found in database:", clerkUser.id);
      return next(new Error('User not found in database'));
    }

    // Attach user info to socket
    socket.userId = dbUser._id.toString();
    socket.userEmail = clerkUser.emailAddresses?.[0]?.emailAddress || clerkUser.email;
    socket.clerkId = clerkUser.id;

    next();
  } catch (error) {
    console.error('[Socket.IO Auth] Authentication failed:', error.message);
    next(new Error('Authentication failed'));
  }
});

io.on("connection", async (socket) => {
  // Track as online
  activeUsers[socket.userId] = socket.id;

  // Broadcast online status
  io.emit('user_online', { userId: socket.userId });

  // Auto-join personal DM room
  const userRoom = `dm:${socket.userId}`;
  socket.join(userRoom);

  // Auto-join all active conversation rooms
  try {
    const conversationsCol = await conversationsCollection();
    const userConversations = await conversationsCol
      .find({
        'participantObjects.userId': socket.userId
      })
      .project({ _id: 1 })
      .toArray();

    userConversations.forEach(conv => {
      const roomName = `conversation:${conv._id}`;
      socket.join(roomName);
    });
  } catch (error) {
    console.error('[Socket] Failed to join conversation rooms:', error);
  }

  // Handle user connection and channel subscription (legacy project chat)
  socket.on("user_connected", (data) => {
    socket.broadcast.emit("user_joined", { user: data });
  });

  // Handle joining a channel
  socket.on("join_channel", async (channel) => {
    try {
      const messages = await getMessagesByChannel(channel);
      socket.emit("previous_messages", messages);
    } catch (e) {
      console.error('[Socket] Failed to get messages:', e);
    }
    socket.join(channel);
  });

  // Handle chat message events
  socket.on("chat_message", async (data) => {

    const messageDocument = {
      channel: data.channel,
      user: data.user,
      message: data.message,
      timestamp: new Date(),
    };

    await addMessage(messageDocument);

    // Emit the message to all users in the specific channel
    io.to(data.channel).emit("chat_message", data);
  });

  // DIRECT MESSAGING EVENTS

  // Typing indicators
  socket.on('typing_start', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('user_typing', {
      userId: socket.userId,
      conversationId
    });
  });

  socket.on('typing_stop', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
      userId: socket.userId,
      conversationId
    });
  });

  // Handle user disconnection
  socket.on("disconnect", (reason) => {
    delete activeUsers[socket.userId];

    // Broadcast offline status
    io.emit('user_offline', { userId: socket.userId });
  });
});

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

      // Build URL (use BASE_URL env var or construct from request)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      const url = `${baseUrl}/static/uploads/${year}/${month}/${req.file.filename}`;

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
      socketio: 'running',
      upload: 'running',
    },
    port: process.env.PORT || 4000,
    timestamp: new Date().toISOString(),
  });
});

// Dev-only debug endpoint to inspect auth state (gated behind env flags)
const authDebugHandler = async (req, res) => {
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
    hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
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
};

// Register debug endpoints (both paths for convenience)
app.get('/debug/auth', authDebugHandler);
app.get('/auth/debug', authDebugHandler);

// Apollo Server setup
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});

// Start server
const startServer = async () => {
  // PHASE 1.1 - Print MongoDB connection details at startup
  console.log("🚀 Starting backend server...");

  // Initialize database indexes
  await initializeDatabase();

  await apolloServer.start();

  // Apply Apollo middleware (CORS already applied globally)
  app.use(
    '/graphql',
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

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`✅ Server ready at http://localhost:${PORT}`);
    console.log(`   GraphQL: http://localhost:${PORT}/graphql`);
    console.log(`   Socket.IO + Uploads ready`);
    console.log(`   CORS allowed origins: ${allowedOrigins.join(', ')}`);
  });
};

startServer();

// Export io instance for use in GraphQL resolvers
export { io };
