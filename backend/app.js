import { createClerkClient, verifyToken } from "@clerk/backend";
import { createServer } from "http";
import dotenv from "dotenv";
import { Server as SocketServer } from "socket.io";
import { addMessage, getMessagesByChannel } from "./messageOperations/index.js";
import { users as usersCollection } from "./config/mongoCollections.js";
import { ObjectId } from "mongodb";

dotenv.config();

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Socket.io server setup with Express for health check
import express from "express";

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: "*",
  },
});
const activeUsers = {}; // Store active users with their channel subscriptions

// Health check endpoint for Socket.io
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    services: {
      socketio: "running",
      port: 4001,
    },
    timestamp: new Date().toISOString(),
  });
});

// Start Socket.io server
httpServer.listen(4001, () => {
  console.log(`🔌 Socket.IO server running on http://localhost:4001`);
});

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

    console.log(`[Socket.IO Auth] User authenticated: ${socket.userEmail} (${socket.userId})`);
    next();
  } catch (error) {
    console.error('[Socket.IO Auth] Authentication failed:', error.message);
    next(new Error('Authentication failed'));
  }
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.userId, socket.userEmail);

  // Store user in activeUsers by userId (for DM routing)
  activeUsers[socket.userId] = socket.id;

  // Handle user connection and channel subscription (legacy project chat)
  socket.on("user_connected", (data) => {
    console.log("User connected (legacy):", data);
    socket.broadcast.emit("user_joined", { user: data });
  });

  // Handle joining a channel
  socket.on("join_channel", async (channel) => {
    console.log(`${socket.id} joined channel: ${channel}`);
    try {
      const messages = await getMessagesByChannel(channel);
      socket.emit("previous_messages", messages);
    } catch (e) {
      console.log(e);
    }
    socket.join(channel);
  });

  // Handle chat message events
  socket.on("chat_message", async (data) => {
    console.log(
      "Message received for channel:",
      data.channel,
      "Message:",
      data
    );

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

  // Join personal DM room (for receiving conversation updates)
  socket.on('join_dm_room', () => {
    const userRoom = `dm:${socket.userId}`;
    socket.join(userRoom);
    console.log(`[DM] ${socket.userEmail} joined personal DM room: ${userRoom}`);
  });

  // Join specific conversation room (for real-time messaging)
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`[DM] ${socket.userEmail} joined conversation: ${conversationId}`);
  });

  // Leave conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`[DM] ${socket.userEmail} left conversation: ${conversationId}`);
  });

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
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.userId, socket.userEmail);
    delete activeUsers[socket.userId];
  });
});

// Export io instance for use in GraphQL resolvers
export { io };
