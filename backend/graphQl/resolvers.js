//IMPORT STATEMENTS

//GraphQLError: Used for handling GraphQL-specific errors
import { GraphQLError } from "graphql";
import dotenv from "dotenv";

//MongoDB: collections for users, projects, updates, and applications
import {
  users as userCollection,
  projects as projectCollection,
  updates as updateCollection,
  applications as applicationCollection,
  comments as commentCollection,
  posts as postCollection,
  postLikes as postLikesCollection,
  postComments as postCommentsCollection,
  conversations as conversationsCollection,
  directMessages as directMessagesCollection,
} from "../config/mongoCollections.js";

//ObjectId: MongoDB's unique IDs
import { ObjectId } from "mongodb";

//Redis: import and initialize to handle client
import { createClient } from "redis";

//Helpers (Validators)
import * as helpers from "./helpers.js";

//Socket.IO instance for real-time messaging
import { io } from "../server.js";

//REDIS CLIENT SET UP
dotenv.config();

const redisClient = createClient({
  socket: {
    host: process.env.redis_ip, // Service name from docker-compose.yml
    port: process.env.redis_port, // Default Redis port
  },
});

//Catch any Redis client errors and log them for debugging
redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Connect to Redis, and confirm if connection is good or something went wrong.
(async () => {
  try {
    await redisClient.connect();
    // PHASE 5: Removed flushAll from startup - use targeted cache invalidation instead
    console.log("Connected to Redis");
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
  }
})();

// Authorization helper functions (defined outside resolvers object)
const requireAuth = (context) => {
  if (!context.auth.isAuthenticated || !context.currentUser) {
    throw new GraphQLError('You must be logged in to perform this action', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
};

const requireRole = (context, allowedRoles) => {
  requireAuth(context);
  if (!allowedRoles.includes(context.currentUser.role)) {
    throw new GraphQLError(`Access denied. Required roles: ${allowedRoles.join(', ')}`, {
      extensions: { code: 'FORBIDDEN' }
    });
  }
};

//RESOLVERS
export const resolvers = {
  //QUERIES
  Query: {
    //QUERY: users: [User]
    //Purpose: Fetch all users from MongoDB
    //Cache: Cached by list of users in Redis for one hour

    users: async () => {
      //Cache key constructor and check
      const cacheKey = "users";
      const cachedUsers = await redisClient.get(cacheKey);

      //If users are cached, return the parsed JSON (JSON string to object)
      if (cachedUsers) {
        console.log("Returning users from cache.");
        return JSON.parse(cachedUsers);
      }

      //If not cached, pull userCollection and the find all [find({})] users
      const users = await userCollection();
      const allUsers = await users.find({}).toArray();

      //If no users, throw GraphQLError
      if (allUsers.length === 0) {
        console.log("No users found in the database.");
        return [];
      }

      //Cache pulled users, set to cachekey
      //Expiration: 1 hour (60 x 60 = 3600 seconds)
      await redisClient.set(cacheKey, JSON.stringify(allUsers), { EX: 3600 });
      console.log("Users have been fetched from database and are now cached.");

      //Return allUsers
      return allUsers;
    },

    //QUERY: me: User
    //Purpose: Return the currently authenticated user
    me: async (_, __, context) => {
      if (!context.currentUser) {
        return null;
      }
      return context.currentUser;
    },

    //HOME FEED V2 QUERIES

    //QUERY: feed(cursor: FeedCursorInput): FeedPage!
    //Purpose: Fetch paginated posts for the home feed (newest first)
    //Cache: Optional (invalidate on post creation)
    feed: async (_, args, context) => {
      const posts = await postCollection();
      const limit = args.cursor?.limit || 10;
      const cursor = args.cursor?.cursor;

      // Build query for cursor-based pagination
      let query = {};
      if (cursor) {
        // Cursor is the createdAt timestamp
        query.createdAt = { $lt: cursor };
      }

      // Fetch posts sorted by createdAt descending (newest first)
      const fetchedPosts = await posts
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit + 1) // Fetch one extra to determine if there's a next page
        .toArray();

      // Determine if there are more posts
      const hasMore = fetchedPosts.length > limit;
      const items = hasMore ? fetchedPosts.slice(0, limit) : fetchedPosts;
      const nextCursor = hasMore ? items[items.length - 1].createdAt : null;

      return {
        items,
        nextCursor,
      };
    },

    //QUERY: postComments(postId: String!, cursor: CommentsCursorInput): CommentsPage!
    //Purpose: Fetch paginated comments for a specific post
    //Cache: Optional (invalidate on comment creation)
    postComments: async (_, args) => {
      if (!args.postId) {
        throw new GraphQLError("The postId field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      helpers.checkArg(args.postId, "string", "id");

      const comments = await postCommentsCollection();
      const limit = args.cursor?.limit || 5;
      const cursor = args.cursor?.cursor;

      // Build query for cursor-based pagination
      let query = { postId: args.postId };
      if (cursor) {
        query.createdAt = { $lt: cursor };
      }

      // Fetch comments sorted by createdAt descending (newest first)
      const fetchedComments = await comments
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .toArray();

      // Determine if there are more comments
      const hasMore = fetchedComments.length > limit;
      const items = hasMore ? fetchedComments.slice(0, limit) : fetchedComments;
      const nextCursor = hasMore ? items[items.length - 1].createdAt : null;

      return {
        items,
        nextCursor,
      };
    },

    //DIRECT MESSAGING QUERIES

    //QUERY: conversations(cursor: ConversationsCursorInput): ConversationsPage!
    //Purpose: Fetch paginated conversations for current user (newest first)
    //Auth: Authenticated users only
    conversations: async (_, args, context) => {
      requireAuth(context);

      const conversations = await conversationsCollection();
      const limit = args.cursor?.limit || 20;
      const cursor = args.cursor?.cursor;

      const currentUserId = context.currentUser._id.toString();

      // Build query for cursor-based pagination
      let query = {
        'participantObjects.userId': currentUserId
      };

      if (cursor) {
        query.updatedAt = { $lt: cursor };
      }

      // Fetch conversations sorted by updatedAt descending (newest first)
      const fetchedConversations = await conversations
        .find(query)
        .sort({ updatedAt: -1 })
        .limit(limit + 1)
        .toArray();

      // Determine if there are more conversations
      const hasMore = fetchedConversations.length > limit;
      const items = hasMore ? fetchedConversations.slice(0, limit) : fetchedConversations;
      const nextCursor = hasMore ? items[items.length - 1].updatedAt : null;

      return {
        items,
        nextCursor
      };
    },

    //QUERY: conversationMessages(conversationId: String!, cursor: MessagesCursorInput): MessagesPage!
    //Purpose: Fetch paginated messages for a specific conversation
    //Auth: Only conversation participants can access
    conversationMessages: async (_, args, context) => {
      requireAuth(context);

      if (!args.conversationId) {
        throw new GraphQLError('conversationId is required', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      helpers.checkArg(args.conversationId, 'string', 'id');

      // Verify current user is participant
      const conversations = await conversationsCollection();
      const conversation = await conversations.findOne({
        _id: new ObjectId(args.conversationId)
      });

      if (!conversation) {
        throw new GraphQLError('Conversation not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      const currentUserId = context.currentUser._id.toString();
      if (!conversation.participants.includes(currentUserId)) {
        throw new GraphQLError('Access denied. You are not a participant in this conversation.', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // Fetch messages with pagination
      const messages = await directMessagesCollection();
      const limit = args.cursor?.limit || 30;
      const cursor = args.cursor?.cursor;

      let query = { conversationId: args.conversationId };
      if (cursor) {
        query.createdAt = { $lt: cursor };
      }

      const fetchedMessages = await messages
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .toArray();

      const hasMore = fetchedMessages.length > limit;
      const items = hasMore ? fetchedMessages.slice(0, limit) : fetchedMessages;
      const nextCursor = hasMore ? items[items.length - 1].createdAt : null;

      return {
        items,
        nextCursor
      };
    },

    //QUERY: getOrCreateConversation(recipientId: String!): Conversation!
    //Purpose: Get existing conversation with recipient, or create if doesn't exist
    //Auth: Authenticated users only
    getOrCreateConversation: async (_, args, context) => {
      requireAuth(context);

      if (!args.recipientId) {
        throw new GraphQLError('recipientId is required', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      helpers.checkArg(args.recipientId, 'string', 'id');

      const currentUserId = context.currentUser._id.toString();

      // Can't message yourself
      if (currentUserId === args.recipientId) {
        throw new GraphQLError('Cannot create conversation with yourself', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      // Verify recipient exists
      const users = await userCollection();
      const recipient = await users.findOne({ _id: new ObjectId(args.recipientId) });

      if (!recipient) {
        throw new GraphQLError('Recipient not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // Sort participants for consistent lookup
      const participants = [currentUserId, args.recipientId].sort();

      const conversations = await conversationsCollection();

      // Try to find existing conversation
      let conversation = await conversations.findOne({ participants });

      if (!conversation) {
        // Create new conversation
        const now = new Date().toISOString();
        const newConversation = {
          participants,
          participantObjects: [
            { userId: currentUserId, unreadCount: 0, lastReadAt: now },
            { userId: args.recipientId, unreadCount: 0, lastReadAt: now }
          ],
          lastMessage: null,
          createdAt: now,
          updatedAt: now
        };

        const result = await conversations.insertOne(newConversation);
        conversation = { _id: result.insertedId, ...newConversation };
      }

      return conversation;
    },

    //QUERY: projects: [Project]
    //Purpose: Fetch all projects from MongoDB
    //Cache: Cached by list of projects in Redis for one hour

    projects: async () => {
      //Cache key constructor and check
      const cacheKey = "projects";
      const cachedProjects = await redisClient.get(cacheKey);

      //If projects are cached, return the parsed JSON (JSON string to object)
      if (cachedProjects) {
        console.log("Returning projects from cache.");
        return JSON.parse(cachedProjects);
      }

      //If not cached, pull projectCollection and the find all [find({})] projects
      const projects = await projectCollection();
      const allProjects = await projects.find({}).toArray();

      //If no projects, throw GraphQLError
      if (allProjects.length === 0) {
        console.log("No projects found in the database.");
        return [];
      }

      //Cache pulled projects, set to cachekey
      //Expiration: 1 hour (60 x 60 = 3600 seconds)
      await redisClient.set(cacheKey, JSON.stringify(allProjects), {
        EX: 3600,
      });
      console.log(
        "Projects have been fetched from database and are now cached."
      );

      //Return
      return allProjects;
    },

    //QUERY: updates: [Update]
    //Purpose: Fetch all updates from MongoDB
    //Cache: Cached by list of updates in Redis for one hour

    updates: async () => {
      // Cache key constructor and check
      const cacheKey = "updates";
      const cachedUpdates = await redisClient.get(cacheKey);

      // If updates are cached, return the parsed JSON (JSON string to object)
      if (cachedUpdates) {
        console.log("Returning updates from cache.");
        return JSON.parse(cachedUpdates);
      }

      // Pull updates collection from MongoDB
      const updates = await updateCollection();

      // Find all updates from the database
      const allUpdates = await updates.find({}).toArray();

      // If no updates are found, throw an error
      if (allUpdates.length === 0) {
        console.log("No updates found in the database.");
        return [];
      }

      // Cache updates for 1 hour
      await redisClient.set(cacheKey, JSON.stringify(allUpdates), { EX: 3600 });
      console.log(
        "Updates have been fetched from the database and are now cached."
      );

      // Return all updates
      return allUpdates;
    },

    //QUERY: applications: [Application]
    //Purpose: Fetch all applications from MongoDB
    //Cache: Cached by list of applications in Redis for one hour

    applications: async () => {
      // Cache key constructor and check
      const cacheKey = "applications";
      const cachedApplications = await redisClient.get(cacheKey);

      // If applications are cached, return the parsed JSON (JSON string to object)
      if (cachedApplications) {
        console.log("Returning applications from cache.");
        return JSON.parse(cachedApplications);
      }

      // Pull applications collection from MongoDB
      const applications = await applicationCollection();

      // Fetch all applications from the database
      const allApplications = await applications.find({}).toArray();

      // If no applications are found, throw an error
      if (allApplications.length === 0) {
        console.log("No applications found in the database.");
        return [];
      }

      // Cache applications for 1 hour
      await redisClient.set(cacheKey, JSON.stringify(allApplications), {
        EX: 3600,
      });

      console.log(
        "Applications have been fetched from the database and are now cached."
      );

      // Return all applications
      return allApplications;
    },

    //QUERY: comments: [Comment]
    //Purpose: Fetch all comments from MongoDB
    //Cache: Cached by list of comments in Redis for one hour

    comments: async () => {
      // Cache key constructor and check
      const cacheKey = "comments";
      const cachedComments = await redisClient.get(cacheKey);

      // If comments are cached, return the parsed JSON (JSON string to object)
      if (cachedComments) {
        console.log("Returning comments from cache.");
        return JSON.parse(cachedComments);
      }

      // Pull the comments collection from MongoDB
      const comments = await commentCollection();

      // Fetch all comments from the database
      const allComments = await comments.find({}).toArray();

      // If no comments are found, throw an error
      if (allComments.length === 0) {
        console.log("No comments found in the database.");
        return [];
      }

      // Cache comments for 1 hour
      await redisClient.set(cacheKey, JSON.stringify(allComments), {
        EX: 3600,
      });

      console.log(
        "Comments have been fetched from the database and are now cached."
      );

      // Return all comments
      return allComments;
    },

    //QUERY: getUserById(_id: String!): User
    //Purpose: Fetch an user by ID from MongoDB; check Redis cache first
    //Cache: Cached by user ID in Redis indefinitely

    getUserById: async (_, args) => {
      // Check if required fields are present
      if (!args._id) {
        throw new GraphQLError("The _id field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["_id"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      //Helpers: check objectId
      helpers.checkArg(args._id, "string", "id");

      //Cache key constructor and check
      //Why use 'user:': ensures seperation between types with ids (users, projects, etc); clarity
      const cacheKey = `user:${args._id}`;
      const cachedUser = await redisClient.get(cacheKey);

      //If the cachedUser is cached, return the parsed JSON (JSON string to object)
      if (cachedUser) {
        console.log("Returning user from cache.");
        return JSON.parse(cachedUser);
      }

      //If not cached, pull user collection and then findOne specific user
      const users = await userCollection();
      const user = await users.findOne({ _id: new ObjectId(args._id) });

      //If no user, throw GraphQLError
      if (!user) {
        throw new GraphQLError("User not found in the database.", {
          //Optional object: extra information. NOT_FOUND = status code 404
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      //Set user into redis Cache; set to cacheKey
      //No expiration on cache
      await redisClient.set(cacheKey, JSON.stringify(user));
      console.log("User has been fetched from database and is now cached.");

      //Return user
      return user;
    },

    //QUERY: getProjectById(_id: String!): Project
    //Purpose: Fetch a project by ID from MongoDB; check Redis cache first
    //Cache: Cached by project ID in Redis indefinitely

    getProjectById: async (_, args) => {
      // Check if required fields are present
      if (!args._id) {
        throw new GraphQLError("The _id field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["_id"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      //Helpers: check objectId
      helpers.checkArg(args._id, "string", "id");

      //Cache key constructor and check
      //Why use 'project:': ensures seperation between types with ids; clarity
      const cacheKey = `project:${args._id}`;
      const cachedProject = await redisClient.get(cacheKey);

      //If the project is cached, return the parsed JSON (JSON string to object)
      if (cachedProject) {
        console.log("Returning project from cache.");
        return JSON.parse(cachedProject);
      }

      //If not cached, pull project collection and then findOne specific project
      const projects = await projectCollection();
      const project = await projects.findOne({ _id: new ObjectId(args._id) });

      //If no project, throw GraphQLError

      if (!project) {
        throw new GraphQLError("Project Not Found", {
          //Optional object: extra information. NOT_FOUND = status code 404
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      //Set project into redis Cache; set to cacheKey
      //No expiration on cache
      await redisClient.set(cacheKey, JSON.stringify(project));
      console.log("Project has been fetched from database and is now cached.");

      //Return project
      return project;
    },

    //QUERY: getUpdateById(_id: String!): Update
    //Purpose: Fetch a update by ID from MongoDB; check Redis cache first
    //Cache: Cached by update ID in Redis indefinitely

    getUpdateById: async (_, args) => {
      // Check if required fields are present
      if (!args._id) {
        throw new GraphQLError("The _id field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["_id"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      // Helpers: check ObjectId 
      helpers.checkArg(args._id, "string", "id");

      // Cache key constructor and check
      const cacheKey = `update:${args._id}`;
      const cachedUpdate = await redisClient.get(cacheKey);

      // If the update is cached, return the parsed JSON
      if (cachedUpdate) {
        console.log("Returning update from cache.");
        return JSON.parse(cachedUpdate);
      }

      // If not cached, pull the update collection and findOne based on update ID
      const updates = await updateCollection();
      const update = await updates.findOne({ _id: new ObjectId(args._id) });

      // If no update, throw GraphQLError
      if (!update) {
        throw new GraphQLError("Update Not Found", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Cache update indefinitely
      await redisClient.set(cacheKey, JSON.stringify(update));
      console.log("Update has been fetched from database and is now cached.");

      // Return update
      return update;
    },

    //QUERY: getApplicationById(_id: String!): Application
    //Purpose: Fetch an application by ID from MongoDB; check Redis cache first
    //Cache: Cached by application ID in Redis indefinitely

    getApplicationById: async (_, args) => {
      // Check if required fields are present
      if (!args._id) {
        throw new GraphQLError("The _id field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["_id"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      // Helpers: check ObjectId
      helpers.checkArg(args._id, "string", "id");

      // Cache key constructor and check
      const cacheKey = `application:${args._id}`;
      const cachedApplication = await redisClient.get(cacheKey);

      // If the application is cached, return the parsed JSON
      if (cachedApplication) {
        console.log("Returning application from cache.");
        return JSON.parse(cachedApplication);
      }

      // If not cached, pull the application collection and findOne based on application ID
      const applications = await applicationCollection();
      const application = await applications.findOne({
        _id: new ObjectId(args._id),
      });

      // If no application, throw GraphQLError
      if (!application) {
        throw new GraphQLError("Application Not Found", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Cache application indefinitely
      await redisClient.set(cacheKey, JSON.stringify(application));
      console.log(
        "Application has been fetched from database and is now cached."
      );

      // Return application
      return application;
    },

    //QUERY: getCommentById(_id: String!): Comment
    //Purpose: Fetch a comment by ID from MongoDB; check Redis cache first
    //Cache: Cached by comment ID in Redis indefinitely

    getCommentById: async (_, args) => {
      // Check if required fields are present
      if (!args._id) {
        throw new GraphQLError("The _id field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["_id"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      // Helpers: check ObjectId
      helpers.checkArg(args._id, "string", "id");

      // Cache key constructor and check
      const cacheKey = `comment:${args._id}`;
      const cachedComment = await redisClient.get(cacheKey);

      if (cachedComment) {
        console.log("Returning comment from cache.");
        return JSON.parse(cachedComment);
      }

      // Fetch comment from the database
      const comments = await commentCollection();
      const comment = await comments.findOne({ _id: new ObjectId(args._id) });

      if (!comment) {
        throw new GraphQLError("Comment not found in the database.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Cache comment
      await redisClient.set(cacheKey, JSON.stringify(comment));
      console.log("Comment has been fetched from database and is now cached.");

      return comment;
    },

    // QUERY: getProfessorsByProjectId(projectId: String!): [User]
    // Purpose: Fetch all professors of a project by the project ID
    // Cache: for an hour

    getProfessorsByProjectId: async (_, args) => {
      // Check if required field 'projectId' is present
      if (!args.projectId) {
        throw new GraphQLError("The projectId field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["projectId"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      //Check objectID
      helpers.checkArg(args.projectId, "string", "id");

      // Cache key constructor and check
      const cacheKey = `professors:${args.projectId}`;
      const cachedProfessors = await redisClient.get(cacheKey);

      //If projects are cached, then return
      if (cachedProfessors) {
        return JSON.parse(cachedProfessors);
      }

      //If not cached, pull entire project collction
      const projects = await projectCollection();

      //Pull all projects associated with the provided projectId using find.
      //Change the string projectId argument into an objectId
      const project = await projects.findOne({
        _id: new ObjectId(args.projectId),
      });

      // Check if project exists
      if (!project) {
        throw new GraphQLError("Project not found in the database.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      //Pull users
      const users = await userCollection();

      //Pull array of professorIds from the project objects
      const professorIds = project.professors || [];

      //Match all professorIds against the user objects. Store in array
      const professors = await users
        .find({
          _id: { $in: professorIds.map((id) => new ObjectId(id)) },
          role: "PROFESSOR",
        })
        .toArray();

      // Cach
      await redisClient.set(cacheKey, JSON.stringify(professors), { EX: 3600 });

      // Return the array of professor User objects
      return professors;
    },

    // QUERY: getStudentsByProjectId(projectId: String!): [User]
    // Purpose: Fetch all students of a project by the project ID
    // Cache: For one hour

    getStudentsByProjectId: async (_, args) => {
      // Check if required field 'projectId' is present
      if (!args.projectId) {
        throw new GraphQLError("The projectId field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["projectId"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      //Check objectID
      helpers.checkArg(args.projectId, "string", "id");

      // Cache key constructor and check
      const cacheKey = `students:${args.projectId}`;
      const cachedStudents = await redisClient.get(cacheKey);

      //If projects are cached, then return
      if (cachedStudents) {
        return JSON.parse(cachedStudents);
      }

      //If not cached, pull entire project collction
      const projects = await projectCollection();

      //Pull all projects associated with the provided projectId using find.
      //Change the string projectId argument into an objectId
      const project = await projects.findOne({
        _id: new ObjectId(args.projectId),
      });

      // Check if project exists
      if (!project) {
        throw new GraphQLError("Project not found in the database.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      //Pull users
      const users = await userCollection();

      //Pull array of professorIds from the project objects
      const studentIds = project.students || [];

      //Match all studentIds against the user objects. Store in array
      //ADD the extra match element that their role needs to be STUDENT
      const students = await users
        .find({
          _id: { $in: studentIds.map((id) => new ObjectId(id)) },
          role: "STUDENT",
        })
        .toArray();

      // Cache
      await redisClient.set(cacheKey, JSON.stringify(students), { EX: 3600 });

      // Return the array of student User objects
      return students;
    },

    // QUERY: getProjectsByUserId(userId: String!): [Project]
    // Purpose: Fetch all projects associated with a user by the user's string ID
    // Cache: For one hour

    getProjectsByUserId: async (_, args) => {
      // Check if required field 'userId' is present
      if (!args._id) {
        throw new GraphQLError("The userId field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["_id"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      //Check objectID
      helpers.checkArg(args._id, "string", "id");

      // Cache key construction
      const cacheKey = `projects:${args._id}`;
      const cachedProjects = await redisClient.get(cacheKey);

      // If projects are cached, return the cached data
      if (cachedProjects) {
        return JSON.parse(cachedProjects);
      }

      //Turn args._id into an object id
      const userId = args._id;

      //If not cached, pull entire project collction
      const projects = await projectCollection();

      // Fetch all projects where the user is listed in professors or students
      const userProjects = await projects
        .find({
          $or: [{ professors: userId }, { students: userId }],
        })
        .toArray();

      // Cache the results for one hour
      await redisClient.set(cacheKey, JSON.stringify(userProjects), {
        EX: 3600,
      });

      // Return the list of projects
      return userProjects;
    },

    // QUERY: getCommentsByUpdateId(updateId: String!): [Comment]
    // Purpose: Fetch all comments of an update by the update ID
    // Cache: For one hour

    getCommentsByUpdateId: async (_, args) => {
      // Check if required field '_id' (updateId) is present
      if (!args.updateId) {
        throw new GraphQLError("The updateId field (_id) is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["updateId"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      // Validate the 'updateId' argument
      helpers.checkArg(args.updateId, "string", "id");

      // Cache key constructor and check
      const cacheKey = `comments:${args.updateId}`;
      const cachedComments = await redisClient.get(cacheKey);

      // If comments are cached, return them
      if (cachedComments) {
        console.log("Returning comments from cache.");
        return JSON.parse(cachedComments);
      }

      // Fetch comments from the database based on destinationId
      const comments = await commentCollection();
      const fetchedComments = await comments
        .find({ destinationId: args.updateId })
        .toArray();

      // Cache the result
      await redisClient.set(cacheKey, JSON.stringify(fetchedComments), {
        EX: 3600,
      });

      // Return the list of comments
      return fetchedComments;
    },

    // QUERY: getCommentsByApplicationId(updateId: String!): [Comment]
    // Purpose: Fetch all comments of an application by the application ID
    // Cache: For one hour

    getCommentsByApplicationId: async (_, args) => {
      // Check if required field '_id' (applicationId) is present
      if (!args.applicationId) {
        throw new GraphQLError("The applicationId field (_id) is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["applicationId"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      // Validate _id as a string
      helpers.checkArg(args.applicationId, "string", "id");

      // Cache key constructor and check
      const cacheKey = `comments:${args.applicationId}`;
      const cachedComments = await redisClient.get(cacheKey);

      // If comments are cached, return them
      if (cachedComments) {
        console.log("Returning comments from cache.");
        return JSON.parse(cachedComments);
      }

      // Fetch comments from the database based on destinationId
      const comments = await commentCollection();
      const fetchedComments = await comments
        .find({ destinationId: args.applicationId })
        .toArray();

      // Cache the result
      await redisClient.set(cacheKey, JSON.stringify(fetchedComments), {
        EX: 3600,
      });

      // Return the list of comments
      return fetchedComments;
    },

    //QUERY: projectsByDepartment(department: Department!): [Project]
    //Purpose: Fetch all projects that match the specified department
    //Cache: Cached by department in Redis for one hour

    projectsByDepartment: async (_, args) => {
      // Check if required fields are present
      if (!args.department) {
        throw new GraphQLError("The department field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["department"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      //Helpers, checks
      helpers.checkArg(args.department, "string", "department");

      //Cache key constructor and check
      //Cache key: note as department, and then use the provided argument's department as we're pulling based on this
      const cacheKey = `department:${args.department.trim()}`;
      const cachedDepartment = await redisClient.get(cacheKey);

      //If the department is cached, return the parsed JSON (JSON string to object)
      if (cachedDepartment) {
        console.log("Returning projects from stated department from cache.");
        return JSON.parse(cachedDepartment);
      }

      //If department not cached, pull the project collection then all project with the specific department
      //Use the '.find' function again, but this time, use match the department (as oppposed to the id as usual)
      const projects = await projectCollection();
      const projectsByDepartmnet = await projects
        .find({ department: args.department.trim() })
        .toArray();

      //If no projects by department found, retrun an empty array
      if (projectsByDepartmnet.length === 0) {
        console.log("No projects found for the department.");
        //Why empty array and not throw error? Allowing the possibility that projects of this department simply not added yet.
        return [];
      }

      //Cache the departmnet for one hour.
      //Expiration: 1 hour (60 x 60 = 3600 seconds)
      await redisClient.set(cacheKey, JSON.stringify(projectsByDepartmnet), {
        EX: 3600,
      });
      console.log(
        "Projects by department have been fetched from database and are now cached."
      );

      //Return the projectsByDepartment
      return projectsByDepartmnet;
    },

    //QUERY: updatesBySubject(subject: UpdateSubject!): [Update]
    //Purpose: Fetch all updates that match the specified subject
    //Cache: Cached by subject in Redis for one hour

    updatesBySubject: async (_, args) => {
      // Check if required fields are present
      if (!args.subject) {
        throw new GraphQLError("The subject field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["subject"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      // Helpers, checks
      // Validate subject as a string
      helpers.checkArg(args.subject, "string", "subject");

      // Ensure subject matches the enum of UpdateSubject
      helpers.checkSubject(args.subject);

      // Cache key constructor and check
      // Cache key: note as subject, and then use the provided argument's subject as we're pulling based on this
      const cacheKey = `subject:${args.subject.trim()}`;
      const cachedSubject = await redisClient.get(cacheKey);

      // If the subject is cached, return the parsed JSON (JSON string to object)
      if (cachedSubject) {
        console.log("Returning updates from stated subject from cache.");
        return JSON.parse(cachedSubject);
      }

      // If subject not cached, pull the update collection then all updates with the specific subject
      // Use the '.find' function to match the subject (instead of the ID as usual)
      const updates = await updateCollection();
      const updatesBySubject = await updates
        .find({ subject: args.subject.trim() })
        .toArray();

      // If no updates by subject found, return an empty array
      if (updatesBySubject.length === 0) {
        console.log("No updates found for the subject.");
        // Why empty array and not throw error? Allowing the possibility that updates of this subject have simply not been added yet.
        return [];
      }

      // Cache the subject for one hour.
      // Expiration: 1 hour (60 x 60 = 3600 seconds)
      await redisClient.set(cacheKey, JSON.stringify(updatesBySubject), {
        EX: 3600,
      });
      console.log(
        "Updates by subject have been fetched from database and are now cached."
      );

      // Return the updatesBySubject
      return updatesBySubject;
    },

    //QUERY: projectsByCreatedYear(min: Int!, max: Int!): [Project]
    //Purpose: Fetch all projects established within a min/max year range
    //Cache: Cached by year range in Redis for one hour

    projectsByCreatedYear: async (_, args) => {
      const { min, max } = args;
      const currentYear = new Date().getFullYear();

      // Check for extra fields
      const fieldsAllowed = ["min", "max"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }
      //Checks
      //CheckArg will be enough this time for the checking of required fields.
      helpers.checkYearRange(min, max);
      helpers.checkArg(min, "number", "min");
      helpers.checkArg(max, "number", "max");

      //Cache key constructor and check
      //Cache key: note as createYear, and then use the provided argument's createYear as we're pulling based on this
      const cacheKey = `createdYear:${min}:${max}`;
      const cachedProjectsByYear = await redisClient.get(cacheKey);

      if (cachedProjectsByYear) {
        console.log("Returning projects by stated years from cache.");
        return JSON.parse(cachedProjectsByYear);
      }

      //If no projects cached by year established, then pull all projects
      const projects = await projectCollection();

      // Turn projects into an array to allow for filtering.
      const allProjects = await projects.find({}).toArray();

      // Filter projects based on year range by converting string dates to Date objects
      const projectsByCreatedRange = allProjects.filter((project) => {
        if (!project.createdDate) return false;

        const projectYear = new Date(project.createdDate).getFullYear();

        //Return the boolean based on if the year is within the provided range
        return projectYear >= min && projectYear <= max;
      });

      if (projectsByCreatedRange.length === 0) {
        console.log("For the specified year range, no projects found.");
        return [];
      }

      //Cache the projectsByCreatedRange for one hour.
      //Expiration: 1 hour (60 x 60 = 3600 seconds)
      await redisClient.set(cacheKey, JSON.stringify(projectsByCreatedRange), {
        EX: 3600,
      });
      console.log(
        "Projects for this year range have been fetched from database and are now cached."
      );

      //Return the projects from within the range
      return projectsByCreatedRange;
    },

    //QUERY: searchProjectByTitle(searchTerm: String!): [Project]
    //Purpose: Search projects by title, case-insensitive
    //Cache: Cached by search term in Redis for one hour

    searchProjectByTitle: async (_, args) => {
      // Check if required field 'searchTerm' is present
      if (!args.searchTerm) {
        throw new GraphQLError("The searchTerm field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["searchTerm"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      //Checks
      helpers.checkArg(args.searchTerm, "string", "searchTerm");

      // Ensure case-insensitive caching by making the search term lowercase
      const lowercaseSearchTerm = args.searchTerm.toLowerCase().trim();

      // Cache key constructor and check
      // Cache key: note as search term for project
      const cacheKey = `search:project:${lowercaseSearchTerm}`;
      const cachedProjectsByTitle = await redisClient.get(cacheKey);

      //If projects cached based on search term, return
      if (cachedProjectsByTitle) {
        console.log("Returning projects found by search term from cache.");
        return JSON.parse(cachedProjectsByTitle);
      }

      //If projects not cached based on search term, pull the project collection
      const projects = await projectCollection();

      //Use the '.find' function again
      //$regex: regular expression for pattern matching, $options: 'i' for case-insensitive search
      const projectsByTitle = await projects
        .find({ title: { $regex: args.searchTerm.trim(), $options: "i" } })
        .toArray();

      // If no projects are found, return an empty array
      if (projectsByTitle.length === 0) {
        console.log("No projects found matching the given search term.");
        return [];
      }

      //Set projectsByTitle to cache based on cacheKey
      await redisClient.set(cacheKey, JSON.stringify(projectsByTitle), {
        EX: 3600,
      });

      //Return the projects found by search term (for title)
      return projectsByTitle;
    },

    //QUERY: searchUserByName(searchTerm: String!): [User]
    //Purpose: Search users by name, case-insensitive
    //Cache: Cached by search term in Redis for one hour

    searchUserByName: async (_, args) => {
      // Check if required field 'searchTerm' is present
      if (!args.searchTerm) {
        throw new GraphQLError("The searchTerm field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["searchTerm"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      // Checks
      helpers.checkArg(args.searchTerm, "string", "searchTerm");

      // Ensure case-insensitive caching by mamkaing the search term lowercase
      const lowercaseSearchTerm = args.searchTerm.toLowerCase().trim();

      // Cache key constructor and check
      // Cache key: note as search term for user
      const cacheKey = `search:user:${lowercaseSearchTerm}`;
      const cachedUsersBySearch = await redisClient.get(cacheKey);

      //If users cachedUsersBySearch by searchTerm, return
      if (cachedUsersBySearch) {
        console.log("Returning searched users from cache.");
        return JSON.parse(cachedUsersBySearch);
      }

      //If users not cached by search term, then pull user collection
      const users = await userCollection();

      //Use the '.find' function again
      // $regex: regular expression for pattern matching, $options: 'i' for case-insensitive search
      const usersBySearch = await users
        .find({
          $or: [
            { firstName: { $regex: args.searchTerm.trim(), $options: "i" } },
            { lastName: { $regex: args.searchTerm.trim(), $options: "i" } },
          ],
        })
        .toArray();

      //If no user for search term, return an empty array
      if (usersBySearch.length === 0) {
        console.log("A user was not found matching the search criteria.");
        return [];
      }

      //Cache the usersBySearch for one hour.
      //Expiration: 1 hour (60 x 60 = 3600 seconds)
      await redisClient.set(cacheKey, JSON.stringify(usersBySearch), {
        EX: 3600,
      });
      console.log(
        "Searched users were fetched from database and are now cached."
      );

      //Return the users pulled based on search term (name)
      return usersBySearch;
    },
  },

  //COMPUTED VALUES: USER
  User: {
    // COMPUTED VALUE: user: numOfApplications

    numOfApplications: async (parentValue) => {
      const applications = await applicationCollection();
      const numOfApplications = await applications.countDocuments({
        applicantId: parentValue._id.toString(),
      });
      return numOfApplications || 0;
    },

    // COMPUTED VALUE: user: applications

    applications: async (parentValue) => {
      const applications = await applicationCollection();
      const userApplications = await applications
        .find({
          applicantId: parentValue._id.toString(),
        })
        .toArray();
      return userApplications || [];
    },

    // COMPUTED VALUE: user: applications

    numOfProjects: async (parentValue) => {
      const projects = await projectCollection();
      const numOfProjects = await projects.countDocuments({
        $or: [
          { professors: parentValue._id.toString() },
          { students: parentValue._id.toString() },
        ],
      });
      return numOfProjects || 0;
    },

    // COMPUTED VALUE: user: applications

    projects: async (parentValue) => {
      const projects = await projectCollection();
      const userProjects = await projects
        .find({
          $or: [
            { professors: parentValue._id.toString() },
            { students: parentValue._id.toString() },
          ],
        })
        .toArray();
      return userProjects || [];
    },
  },

  //COMPUTED VALUES: PROJECT
  Project: {
    // COMPUTED VALUE: project: numOfApplications

    numOfApplications: async (parentValue) => {
      const applications = await applicationCollection();
      const numOfApplications = await applications.countDocuments({
        projectId: parentValue._id.toString(),
      });
      return numOfApplications || 0;
    },

    // COMPUTED VALUE: project: applications

    applications: async (parentValue) => {
      const applications = await applicationCollection();
      const projectApplications = await applications
        .find({ projectId: parentValue._id.toString() })
        .toArray();
      return projectApplications || [];
    },

    // COMPUTED VALUE: project: numOfUpdates

    numOfUpdates: async (parentValue) => {
      const updates = await updateCollection();
      const numOfUpdates = await updates.countDocuments({
        projectId: parentValue._id.toString(),
      });
      return numOfUpdates || 0;
    },

    // COMPUTED VALUE: project: updates

    updates: async (parentValue) => {
      const updates = await updateCollection();
      const projectUpdates = await updates
        .find({ projectId: parentValue._id.toString() })
        .toArray();
      return projectUpdates || [];
    },

    // COMPUTED VALUE: project: professors

    professors: async (parentValue) => {
      const users = await userCollection();
      if (
        !parentValue.professors ||
        !Array.isArray(parentValue.professors) ||
        parentValue.professors.length === 0
      ) {
        return [];
      }
      const professorObjectIds = parentValue.professors.map(
        (id) => new ObjectId(id)
      );
      console.log(professorObjectIds);
      const projectProfessors = await users
        .find({
          _id: {
            $in: professorObjectIds,
          },
          role: "PROFESSOR",
        })
        .toArray();
      return projectProfessors || [];
    },

    // COMPUTED VALUE: project: students

    students: async (parentValue) => {
      const users = await userCollection();
      if (!parentValue.students || !Array.isArray(parentValue.students)) {
        return [];
      }
      const projectStudents = await users
        .find({
          _id: { $in: parentValue.students.map((id) => new ObjectId(id)) },
          role: "STUDENT",
        })
        .toArray();
      return projectStudents || [];
    },
  },

  //COMPUTED VALUE: UPDATES
  Update: {
    //COMPUTED VALUE: updates: posterUser (User who posted update)

    posterUser: async (parentValue) => {
      const users = await userCollection();
      const posterUser = await users.findOne({
        _id: new ObjectId(parentValue.posterUserId),
      });

      //Provide a fallback object for poster if not found (probably from being deleted)
      if (!posterUser) {
        console.warn(
          `User not found for posterUserId: ${parentValue.posterUserId}`
        );
        return {
          _id: "unknown",
          firstName: "Unknown",
          lastName: "User",
          email: "unknown@example.com",
          role: "STUDENT",
          department: "COMPUTER_SCIENCE",
          bio: "User not found.",
        };
      }
      return posterUser;
    },

    //COMPUTED VALUE: updates: project

    project: async (parentValue) => {
      const projects = await projectCollection();
      const project = await projects.findOne({
        _id: new ObjectId(parentValue.projectId),
      });

      //Provide a fallback object for project if not found (probably from being deleted)
      if (!project) {
        console.warn(
          `Project not found for projectId: ${parentValue.projectId}`
        );
        return {
          _id: "unknown",
          title: "Unknown Project",
          description: "Project not found.",
          createdDate: new Date().toISOString(),
          department: "COMPUTER_SCIENCE",
        };
      }
      return project;
    },

    //COMPUTED VALUE: updates: comments

    comments: async (parentValue) => {
      const comments = await commentCollection();
      const updateComments = await comments
        .find({ destinationId: parentValue._id.toString() })
        .toArray();
      return updateComments || [];
    },

    //COMPUTED VALUE: updates: numOfComments

    numOfComments: async (parentValue) => {
      const comments = await commentCollection();
      const numOfComments = await comments.countDocuments({
        destinationId: parentValue._id.toString(),
      });
      return numOfComments || 0;
    },
  },

  //COMPUTED VALUES: APPLICATION
  Application: {
    //COMPUTED VALUE: application: applicant

    applicant: async (parentValue) => {
      const users = await userCollection();
      const applicant = await users.findOne({
        _id: new ObjectId(parentValue.applicantId),
      });

      //Provide a fallback object for applicant if not found (probably from being deleted)
      if (!applicant) {
        console.warn(
          `Applicant not found for applicantId: ${parentValue.applicantId}`
        );
        return {
          _id: "unknown",
          firstName: "Unknown",
          lastName: "User",
          email: "unknown@example.com",
          role: "STUDENT",
          department: "COMPUTER_SCIENCE",
          bio: "User not found.",
        };
      }
      return applicant;
    },

    //COMPUTED VALUE: application: project

    project: async (parentValue) => {
      const projects = await projectCollection();
      const project = await projects.findOne({
        _id: new ObjectId(parentValue.projectId),
      });

      //Provide a fallback object for project if not found (probably from being deleted)
      if (!project) {
        console.warn(
          `Project not found for projectId: ${parentValue.projectId}`
        );
        return {
          _id: "unknown",
          title: "Unknown Project",
          description: "Project not found.",
          createdDate: new Date().toISOString(),
          department: "COMPUTER_SCIENCE",
        };
      }
      return project;
    },

    //COMPUTED VALUE: application: comments

    comments: async (parentValue) => {
      const comments = await commentCollection();
      const applicationComments = await comments
        .find({ destinationId: parentValue._id.toString() })
        .toArray();
      return applicationComments || [];
    },

    //COMPUTED VALUE: application: numOfComments

    numOfComments: async (parentValue) => {
      const comments = await commentCollection();
      const numOfComments = await comments.countDocuments({
        destinationId: parentValue._id.toString(),
      });
      return numOfComments || 0;
    },
  },

  //COMPUTED VALUES: COMMENT:
  Comment: {
    //COMPUTED VALUE: comment: commenter

    commenter: async (parentValue) => {
      const users = await userCollection();
      const commenter = await users.findOne({
        _id: new ObjectId(parentValue.commenterId),
      });

      //Provide a fallback object for commenter if not found (probably from being deleted)
      if (!commenter) {
        console.warn(
          `Commenter not found for commenterId: ${parentValue.commenterId}`
        );
        return {
          _id: "unknown",
          firstName: "Unknown",
          lastName: "User",
          email: "unknown@example.com",
          role: "STUDENT",
          department: "COMPUTER_SCIENCE",
          bio: "User not found.",
        };
      }
      return commenter;
    },
  },

  //HOME FEED V2 FIELD RESOLVERS

  Post: {
    //FIELD: author
    //Purpose: Resolve the author user object from userId
    author: async (parentValue) => {
      const users = await userCollection();
      const author = await users.findOne({
        _id: new ObjectId(parentValue.userId),
      });

      if (!author) {
        console.warn(`Author not found for userId: ${parentValue.userId}`);
        return {
          _id: "unknown",
          firstName: "Unknown",
          lastName: "User",
          email: "unknown@example.com",
          role: "STUDENT",
          department: "COMPUTER_SCIENCE",
          bio: "User not found.",
        };
      }
      return author;
    },

    //FIELD: viewerHasLiked
    //Purpose: Check if the current authenticated user has liked this post
    viewerHasLiked: async (parentValue, _, context) => {
      if (!context.currentUser) {
        return false;
      }

      const likes = await postLikesCollection();
      const like = await likes.findOne({
        postId: parentValue._id.toString(),
        userId: context.currentUser._id.toString(),
      });

      return !!like;
    },
  },

  PostComment: {
    //FIELD: commenter
    //Purpose: Resolve the commenter user object from userId
    commenter: async (parentValue) => {
      const users = await userCollection();
      const commenter = await users.findOne({
        _id: new ObjectId(parentValue.userId),
      });

      if (!commenter) {
        console.warn(`Commenter not found for userId: ${parentValue.userId}`);
        return {
          _id: "unknown",
          firstName: "Unknown",
          lastName: "User",
          email: "unknown@example.com",
          role: "STUDENT",
          department: "COMPUTER_SCIENCE",
          bio: "User not found.",
        };
      }
      return commenter;
    },
  },

  //DIRECT MESSAGING FIELD RESOLVERS

  Conversation: {
    //FIELD: participants
    //Purpose: Resolve participant user objects from participant IDs
    participants: async (parent) => {
      const users = await userCollection();
      const participantIds = parent.participants.map(id => new ObjectId(id));
      const userObjects = await users.find({ _id: { $in: participantIds } }).toArray();
      return userObjects;
    },

    //FIELD: lastMessage
    //Purpose: Resolve last message with sender user object
    lastMessage: async (parent) => {
      if (!parent.lastMessage) return null;

      const users = await userCollection();
      const sender = await users.findOne({ _id: new ObjectId(parent.lastMessage.senderId) });

      if (!sender) {
        console.warn(`Sender not found for lastMessage in conversation: ${parent._id}`);
        return {
          text: parent.lastMessage.text,
          sender: {
            _id: "unknown",
            firstName: "Unknown",
            lastName: "User",
            email: "unknown@example.com",
            role: "STUDENT",
            department: "COMPUTER_SCIENCE",
          },
          timestamp: parent.lastMessage.timestamp
        };
      }

      return {
        text: parent.lastMessage.text,
        sender,
        timestamp: parent.lastMessage.timestamp
      };
    },

    //FIELD: unreadCount
    //Purpose: Return unread count for current user
    unreadCount: (parent, _, context) => {
      const currentUserId = context.currentUser?._id.toString();
      if (!currentUserId) return 0;

      const participantObj = parent.participantObjects.find(
        p => p.userId === currentUserId
      );
      return participantObj?.unreadCount || 0;
    }
  },

  DirectMessage: {
    //FIELD: sender
    //Purpose: Resolve sender user object from senderId
    sender: async (parent) => {
      const users = await userCollection();
      const sender = await users.findOne({ _id: new ObjectId(parent.senderId) });

      if (!sender) {
        console.warn(`Sender not found for message: ${parent._id}`);
        return {
          _id: "unknown",
          firstName: "Unknown",
          lastName: "User",
          email: "unknown@example.com",
          role: "STUDENT",
          department: "COMPUTER_SCIENCE",
        };
      }

      return sender;
    },

    //FIELD: isRead
    //Purpose: Check if current user has read this message
    isRead: (parent, _, context) => {
      const currentUserId = context.currentUser?._id.toString();
      if (!currentUserId) return false;

      return parent.readBy.includes(currentUserId);
    }
  },

  Mutation: {
    //MUTATION: addUser
    //Purpose: Add new user object to user database
    //Cache: Add cache for individual user; delete cache for all users

    addUser: async (_, args) => {
      //Have to go before traditional checks. Why? confirm they exist before you use them.
      //Check if required fields there
      if (
        !args.firstName ||
        !args.lastName ||
        !args.email ||
        !args.role ||
        !args.department
      ) {
        throw new GraphQLError(
          "To create a user, their first name, last name, email, role and department must be provided.",
          {
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      //Check that no extra fields provided
      const fieldsAllowed = [
        "firstName",
        "lastName",
        "email",
        "role",
        "department",
        "bio",
      ];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            //Similar status code: 404
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      //Checks
      helpers.checkArg(args.firstName, "string", "name");
      helpers.checkArg(args.lastName, "string", "name");
      helpers.checkArg(args.email, "string", "email");
      helpers.checkArg(args.role, "string", "role");
      helpers.checkArg(args.department, "string", "department");
      if (args.bio) {
        helpers.checkArg(args.bio, "string", "bio");
      }

      //Pull user collection
      const users = await userCollection();

      //Extra email check for duplicates
      const existingUser = await users.findOne({ email: args.email.trim() });

      if (existingUser) {
        throw new GraphQLError("Email already exists.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Create a User object, toAddUser, using the arguments, set objectId
      const toAddUser = {
        _id: new ObjectId(),
        firstName: args.firstName.trim(),
        lastName: args.lastName.trim(),
        email: args.email.trim(),
        role: args.role.trim().toUpperCase(),
        department: args.department.trim().toUpperCase(),
        bio: args.bio ? args.bio.trim() : null, //If bio exists, trim, else, null
      };

      //Use insertOne to add the user to the users' collection
      let addedUser = await users.insertOne(toAddUser);

      //If user not added scuccessfully, throw a GraphQLError
      if (!addedUser.acknowledged || !addedUser.insertedId) {
        throw new GraphQLError(
          `The user could not be added to the collection.`,
          {
            //Similar to status code 500
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          }
        );
      }

      //Redis operations
      try {
        //Add user to the redis cache
        const cacheKey = `user:${toAddUser._id}`;
        await redisClient.set(cacheKey, JSON.stringify(toAddUser));

        // Clear the 'users' in the cache bc this is no longer accurate
        await redisClient.del("users");
      } catch (error) {
        console.error("Redis operation failed:", error);

        throw new GraphQLError(
          "Failed to update Redis cache after adding the user.",
          {
            extensions: {
              code: "INTERNAL_SERVER_ERROR",
              cause: error.message,
            },
          }
        );
      }

      // PHASE 5: Removed flushAll - rely on existing targeted cache invalidation
      //Return user
      return toAddUser;
    },

    // MUTATION: editUser
    // Purpose: Edit an existing user by ID
    // Cache: Delete individual and all user caches; these will update on next fetches

    editUser: async (_, args) => {
      // Check if required field '_id' is present
      if (!args._id) {
        throw new GraphQLError("The _id field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check that no extra fields are provided
      const fieldsAllowed = [
        "_id",
        "firstName",
        "lastName",
        "email",
        "role",
        "department",
        "bio",
      ];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      // Checks
      helpers.checkArg(args._id, "string", "id");

      // Convert _id string to ObjectId
      const userId = new ObjectId(args._id);

      // Pull the user collection and find the user to update
      const users = await userCollection();
      let userToUpdate = await users.findOne({ _id: userId });

      if (!userToUpdate) {
        throw new GraphQLError("The user ID provided is invalid.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Object to hold fields to update
      const updateFields = {};

      // First Name update
      if (args.firstName) {
        helpers.checkArg(args.firstName, "string", "name");
        updateFields.firstName = args.firstName.trim();
      }

      // Last Name update
      if (args.lastName) {
        helpers.checkArg(args.lastName, "string", "name");
        updateFields.lastName = args.lastName.trim();
      }

      // Email update
      if (args.email) {
        helpers.checkArg(args.email, "string", "email");
        updateFields.email = args.email.trim();
      }

      // Role update
      if (args.role) {
        helpers.checkArg(args.role, "string", "role");
        updateFields.role = args.role.trim().toUpperCase();
      }

      // Department update
      if (args.department) {
        helpers.checkArg(args.department, "string", "department");
        updateFields.department = args.department.trim().toUpperCase();
      }

      // Bio update
      if (args.bio) {
        helpers.checkArg(args.bio, "string", "bio");
        updateFields.bio = args.bio.trim();
      }

      // Use updateOne, matching the _id to the args._id
      const result = await users.updateOne(
        { _id: userId },
        { $set: updateFields }
      );

      if (result.modifiedCount === 0) {
        throw new GraphQLError(
          `The user with ID ${args._id} was not successfully updated.`,
          { extensions: { code: "INTERNAL_SERVER_ERROR" } }
        );
      }

      //Redis operations
      try {
        // Delete the individual user cache
        await redisClient.del(`user:${args._id}`);
        await redisClient.del("users");
      } catch (error) {
        console.error("Redis operation failed:", error);
        throw new GraphQLError(
          "Failed to update Redis cache after editing the user.",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR", cause: error.message },
          }
        );
      }

      // PHASE 5: Removed flushAll - rely on existing targeted cache invalidation
      // Return updated user
      const updatedUser = { ...userToUpdate, ...updateFields };
      return updatedUser;
    },

    // MUTATION: updateMyProfile
    // Purpose: Update the current authenticated user's profile
    // Auth: Uses context.currentUser (restricted to own profile)
    // Cache: Clear user caches after update

    updateMyProfile: async (_, args, context) => {
      // Check authentication
      if (!context.currentUser || !context.currentUser._id) {
        throw new GraphQLError("You must be logged in to update your profile.", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const userId = new ObjectId(context.currentUser._id);
      const input = args.input || {};

      // Helper function to validate URLs
      const validateUrl = (url, fieldName) => {
        if (!url) return null; // Empty is okay
        const trimmed = url.trim();
        if (trimmed === "") return null; // Convert empty string to null
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
          throw new GraphQLError(
            `${fieldName} must start with http:// or https://`,
            { extensions: { code: "BAD_USER_INPUT" } }
          );
        }
        return trimmed;
      };

      // Build updateFields object with dotted paths for nested objects
      const updateFields = {};

      // Headline
      if (input.headline !== undefined) {
        const trimmed = input.headline ? input.headline.trim() : null;
        updateFields.headline = trimmed === "" ? null : trimmed;
      }

      // Location
      if (input.location !== undefined) {
        const trimmed = input.location ? input.location.trim() : null;
        updateFields.location = trimmed === "" ? null : trimmed;
      }

      // City
      if (input.city !== undefined) {
        const trimmed = input.city ? input.city.trim() : null;
        updateFields.city = trimmed === "" ? null : trimmed;
      }

      // Bio
      if (input.bio !== undefined) {
        const trimmed = input.bio ? input.bio.trim() : null;
        updateFields.bio = trimmed === "" ? null : trimmed;
      }

      // ProfileLinks - use dotted paths for partial updates
      if (input.profileLinks) {
        if (input.profileLinks.github !== undefined) {
          updateFields["profileLinks.github"] = validateUrl(
            input.profileLinks.github,
            "GitHub URL"
          );
        }
        if (input.profileLinks.linkedin !== undefined) {
          updateFields["profileLinks.linkedin"] = validateUrl(
            input.profileLinks.linkedin,
            "LinkedIn URL"
          );
        }
        if (input.profileLinks.website !== undefined) {
          updateFields["profileLinks.website"] = validateUrl(
            input.profileLinks.website,
            "Website URL"
          );
        }
      }

      // Profile Photo
      if (input.profilePhoto !== undefined) {
        updateFields.profilePhoto = validateUrl(input.profilePhoto, "Profile photo URL");
      }

      // Cover Photo
      if (input.coverPhoto !== undefined) {
        updateFields.coverPhoto = validateUrl(input.coverPhoto, "Cover photo URL");
      }

      // Featured Project ID
      if (input.featuredProjectId !== undefined) {
        const trimmed = input.featuredProjectId ? input.featuredProjectId.trim() : null;
        updateFields.featuredProjectId = trimmed === "" ? null : trimmed;
      }

      // Skills
      if (input.skills !== undefined) {
        if (!Array.isArray(input.skills)) {
          throw new GraphQLError("Skills must be an array.", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        // Sanitize: trim, remove empty strings, enforce max count and length, de-dupe
        const MAX_SKILLS = 30;
        const MAX_SKILL_LENGTH = 32;

        const sanitizedSkills = input.skills
          .map(skill => skill ? skill.trim() : '')
          .filter(skill => skill.length > 0)
          .slice(0, MAX_SKILLS)
          .map(skill => {
            if (skill.length > MAX_SKILL_LENGTH) {
              throw new GraphQLError(`Skill "${skill}" exceeds maximum length of ${MAX_SKILL_LENGTH} characters.`, {
                extensions: { code: "BAD_USER_INPUT" },
              });
            }
            return skill;
          });

        // De-duplicate case-insensitively
        const uniqueSkills = [];
        const seenLower = new Set();
        for (const skill of sanitizedSkills) {
          const lowerSkill = skill.toLowerCase();
          if (!seenLower.has(lowerSkill)) {
            seenLower.add(lowerSkill);
            uniqueSkills.push(skill);
          }
        }

        updateFields.skills = uniqueSkills;
      }

      // Education
      if (input.education !== undefined) {
        if (!Array.isArray(input.education)) {
          throw new GraphQLError("Education must be an array.", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        const MAX_EDUCATION = 10;
        if (input.education.length > MAX_EDUCATION) {
          throw new GraphQLError(`Maximum ${MAX_EDUCATION} education entries allowed.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        // Validate each education entry
        const sanitizedEducation = input.education.map(edu => {
          if (!edu.institution || !edu.institution.trim()) {
            throw new GraphQLError("Institution name is required for education entries.", {
              extensions: { code: "BAD_USER_INPUT" },
            });
          }

          return {
            institution: edu.institution.trim(),
            degree: edu.degree ? edu.degree.trim() : null,
            field: edu.field ? edu.field.trim() : null,
            startDate: edu.startDate ? edu.startDate.trim() : null,
            endDate: edu.endDate ? edu.endDate.trim() : null,
            location: edu.location ? edu.location.trim() : null,
            description: edu.description ? edu.description.trim() : null,
          };
        });

        updateFields.education = sanitizedEducation;
      }

      // Experience
      if (input.experience !== undefined) {
        if (!Array.isArray(input.experience)) {
          throw new GraphQLError("Experience must be an array.", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        const MAX_EXPERIENCE = 10;
        if (input.experience.length > MAX_EXPERIENCE) {
          throw new GraphQLError(`Maximum ${MAX_EXPERIENCE} experience entries allowed.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        // Validate each experience entry
        const sanitizedExperience = input.experience.map(exp => {
          if (!exp.title || !exp.title.trim()) {
            throw new GraphQLError("Title is required for experience entries.", {
              extensions: { code: "BAD_USER_INPUT" },
            });
          }

          return {
            title: exp.title.trim(),
            company: exp.company ? exp.company.trim() : null,
            location: exp.location ? exp.location.trim() : null,
            startDate: exp.startDate ? exp.startDate.trim() : null,
            endDate: exp.endDate ? exp.endDate.trim() : null,
            description: exp.description ? exp.description.trim() : null,
          };
        });

        updateFields.experience = sanitizedExperience;
      }

      // Ensure at least one field is being updated
      if (Object.keys(updateFields).length === 0) {
        throw new GraphQLError("No profile fields to update.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Update user in database
      const users = await userCollection();
      const result = await users.updateOne(
        { _id: userId },
        { $set: updateFields }
      );

      if (result.matchedCount === 0) {
        throw new GraphQLError("Failed to update profile. User not found.", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      // Clear targeted Redis cache keys (never flushAll)
      try {
        await redisClient.del(`user:${context.currentUser._id}`);
        await redisClient.del("users");
      } catch (error) {
        // Log but don't fail the mutation if cache clear fails
        console.error("Redis cache clear failed:", error);
      }

      // Fetch and return updated user
      const updatedUser = await users.findOne({ _id: userId });
      return updatedUser;
    },

    // MUTATION: removeUser
    // Purpose: Delete an existing user by ID; ALSO: delete thier applications, updates and comments
    // Cache: Delete individual and all user caches; these will update on next fetches

    removeUser: async (_, args) => {
      // Check if required fields are present
      if (!args._id) {
        throw new GraphQLError("The _id field is required.", {
          //Similar status code: 404
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["_id"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            //Similar status code: 404
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      //Checks
      helpers.checkArg(args._id, "string", "id");

      // Convert _id string to ObjectId
      const userId = new ObjectId(args._id);

      //Pull collections
      const users = await userCollection();
      const applications = await applicationCollection();
      const updates = await updateCollection();
      const comments = await commentCollection();

      // Find the user to delete
      const userToDelete = await users.findOne({ _id: new ObjectId(args._id) });

      if (!userToDelete) {
        throw new GraphQLError(`User with ID ${args._id} not found.`, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Collect IDs for related applications, updates, and comments
      const applicationIds = (
        await applications.find({ applicantId: args._id }).toArray()
      ).map((application) => application._id.toString());
      const updateIds = (
        await updates.find({ posterUserId: args._id }).toArray()
      ).map((update) => update._id.toString());
      const commentIds = (
        await comments.find({ commenterId: args._id }).toArray()
      ).map((comment) => comment._id.toString());

      //Use findOneAndDelete to remove user from the user collection
      const deletedUser = await users.findOneAndDelete({ _id: userId });

      //If user could not be deleted, throw GraphQLError.
      if (!deletedUser) {
        throw new GraphQLError(
          `Failed to delete user with this ID (${args._id}). Failed to either find or delete.`,
          {
            //Similar to status code 404
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      // Delete related applications, updates, and comments
      try {
        const deletedApplications = await applications.deleteMany({
          applicantId: args._id,
        });
        const deletedUpdates = await updates.deleteMany({
          posterUserId: args._id,
        });
        const deletedComments = await comments.deleteMany({
          commenterId: args._id,
        });

        console.log(
          `Deleted ${deletedApplications.deletedCount} applications, ${deletedUpdates.deletedCount} updates, and ${deletedComments.deletedCount} comments for user ${args._id}`
        );
      } catch (error) {
        console.error("Error cleaning up dependencies:", error);
        throw new GraphQLError(
          "Failed to delete related applications, updates, or comments.",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          }
        );
      }

      try {
        // Delete general caches
        await redisClient.del("users");
        await redisClient.del("applications");
        await redisClient.del("updates");
        await redisClient.del("comments");

        // Delete individual user cache
        await redisClient.del(`user:${args._id}`);

        // Delete individual application caches
        for (let applicationId of applicationIds) {
          await redisClient.del(`application:${applicationId}`);
        }

        // Delete individual update caches
        for (let updateId of updateIds) {
          await redisClient.del(`update:${updateId}`);
        }

        // Delete individual comment caches
        for (let commentId of commentIds) {
          await redisClient.del(`comment:${commentId}`);
        }

        console.log(
          "Redis caches cleared for applications, updates, and comments."
        );
        // PHASE 5: Removed flushAll - rely on existing targeted cache invalidation
      } catch (error) {
        console.error("Failed to update Redis caches:", error);
        throw new GraphQLError(
          "Failed to update Redis cache after removing the user.",
          {
            extensions: {
              code: "INTERNAL_SERVER_ERROR",
              cause: error.message,
            },
          }
        );
      }

      //Return the value of the deleted user
      return deletedUser;
    },

    // MUTATION: addProject
    // Purpose: Create a new project and add it to MongoDB
    // Cache: Add the project to the Redis cache; delete all project cache

    addProject: async (_, args, context) => {
      // Authorization check
      resolvers.requireRole(context, ['PROFESSOR', 'ADMIN']);

      // Check if required fields are present
      if (!args.title || !args.department) {
        throw new GraphQLError(
          "The title and department are required to create a project.",
          {
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      // Check for extra fields
      const fieldsAllowed = [
        "title",
        "description",
        "department",
        "professorIds",
        "studentIds",
      ];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      // Validate arguments
      helpers.checkArg(args.title, "string", "title");
      helpers.checkArg(args.department, "string", "department");
      if (args.professorIds) {
        helpers.checkArg(args.professorIds, "array", "professorIds");
        args.professorIds.forEach((id) => helpers.checkArg(id, "string", "id"));
      }
      if (args.studentIds) {
        helpers.checkArg(args.studentIds, "array", "studentIds");
        args.studentIds.forEach((id) => helpers.checkArg(id, "string", "id"));
      }

      // Prepare professor and student IDs
      const toAddProfessorIds = args.professorIds
        ? args.professorIds.map((id) => id.trim())
        : [];
      const toAddStudentIds = args.studentIds
        ? args.studentIds.map((id) => id.trim())
        : [];

      // Pull project collection
      const projects = await projectCollection();

      // Create a new project object
      const newProject = {
        _id: new ObjectId(),
        title: args.title.trim(),
        createdDate: new Date().toISOString(),
        description: args.description ? args.description.trim() : null,
        department: args.department.trim(),
        professors: toAddProfessorIds, //strings of user IDs
        students: toAddStudentIds, //strings of user IDs
      };

      // Insert the new project into the database
      const insertedProject = await projects.insertOne(newProject);

      // Confirm it was added. If it was not, throw an error.
      if (!insertedProject.acknowledged || !insertedProject.insertedId) {
        throw new GraphQLError(`Could not add project.`, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      // Update Redis cache
      try {
        // Add the project as an individual project cache
        const cacheKey = `project:${newProject._id}`;
        await redisClient.set(cacheKey, JSON.stringify(newProject));
        // Delete the projects cache, as it's no longer accurate
        await redisClient.del("projects");
        // PHASE 5: Removed flushAll - rely on existing targeted cache invalidation
      } catch (error) {
        console.error("Failed to update Redis cache:", error);
        throw new GraphQLError(
          "Failed to update Redis cache after adding the project.",
          {
            extensions: {
              code: "INTERNAL_SERVER_ERROR",
              cause: error.message,
            },
          }
        );
      }

      return newProject;
    },

    // MUTATION: editProject
    // Purpose: Edit an existing project by ID
    // Cache: Update the Redis cache accordingly

    editProject: async (_, args, context) => {
      // Authorization check
      resolvers.requireRole(context, ['PROFESSOR', 'ADMIN']);

      // Check if required fields are present
      if (!args._id) {
        throw new GraphQLError("The _id field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = [
        "_id",
        "title",
        "department",
        "description",
        "professorIds",
        "studentIds",
        "applicationIds",
      ];

      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            // Similar status code: 404
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      //Checks
      helpers.checkArg(args._id, "string", "id");
      const projectId = new ObjectId(args._id);

      //Pull projects collection
      const projects = await projectCollection();

      //Use findOne to get the project to be edited
      //Use to set values to locally before adding back to the MongoDb
      const projectToUpdate = await projects.findOne({ _id: projectId });

      if (!projectToUpdate) {
        throw new GraphQLError(`Project with ID ${args._id} does not exist.`, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      //Create object to hold fields that will be updated
      const updateFields = {};

      //Name Update
      if (args.title) {
        helpers.checkArg(args.title, "string", "title");
        updateFields.title = args.title.trim();
      }

      //Description update
      if (args.description) {
        helpers.checkArg(args.description, "string", "description");
        updateFields.description = args.description.trim();
      }

      //Location Update
      if (args.department) {
        helpers.checkArg(args.department, "string", "department");
        updateFields.department = args.department.trim().toUpperCase();
      }

      //ProfessorIds update
      if (args.professorIds) {
        helpers.checkArg(args.professorIds, "array", "professorIds");
        args.professorIds.forEach((id) => helpers.checkArg(id, "string", "id"));
        updateFields.professors = args.professorIds.map((id) => id.trim());
      }

      //StudentIds update
      if (args.studentIds) {
        helpers.checkArg(args.studentIds, "array", "studentIds");
        args.studentIds.forEach((id) => helpers.checkArg(id, "string", "id"));
        updateFields.students = args.studentIds.map((id) => id.trim());
      }

      //ApplicationIds update
      if (args.applicationIds) {
        helpers.checkArg(args.applicationIds, "array", "applicationIds");
        args.applicationIds.forEach((id) =>
          helpers.checkArg(id, "string", "id")
        );
        updateFields.applications = args.applicationIds.map((id) => id.trim());
      }

      // Update projects collection
      // Use updateOne, matching the _id to the args._id. Note: the ID cannot be updated
      // $set: updates specific fields of a document without overwriting the entire document
      const result = await projects.updateOne(
        { _id: projectId },
        { $set: updateFields }
      );

      if (result.modifiedCount === 0) {
        throw new GraphQLError(
          `The project with ID ${args._id} was not successfully updated.`,
          {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          }
        );
      }

      // Fetch the updated project data after successful update
      // Why? Easiest way to get all the correct data for the cache
      const updatedProject = await projects.findOne({
        _id: projectToUpdate._id,
      });

      if (!updatedProject) {
        throw new GraphQLError(
          "Failed to fetch updated project data after update.",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          }
        );
      }

      //Redis operations
      try {
        // Delete the projects cache as it's now out of date
        await redisClient.del("projects");
        // PHASE 5: Removed flushAll - rely on existing targeted cache invalidation
        //Update the projects's individual cache;
        await redisClient.set(
          `project:${args._id}`,
          JSON.stringify(updatedProject)
        );
      } catch (error) {
        console.error("Failed to update Redis cache:", error);
        throw new GraphQLError(
          "Failed to update Redis cache after updating the project.",
          {
            extensions: {
              code: "INTERNAL_SERVER_ERROR",
              cause: error.message,
            },
          }
        );
      }

      //Return the updated project object, which shows the new field values
      return updatedProject;
    },

    // MUTATION: updateProjectPortfolio
    // Purpose: Update project portfolio details (URLs, tech stack)
    // Auth: Only project professors/students can update
    // Cache: Clear project caches after update

    updateProjectPortfolio: async (_, args, context) => {
      // Check authentication
      if (!context.currentUser || !context.currentUser._id) {
        throw new GraphQLError("You must be logged in to update project portfolio.", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const { projectId, input } = args;

      if (!projectId) {
        throw new GraphQLError("Project ID is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const projectObjectId = new ObjectId(projectId);
      const projects = await projectCollection();

      // Get the project
      const project = await projects.findOne({ _id: projectObjectId });

      if (!project) {
        throw new GraphQLError("Project not found.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check authorization: user must be in professors or students array
      const userId = context.currentUser._id.toString();
      const isProfessor = project.professors?.some(profId => profId.toString() === userId);
      const isStudent = project.students?.some(studId => studId.toString() === userId);

      if (!isProfessor && !isStudent) {
        throw new GraphQLError("You are not authorized to update this project.", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      // Helper function to validate URLs
      const validateUrl = (url, fieldName) => {
        if (!url) return null;
        const trimmed = url.trim();
        if (trimmed === "") return null;
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
          throw new GraphQLError(
            `${fieldName} must start with http:// or https://`,
            { extensions: { code: "BAD_USER_INPUT" } }
          );
        }
        return trimmed;
      };

      // Build updateFields object
      const updateFields = {};

      if (input.githubUrl !== undefined) {
        updateFields.githubUrl = validateUrl(input.githubUrl, "GitHub URL");
      }

      if (input.liveUrl !== undefined) {
        updateFields.liveUrl = validateUrl(input.liveUrl, "Live URL");
      }

      if (input.demoVideoUrl !== undefined) {
        updateFields.demoVideoUrl = validateUrl(input.demoVideoUrl, "Demo Video URL");
      }

      if (input.techStack !== undefined) {
        // Filter out empty strings and trim
        const cleanedTechStack = input.techStack
          .map(tech => tech ? tech.trim() : "")
          .filter(tech => tech !== "");
        updateFields.techStack = cleanedTechStack.length > 0 ? cleanedTechStack : null;
      }

      // Ensure at least one field is being updated
      if (Object.keys(updateFields).length === 0) {
        throw new GraphQLError("No portfolio fields to update.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Update project in database
      const result = await projects.updateOne(
        { _id: projectObjectId },
        { $set: updateFields }
      );

      if (result.matchedCount === 0) {
        throw new GraphQLError("Failed to update project.", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      // Clear Redis cache
      try {
        await redisClient.del(`project:${projectId}`);
        await redisClient.del("projects");
      } catch (error) {
        console.error("Redis cache clear failed:", error);
      }

      // Return updated project
      return await projects.findOne({ _id: projectObjectId });
    },

    // MUTATION: removeProject
    // Purpose: Remove the project from the database; remove related applications and updates
    // Cache: Remove the project to the Redis cache; delete applications/update caches

    removeProject: async (_, args, context) => {
      // Authorization check
      resolvers.requireRole(context, ['PROFESSOR', 'ADMIN']);

      // Validate input
      if (!args._id) {
        throw new GraphQLError("The _id field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      helpers.checkArg(args._id, "string", "id");

      // Pull collections
      const projects = await projectCollection();
      const updates = await updateCollection();
      const applications = await applicationCollection();

      // Find the project to delete
      const projectToDelete = await projects.findOne({
        _id: new ObjectId(args._id),
      });

      if (!projectToDelete) {
        throw new GraphQLError(`Project with ID ${args._id} not found.`, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Collect IDs for related updates and applications
      const updateIds = (
        await updates.find({ projectId: args._id }).toArray()
      ).map((update) => update._id.toString());
      const applicationIds = (
        await applications.find({ projectId: args._id }).toArray()
      ).map((application) => application._id.toString());

      // Delete the project itself
      const deletedProject = await projects.findOneAndDelete({
        _id: new ObjectId(args._id),
      });

      if (!deletedProject) {
        throw new GraphQLError(
          `The project with ID ${args._id} was not successfully found or deleted.`,
          {
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      // Delete related updates and applications
      try {
        const deletedUpdates = await updates.deleteMany({
          projectId: args._id,
        });
        const deletedApplications = await applications.deleteMany({
          projectId: args._id,
        });

        console.log(
          `Deleted ${deletedUpdates.deletedCount} updates and ${deletedApplications.deletedCount} applications for project ${args._id}`
        );
      } catch (error) {
        console.error("Error cleaning up dependencies:", error);
        throw new GraphQLError(
          "Failed to delete related updates or applications.",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          }
        );
      }

      // Redis operations
      try {
        // Delete general caches
        await redisClient.del("projects");
        await redisClient.del("updates");
        await redisClient.del("applications");

        // Delete individual project cache
        await redisClient.del(`project:${args._id}`);

        // Delete individual update caches
        for (let updateId of updateIds) {
          await redisClient.del(`update:${updateId}`);
        }

        // Delete individual application caches
        for (let applicationId of applicationIds) {
          await redisClient.del(`application:${applicationId}`);
        }

        console.log(
          "Redis caches cleared for project, updates, and applications."
        );
        // PHASE 5: Removed flushAll - rely on existing targeted cache invalidation
      } catch (error) {
        console.error("Failed to update Redis caches:", error);
        throw new GraphQLError(
          "Failed to update Redis cache after removing the project.",
          {
            extensions: {
              code: "INTERNAL_SERVER_ERROR",
              cause: error.message,
            },
          }
        );
      }

      //Return deleted project
      return deletedProject;
    },

    // MUTATION: addUpdate
    // Purpose: Create a new update and add it to MongoDB
    // Cache: Add the update to the Redis cache; delete all updates cache

    addUpdate: async (_, args, context) => {
      // Authorization check
      resolvers.requireRole(context, ['PROFESSOR', 'ADMIN']);

      // Check if required fields are present
      if (!args.posterId || !args.subject || !args.content || !args.projectId) {
        throw new GraphQLError(
          "The posterId, subject, content, and projectId.",
          {
            //404
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      // Check for extra fields
      const fieldsAllowed = ["posterId", "subject", "content", "projectId"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            //404
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      //Checks
      helpers.checkArg(args.posterId, "string", "id");
      helpers.checkArg(args.subject, "string", "subject");
      helpers.checkArg(args.content, "string", "content");
      helpers.checkArg(args.projectId, "string", "id");

      //Pull update, project, and user collection
      const updates = await updateCollection();
      const projects = await projectCollection();
      const users = await userCollection();

      // Use findOne to get the user and the project based on the args
      // Need to ensure these exist (adding a update does not add these into their respective mongodbs)
      const user = await users.findOne({ _id: new ObjectId(args.posterId) });
      const project = await projects.findOne({
        _id: new ObjectId(args.projectId),
      });

      //If there isn't an user or a project, then throw a GraphQLError
      if (!user || !project) {
        throw new GraphQLError("The user or project ID was not valid.", {
          //Similar status code: 404
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      //Create a new update object, set the values to be those pulled from the arguments
      //Make sure to create a new ObjectId for the update, but also change the project and user id's to be object ids
      const updateToAdd = {
        _id: new ObjectId(),
        posterUserId: args.posterId.trim(),
        projectId: args.projectId.trim(),
        subject: args.subject.trim(),
        content: args.content.trim(),
        postedDate: new Date().toISOString(), // ISO format: 2024-01-01T00:00:00.000Z
      };

      //Add the update to the updates collection using insertOne
      let addedUpdate = await updates.insertOne(updateToAdd);

      //If the update was not successfully added, then throw a GraphQLError
      if (!addedUpdate.acknowledged || !addedUpdate.insertedId) {
        throw new GraphQLError(`Could not add update.`, {
          //Similar status code: 500
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      try {
        //Set update into redis Cache; set to cacheKey
        //No expiration on cache
        const cacheKey = `update:${updateToAdd._id}`;
        // Delete cache for updates, as these are no longer accurate
        await redisClient.del("updates");
        // PHASE 5: Removed flushAll - rely on existing targeted cache invalidation
        await redisClient.set(cacheKey, JSON.stringify(updateToAdd));
      } catch (error) {
        console.error("Failed to update Redis cache:", error);
        throw new GraphQLError(
          "Failed to update Redis cache after adding the update.",
          {
            extensions: {
              code: "INTERNAL_SERVER_ERROR",
              cause: error.message,
            },
          }
        );
      }

      //return the added update
      return updateToAdd;
    },

    // MUTATION: editUpdate
    // Purpose: Edit an existing update by ID
    // Cache: set individual cache and delete collective update cache; will be updated next query

    editUpdate: async (_, args, context) => {
      // Authorization check
      resolvers.requireRole(context, ['PROFESSOR', 'ADMIN']);

      // Validate required fields
      helpers.checkArg(args._id, "string", "id");

      // Validate optional fields
      if (args.posterId) helpers.checkArg(args.posterId, "string", "id");
      if (args.subject) helpers.checkArg(args.subject, "string", "subject");
      if (args.content) helpers.checkArg(args.content, "string", "content");
      if (args.projectId) helpers.checkArg(args.projectId, "string", "id");

      // Pull the updates collection
      const updates = await updateCollection();

      // Fetch the update to be edited
      let updateToUpdate = await updates.findOne({
        _id: new ObjectId(args._id),
      });
      if (!updateToUpdate) {
        throw new GraphQLError(
          `The update with ID ${args._id} could not be found.`,
          {
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      //Poster (user) id update
      if (args.posterId) {
        const users = await userCollection();
        const user = await users.findOne({ _id: new ObjectId(args.posterId) });
        if (!user) {
          throw new GraphQLError("Invalid poster ID.", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
        updateToUpdate.posterUserId = args.posterId.trim();
      }

      //Subject update
      if (args.subject) {
        helpers.checkSubject(args.subject);
        updateToUpdate.subject = args.subject.trim();
      }

      //Content update
      if (args.content) {
        updateToUpdate.content = args.content.trim();
      }

      //Project ID update
      if (args.projectId) {
        const projects = await projectCollection();
        const project = await projects.findOne({
          _id: new ObjectId(args.projectId),
        });
        if (!project) {
          throw new GraphQLError("Invalid project ID.", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
        updateToUpdate.projectId = args.projectId.trim();
      }

      // Update the update in the database
      const result = await updates.updateOne(
        { _id: new ObjectId(args._id) },
        { $set: updateToUpdate }
      );

      if (result.modifiedCount === 0) {
        throw new GraphQLError(
          `Failed to update the update with ID ${args._id}.`,
          {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          }
        );
      }

      // Update Redis cache
      try {
        await redisClient.del("updates"); // Clear updates cache
        // PHASE 5: Removed flushAll - rely on existing targeted cache invalidation
        await redisClient.set(
          `update:${args._id}`,
          JSON.stringify(updateToUpdate)
        );
      } catch (error) {
        console.error("Failed to update Redis cache:", error);
        throw new GraphQLError(
          "Failed to update Redis cache after editing the update.",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR", cause: error.message },
          }
        );
      }

      // Return the updated update
      return updateToUpdate;
    },

    // MUTATION: removeUpdate
    // Purpose: Remove a update by ID; delete related comments
    // Cache: Delete cache for individual and collective update; delete collective comment and individual comment cache

    removeUpdate: async (_, args, context) => {
      // Authorization check
      resolvers.requireRole(context, ['PROFESSOR', 'ADMIN']);

      // Check if required fields are present
      if (!args._id) {
        throw new GraphQLError("The _id field is required.", {
          //404
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["_id"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            //404
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      //Checks
      helpers.checkArg(args._id, "string", "id");

      //Pull collections
      const updates = await updateCollection();
      const comments = await commentCollection();

      // Find the update to delete
      const updateToDelete = await updates.findOne({
        _id: new ObjectId(args._id),
      });
      if (!updateToDelete) {
        throw new GraphQLError(`Update with ID ${args._id} not found.`, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Collect IDs for related comments
      const commentIds = (
        await comments.find({ destinationId: args._id }).toArray()
      ).map((comment) => comment._id.toString());

      // Use findOneAndDelete to remove the update from update collection
      const deletedUpdate = await updates.findOneAndDelete({
        _id: new ObjectId(args._id),
      });

      if (!deletedUpdate) {
        throw new GraphQLError(
          `Could not find or delete update with ID of ${args._id}`,
          {
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      // Delete related comments
      try {
        const deletedComments = await comments.deleteMany({
          destinationId: args._id,
        });
        console.log(
          `Deleted ${deletedComments.deletedCount} comments for update ${args._id}.`
        );
      } catch (error) {
        console.error("Error deleting related comments:", error);
        throw new GraphQLError("Failed to delete related comments.", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      // Update Redis cache
      try {
        // Delete the general updates cache as it's outdated
        await redisClient.del("updates");
        // Delete the individual cache for this update
        await redisClient.del(`update:${args._id}`);

        // Delete the general comments cache as it's outdated
        await redisClient.del("comments");

        // PHASE 5: Removed flushAll - rely on existing targeted cache invalidation

        // Delete individual comment caches
        for (let commentId of commentIds) {
          await redisClient.del(`comment:${commentId}`);
        }

        console.log(
          `Redis caches cleared for update ${args._id} and related comments.`
        );
      } catch (error) {
        console.error("Failed to update Redis cache:", error);
        throw new GraphQLError(
          "Failed to update Redis cache after deleting the update.",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR", cause: error.message },
          }
        );
      }

      // Return the deleted update object
      //Value because findOneAndDelete also returns metadata
      return deletedUpdate;
    },

    // MUTATION: addApplication
    // Purpose: Create a new application and add it to MongoDB
    // Cache: Add the application to the Redis cache; delete all applications cache

    addApplication: async (_, args, context) => {
      // Authorization check
      resolvers.requireAuth(context);

      // Check if applicantId matches currentUser._id (unless ADMIN)
      if (context.currentUser.role !== 'ADMIN' &&
          args.applicantId !== context.currentUser._id.toString()) {
        throw new GraphQLError('You can only create applications for yourself', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // Check if required fields are present
      if (!args.applicantId || !args.projectId) {
        throw new GraphQLError(
          "The applicantId and projectId fields are required.",
          {
            //404
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      // Check for extra fields
      const fieldsAllowed = ["applicantId", "projectId"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            //404
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      //Checks
      helpers.checkArg(args.applicantId, "string", "id");
      helpers.checkArg(args.projectId, "string", "id");

      //Pull users, projects and applications collections
      const users = await userCollection();
      const projects = await projectCollection();
      const applications = await applicationCollection();

      //Use findOne to pull the user in question, using the args.userId as the _id to match
      const matchedUser = await users.findOne({
        _id: new ObjectId(args.applicantId),
      });

      const matchedProject = await projects.findOne({
        _id: new ObjectId(args.projectId),
      });

      //If a user cannot be pulled from the collection, throw an GraphQLError
      if (!matchedUser) {
        throw new GraphQLError(
          "The applicant ID provided by the user was not valid.",
          {
            //Similar status code: 404
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      //If a project cannot be pulled from the collection, throw an GraphQLError
      if (!matchedProject) {
        throw new GraphQLError(
          "The project ID provided by the user was not valid.",
          {
            //Similar status code: 404
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      //Create a local object to hold the args values, and set the id to a new objectID
      const applicationToAdd = {
        _id: new ObjectId(),
        applicantId: args.applicantId.trim(),
        projectId: args.projectId.trim(),
        applicationDate: new Date().toISOString(),
        lastUpdatedDate: new Date().toISOString(),
        status: "PENDING",
      };

      //Use insertOne to add the local application object to the applications collection
      let addedApplication = await applications.insertOne(applicationToAdd);

      //If adding the application was not successful, then throw a GraphQLError
      if (!addedApplication.acknowledged || !addedApplication.insertedId) {
        throw new GraphQLError(
          "The application provided by the user could not be added.",
          {
            //Similar status code: 500
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          }
        );
      }

      //Redis operations
      try {
        //Add the individual application cache
        const cacheKey = `application:${applicationToAdd._id}`;
        //Delete the applications cache, as this is now out of date.'
        await redisClient.del("applications");
        // PHASE 5: Removed flushAll - rely on existing targeted cache invalidation
        await redisClient.set(cacheKey, JSON.stringify(applicationToAdd));
      } catch (error) {
        console.error("Failed to update Redis cache:", error);
        throw new GraphQLError(
          "Failed to update Redis cache after adding the application.",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR", cause: error.message },
          }
        );
      }

      //Return the local applicationToAdd object, which will be without the meta data
      return applicationToAdd;
    },

    // MUTATION: editApplication
    // Purpose: Edit an existing application by ID
    // Cache: set individual cache and delete collective application cache; will be updated next query

    editApplication: async (_, args) => {
      // Validate required fields
      helpers.checkArg(args._id, "string", "id");

      // Check if required fields are present
      if (!args._id) {
        throw new GraphQLError("The _id field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Validate allowed fields
      const fieldsAllowed = ["_id", "applicantId", "projectId", "status"];
      Object.keys(args).forEach((key) => {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      });

      // Pull applications collection
      console.log("Fetching application collection...");
      const applications = await applicationCollection();

      // Find the application
      console.log(`Looking for application with ID: ${args._id}`);
      let applicationToUpdate = await applications.findOne({
        _id: new ObjectId(args._id),
      });

      if (!applicationToUpdate) {
        throw new GraphQLError(`Application with ID ${args._id} not found.`, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      //Applicant ID Update
      if (args.applicantId) {
        helpers.checkArg(args.applicantId, "string", "id");

        const users = await userCollection();
        const applicant = await users.findOne({
          _id: new ObjectId(args.applicantId),
        });

        if (!applicant) {
          throw new GraphQLError("The provided applicantId is not valid.", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        applicationToUpdate.applicantId = args.applicantId.trim();
      }

      //Project ID Update
      if (args.projectId) {
        helpers.checkArg(args.projectId, "string", "id");
        const projects = await projectCollection();
        const project = await projects.findOne({
          _id: new ObjectId(args.projectId),
        });

        if (!project) {
          throw new GraphQLError("The provided projectId is not valid.", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        applicationToUpdate.projectId = args.projectId.trim();
      }

      // Status Update
      if (args.status) {
        helpers.checkArg(args.status, "string", "applicationStatus");
        applicationToUpdate.status = args.status.trim();
      }

      // Update the application in MongoDB
      const result = await applications.updateOne(
        { _id: new ObjectId(args._id) },
        { $set: applicationToUpdate }
      );

      if (result.modifiedCount === 0) {
        throw new GraphQLError(
          `Failed to update the application with ID ${args._id}.`,
          { extensions: { code: "INTERNAL_SERVER_ERROR" } }
        );
      }

      // Update Redis cache
      try {
        // Delete the outdated cache
        await redisClient.del("applications");
        // PHASE 5: Removed flushAll - rely on existing targeted cache invalidation

        // Set the updated application in the cache
        const cacheKey = `application:${args._id}`;
        await redisClient.set(cacheKey, JSON.stringify(applicationToUpdate));
      } catch (error) {
        console.error("Failed to update Redis cache:", error);
        throw new GraphQLError(
          "Failed to update Redis cache after editing the application.",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR", cause: error.message },
          }
        );
      }

      // Return the updated application
      return applicationToUpdate;
    },

    // MUTATION: removeApplication
    // Purpose: Remove a application by ID; delete related comments
    // Cache: Delete cache for individual and collective application; delete collective comment and individual comment cache

    removeApplication: async (_, args) => {
      // Check if required fields are present
      if (!args._id) {
        throw new GraphQLError("The _id field is required.", {
          //404
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["_id"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            //404
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      //Checks
      helpers.checkArg(args._id, "string", "id");

      //Pull the applicationCollection
      const applications = await applicationCollection();
      const comments = await commentCollection();

      // Find the application to delete
      const applicationToDelete = await applications.findOne({
        _id: new ObjectId(args._id),
      });
      if (!applicationToDelete) {
        throw new GraphQLError(`Application with ID ${args._id} not found.`, {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Collect IDs for related comments
      const commentIds = (
        await comments.find({ destinationId: args._id }).toArray()
      ).map((comment) => comment._id.toString());

      //Use findOneAndDelete to remove the applciation from the collection, based on matching the _ids (arg and application)
      const deletedApplication = await applications.findOneAndDelete({
        _id: new ObjectId(args._id),
      });

      //Confirm that the deletedApplication has a value. If not, throw a GraphQLError
      if (!deletedApplication) {
        throw new GraphQLError(
          "Could not find or delete application with the provided ID.",
          {
            //Similar status code: 404
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      // Delete related comments
      try {
        const deletedComments = await comments.deleteMany({
          destinationId: args._id,
        });
        console.log(
          `Deleted ${deletedComments.deletedCount} comments for application ${args._id}.`
        );
      } catch (error) {
        console.error("Error deleting related comments:", error);
        throw new GraphQLError("Failed to delete related comments.", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      // Redis operations
      try {
        // Delete the general applications cache as it's outdated
        await redisClient.del("applications");
        // Delete the individual cache for this application
        await redisClient.del(`application:${args._id}`);

        // Delete the general comments cache as it's outdated
        await redisClient.del("comments");
        // PHASE 5: Removed flushAll - rely on existing targeted cache invalidation

        // Delete individual comment caches
        for (let commentId of commentIds) {
          await redisClient.del(`comment:${commentId}`);
        }

        console.log(
          `Redis caches cleared for application ${args._id} and related comments.`
        );
      } catch (error) {
        console.error("Failed to update Redis cache:", error);
        throw new GraphQLError(
          "Failed to update Redis cache after deleting the application.",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR", cause: error.message },
          }
        );
      }

      //Return the value of deletedApplication
      return deletedApplication;
    },

    changeApplicationStatus: async (_, args, context) => {
      // Authorization check
      resolvers.requireRole(context, ['PROFESSOR', 'ADMIN']);

      if (!args._id || !args.status) {
        throw new GraphQLError("The _id and status fields are required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      helpers.checkArg(args._id, "string", "id");
      helpers.checkArg(args.status, "string", "status");

      const applications = await applicationCollection();
      const application = await applications.findOne({
        _id: new ObjectId(args._id),
      });
      if (!application) {
        throw new GraphQLError(`Application with ID ${args._id} not found.`, {
          extensions: { code: "NOT_FOUND" },
        });
      }
      application.status = args.status.trim();

      const projects = await projectCollection();
      const project = await projects.findOne({
        _id: new ObjectId(application.projectId),
      });

      if (args.status === "APPROVED") {
        project.students.push(application.applicantId);
        const updatedProject = await projects.updateOne(
          { _id: new ObjectId(application.projectId) },
          { $set: project }
        );

        if (updatedProject.modifiedCount === 0) {
          throw new GraphQLError(
            `Failed to update the project with ID ${application.projectId}.`,
            { extensions: { code: "INTERNAL_SERVER_ERROR" } }
          );
        }
      }

      const result = await applications.findOneAndUpdate(
        { _id: new ObjectId(args._id) },
        { $set: application },
        { returnDocument: "after" }
      );

      // PHASE 5: Removed flushAll - rely on existing targeted cache invalidation

      return result;
    },

    // MUTATION: addComment
    // Purpose: Create a new commnet and add it to MongoDB
    // Cache: Add the comment to the Redis cache; delete all comments cache

    addComment: async (_, args, context) => {
      // Authorization check
      resolvers.requireAuth(context);

      // Check if commenterId matches currentUser._id (unless ADMIN)
      if (context.currentUser.role !== 'ADMIN' &&
          args.commenterId !== context.currentUser._id.toString()) {
        throw new GraphQLError('You can only create comments as yourself', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // Check if required fields are present
      if (!args.commenterId || !args.destinationId || !args.content) {
        throw new GraphQLError(
          "All fields (commenterId, destinationId, content) are required.",
          {
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      // Validate arguments
      helpers.checkArg(args.commenterId, "string", "id");
      helpers.checkArg(args.destinationId, "string", "id");
      helpers.checkArg(args.content, "string", "content");

      // Pull commenter details
      const users = await userCollection();
      const commenter = await users.findOne({
        _id: new ObjectId(args.commenterId),
      });

      if (!commenter) {
        console.error(`No user found with commenterId: ${args.commenterId}`);
        throw new GraphQLError(
          `The commenter with ID ${args.commenterId} does not exist.`,
          {
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      // Check destinationId exists in either updates or applications
      const updates = await updateCollection();
      const applications = await applicationCollection();

      const fetchedUpdate = await updates.findOne({
        _id: new ObjectId(args.destinationId),
      });
      const fetchedApplication = await applications.findOne({
        _id: new ObjectId(args.destinationId),
      });

      if (!fetchedUpdate && !fetchedApplication) {
        console.error(
          `No valid destination found for destinationId: ${args.destinationId}`
        );
        throw new GraphQLError(
          `The destination ID ${args.destinationId} does not exist.`,
          {
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      // Create the comment object
      const newComment = {
        _id: new ObjectId(),
        commenterId: args.commenterId.trim(),
        content: args.content.trim(),
        postedDate: new Date().toISOString(),
        destinationId: args.destinationId.trim(),
      };

      // Insert the comment into the comments collection
      const comments = await commentCollection();
      const insertedComment = await comments.insertOne(newComment);

      if (!insertedComment) {
        throw new GraphQLError("Failed to add the comment.", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      // Update Redis cache
      try {
        console.log("Updating Redis cache for comment...");
        const cacheKey = `comment:${newComment._id}`;
        await redisClient.del("comments");
        // PHASE 5: Removed flushAll - rely on existing targeted cache invalidation
        await redisClient.set(cacheKey, JSON.stringify(newComment));

        console.log("Redis cache updated successfully.");
      } catch (redisError) {
        console.error("Failed to update Redis cache:", redisError);
        throw new GraphQLError(
          "Failed to update Redis cache after adding the comment.",
          {
            extensions: {
              code: "INTERNAL_SERVER_ERROR",
              cause: redisError.message,
            },
          }
        );
      }

      // Return the added comment
      return newComment;
    },

    // MUTATION: editComment
    // Purpose: Edit an existing comment by ID
    // Cache: set individual cache and delete collective comment cache; will be updated next query

    editComment: async (_, args, context) => {
      // Authorization check
      resolvers.requireAuth(context);

      // Check if required fields are present
      if (!args._id) {
        throw new GraphQLError("The _id field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Validate allowed fields
      const fieldsAllowed = ["_id", "content", "commenterId"];
      Object.keys(args).forEach((key) => {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      });

      // Validate arguments
      helpers.checkArg(args._id, "string", "id");
      if (args.content) {
        helpers.checkArg(args.content, "string", "content");
      }
      if (args.commenterId) {
        helpers.checkArg(args.commenterId, "string", "id");
      }

      // Pull the comments collection
      const comments = await commentCollection();

      // Find the comment by ID
      const commentToUpdate = await comments.findOne({
        _id: new ObjectId(args._id),
      });

      if (!commentToUpdate) {
        throw new GraphQLError(
          `The comment with ID ${args._id} does not exist.`,
          {
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      // Check if commenterId matches currentUser._id (unless ADMIN)
      if (context.currentUser.role !== 'ADMIN' &&
          commentToUpdate.commenterId.toString() !== context.currentUser._id.toString()) {
        throw new GraphQLError('You can only edit your own comments', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // Object to hold fields to update
      const updateFields = {};

      // Content Update
      if (args.content) {
        updateFields.content = args.content.trim();
      }

      // CommenterId Update
      if (args.commenterId) {
        const users = await userCollection();
        const commenter = await users.findOne({
          _id: new ObjectId(args.commenterId),
        });

        if (!commenter) {
          throw new GraphQLError(
            `User with ID ${args.commenterId} does not exist.`,
            {
              extensions: { code: "BAD_USER_INPUT" },
            }
          );
        }

        updateFields.commenterId = args.commenterId.trim();
      }

      // Update the comment in the database
      const result = await comments.updateOne(
        { _id: commentToUpdate._id },
        { $set: updateFields }
      );

      if (result.modifiedCount === 0) {
        throw new GraphQLError(
          `Failed to update the comment with ID ${args._id}.`,
          {
            extensions: { code: "INTERNAL_SERVER_ERROR" },
          }
        );
      }

      // Merge updates with the original comment
      const updatedComment = { ...commentToUpdate, ...updateFields };

      // Update Redis cache
      try {
        await redisClient.del("comments");
        // PHASE 5: Removed flushAll - rely on existing targeted cache invalidation
        const cacheKey = `comment:${commentToUpdate._id}`;
        await redisClient.set(cacheKey, JSON.stringify(updatedComment));
      } catch (error) {
        console.error("Failed to update Redis cache:", error);
        throw new GraphQLError(
          "Failed to update Redis cache after editing the comment.",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR", cause: error.message },
          }
        );
      }

      console.log("Comment successfully updated:", updatedComment);

      // Return the updated comment
      return updatedComment;
    },

    // MUTATION: removeComment
    // Purpose: Remove a comment by ID
    // Cache: Delete cache for individual and collective application; delete collective comment and individual comment cache

    removeComment: async (_, args, context) => {
      // Authorization check
      resolvers.requireAuth(context);

      // Check if required fields are present
      if (!args._id) {
        throw new GraphQLError("The _id field is required.", {
          //404
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Check for extra fields
      const fieldsAllowed = ["_id"];
      for (let key in args) {
        if (!fieldsAllowed.includes(key)) {
          throw new GraphQLError(`Unexpected field '${key}' provided.`, {
            //404
            extensions: { code: "BAD_USER_INPUT" },
          });
        }
      }

      //Checks
      helpers.checkArg(args._id, "string", "id");

      //Pull the commentCollection
      const comments = await commentCollection();

      //First, find the comment to check ownership
      const commentToDelete = await comments.findOne({
        _id: new ObjectId(args._id),
      });

      if (!commentToDelete) {
        throw new GraphQLError(
          "Could not find comment with the provided ID.",
          {
            //Similar status code: 404
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      // Check if commenterId matches currentUser._id (unless ADMIN)
      if (context.currentUser.role !== 'ADMIN' &&
          commentToDelete.commenterId.toString() !== context.currentUser._id.toString()) {
        throw new GraphQLError('You can only delete your own comments', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      //Use findOneAndDelete to remove the comment from the collection, based on matching the _ids (arg and comment)
      const deletedComment = await comments.findOneAndDelete({
        _id: new ObjectId(args._id),
      });

      //Confirm deletedComment the deletedComment has a value. If not, throw a GraphQLError
      if (!deletedComment) {
        throw new GraphQLError(
          "Could not delete comment with the provided ID.",
          {
            //Similar status code: 404
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      //Propagate this removal across all objects with user objects
      //await propagators.propagateCommentRemovalChanges(args._id);

      try {
        await redisClient.del(`comment:${args._id}`);
        await redisClient.del("comments");
        // PHASE 5: Removed flushAll - rely on existing targeted cache invalidation
      } catch (error) {
        console.error("Failed to update Redis cache:", error);
        throw new GraphQLError(
          "Failed to update Redis cache after removing the comment.",
          {
            extensions: { code: "INTERNAL_SERVER_ERROR", cause: error.message },
          }
        );
      }

      //Return the value of deletedComment
      return deletedComment;
    },

    //LOGIN
    login: async (_, args, context) => {
      // Token is already verified in context (app.js)
      // Just return the current user if authenticated
      if (!context.currentUser) {
        throw new GraphQLError('Authentication failed', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      return {
        message: "Login successful",
        _id: context.currentUser._id,
        name: `${context.currentUser.firstName} ${context.currentUser.lastName}`,
        email: context.currentUser.email,
        role: context.currentUser.role
      };
    },

    //HOME FEED V2 MUTATIONS

    //MUTATION: createPost
    //Purpose: Create a new post with optional media
    //Cache: Invalidate feed cache
    //Auth: All authenticated users can post
    createPost: async (_, args, context) => {
      requireAuth(context);

      if (!args.text || !args.text.trim()) {
        throw new GraphQLError("Post text is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const posts = await postCollection();
      const now = new Date().toISOString();

      const newPost = {
        userId: context.currentUser._id.toString(),
        text: args.text.trim(),
        media: args.media || [],
        createdAt: now,
        updatedAt: now,
        likeCount: 0,
        commentCount: 0,
      };

      const result = await posts.insertOne(newPost);

      if (!result.acknowledged) {
        throw new GraphQLError("Failed to create post.", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      // Invalidate feed cache (optional)
      try {
        await redisClient.del("feed:*");
        console.log("Feed cache invalidated after post creation.");
      } catch (error) {
        console.error("Failed to invalidate feed cache:", error);
      }

      // Return the newly created post with _id
      return {
        _id: result.insertedId.toString(),
        ...newPost,
      };
    },

    //MUTATION: toggleLike
    //Purpose: Like or unlike a post (toggle)
    //Cache: Update post cache
    //Auth: All authenticated users
    toggleLike: async (_, args, context) => {
      requireAuth(context);

      if (!args.postId) {
        throw new GraphQLError("The postId field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      helpers.checkArg(args.postId, "string", "id");

      const posts = await postCollection();
      const likes = await postLikesCollection();
      const userId = context.currentUser._id.toString();
      const postId = args.postId;

      // Check if post exists
      const post = await posts.findOne({ _id: new ObjectId(postId) });
      if (!post) {
        throw new GraphQLError("Post not found.", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      // Check if user has already liked this post
      const existingLike = await likes.findOne({ postId, userId });

      if (existingLike) {
        // Unlike: Remove the like
        await likes.deleteOne({ postId, userId });
        await posts.updateOne(
          { _id: new ObjectId(postId) },
          { $inc: { likeCount: -1 }, $set: { updatedAt: new Date().toISOString() } }
        );
      } else {
        // Like: Add the like
        await likes.insertOne({
          postId,
          userId,
          createdAt: new Date().toISOString(),
        });
        await posts.updateOne(
          { _id: new ObjectId(postId) },
          { $inc: { likeCount: 1 }, $set: { updatedAt: new Date().toISOString() } }
        );
      }

      // Fetch updated post
      const updatedPost = await posts.findOne({ _id: new ObjectId(postId) });

      return updatedPost;
    },

    //MUTATION: addPostComment
    //Purpose: Add a comment to a post
    //Cache: Invalidate comments cache for this post
    //Auth: All authenticated users
    addPostComment: async (_, args, context) => {
      requireAuth(context);

      if (!args.postId) {
        throw new GraphQLError("The postId field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      if (!args.text || !args.text.trim()) {
        throw new GraphQLError("Comment text is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      helpers.checkArg(args.postId, "string", "id");

      const posts = await postCollection();
      const comments = await postCommentsCollection();

      // Check if post exists
      const post = await posts.findOne({ _id: new ObjectId(args.postId) });
      if (!post) {
        throw new GraphQLError("Post not found.", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const now = new Date().toISOString();
      const newComment = {
        postId: args.postId,
        userId: context.currentUser._id.toString(),
        text: args.text.trim(),
        createdAt: now,
        updatedAt: now,
      };

      const result = await comments.insertOne(newComment);

      if (!result.acknowledged) {
        throw new GraphQLError("Failed to add comment.", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      // Increment comment count on post
      await posts.updateOne(
        { _id: new ObjectId(args.postId) },
        { $inc: { commentCount: 1 }, $set: { updatedAt: now } }
      );

      // Invalidate comments cache (optional)
      try {
        await redisClient.del(`comments:${args.postId}`);
        console.log(`Comments cache invalidated for post ${args.postId}.`);
      } catch (error) {
        console.error("Failed to invalidate comments cache:", error);
      }

      // Return the newly created comment with _id
      return {
        _id: result.insertedId.toString(),
        ...newComment,
      };
    },

    deletePost: async (_, args, context) => {
      requireAuth(context);

      if (!args.postId) {
        throw new GraphQLError("The postId field is required.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      helpers.checkArg(args.postId, "string", "id");

      const posts = await postCollection();
      const comments = await postCommentsCollection();
      const likes = await postLikesCollection();

      // Check if post exists
      const post = await posts.findOne({ _id: new ObjectId(args.postId) });
      if (!post) {
        throw new GraphQLError("Post not found.", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      // Check if current user is the post author
      if (post.userId !== context.currentUser._id.toString()) {
        throw new GraphQLError("You can only delete your own posts.", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      // Delete the post
      const deleteResult = await posts.deleteOne({ _id: new ObjectId(args.postId) });

      if (!deleteResult.deletedCount) {
        throw new GraphQLError("Failed to delete post.", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }

      // Delete all comments for this post
      await comments.deleteMany({ postId: args.postId });

      // Delete all likes for this post
      await likes.deleteMany({ postId: args.postId });

      // Invalidate feed cache
      try {
        await redisClient.del("feed:all");
        console.log(`Feed cache invalidated after deleting post ${args.postId}.`);
      } catch (error) {
        console.error("Failed to invalidate feed cache:", error);
      }

      // Invalidate comments cache for this post
      try {
        await redisClient.del(`comments:${args.postId}`);
      } catch (error) {
        console.error("Failed to invalidate comments cache:", error);
      }

      return true;
    },

    //DIRECT MESSAGING MUTATIONS

    //MUTATION: sendDirectMessage(recipientId: String!, text: String!): DirectMessage!
    //Purpose: Send a direct message to another user
    //Auth: All authenticated users
    //Creates conversation if it doesn't exist
    sendDirectMessage: async (_, args, context) => {
      requireAuth(context);

      if (!args.recipientId || !args.text?.trim()) {
        throw new GraphQLError('recipientId and text are required', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      helpers.checkArg(args.recipientId, 'string', 'id');
      helpers.checkArg(args.text, 'string', 'content');

      const currentUserId = context.currentUser._id.toString();

      // Can't message yourself
      if (currentUserId === args.recipientId) {
        throw new GraphQLError('Cannot send message to yourself', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      // Verify recipient exists
      const users = await userCollection();
      const recipient = await users.findOne({ _id: new ObjectId(args.recipientId) });

      if (!recipient) {
        throw new GraphQLError('Recipient not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // Get or create conversation
      const participants = [currentUserId, args.recipientId].sort();
      const conversations = await conversationsCollection();

      let conversation = await conversations.findOne({ participants });

      if (!conversation) {
        // Create new conversation
        const now = new Date().toISOString();
        const newConversation = {
          participants,
          participantObjects: [
            { userId: currentUserId, unreadCount: 0, lastReadAt: now },
            { userId: args.recipientId, unreadCount: 0, lastReadAt: now }
          ],
          lastMessage: null,
          createdAt: now,
          updatedAt: now
        };

        const result = await conversations.insertOne(newConversation);
        conversation = { _id: result.insertedId, ...newConversation };
      }

      const conversationId = conversation._id.toString();

      // Create message
      const now = new Date().toISOString();
      const messages = await directMessagesCollection();

      const newMessage = {
        conversationId,
        senderId: currentUserId,
        text: args.text.trim(),
        readBy: [currentUserId], // Sender has read their own message
        createdAt: now,
        updatedAt: now
      };

      const messageResult = await messages.insertOne(newMessage);
      newMessage._id = messageResult.insertedId.toString();

      // Update conversation: lastMessage, increment recipient's unreadCount, updatedAt
      await conversations.updateOne(
        { _id: conversation._id },
        {
          $set: {
            lastMessage: {
              text: args.text.trim(),
              senderId: currentUserId,
              timestamp: now
            },
            updatedAt: now
          },
          $inc: {
            'participantObjects.$[recipient].unreadCount': 1
          }
        },
        {
          arrayFilters: [{ 'recipient.userId': args.recipientId }]
        }
      );

      // Cache invalidation
      try {
        await redisClient.del(`conversations:${currentUserId}`);
        await redisClient.del(`conversations:${args.recipientId}`);
        await redisClient.del(`conversation:${conversationId}`);
        console.log(`Conversation caches invalidated after sending message.`);
      } catch (error) {
        console.error('Failed to invalidate conversation caches:', error);
      }

      // Socket.IO broadcast
      try {
        const roomName = `conversation:${conversationId}`;
        const socketsInRoom = await io.in(roomName).fetchSockets();
        console.log(`[DM] Emitting message to room ${roomName}, sockets in room: ${socketsInRoom.length}`);
        socketsInRoom.forEach(s => {
          console.log(`[DM]   - Socket ${s.id} in room`);
        });

        // Populate sender object for real-time message
        const messageWithSender = {
          ...newMessage,
          sender: {
            _id: context.currentUser._id.toString(),
            firstName: context.currentUser.firstName,
            lastName: context.currentUser.lastName,
            email: context.currentUser.email,
            profilePhoto: context.currentUser.profilePhoto || null
          }
        };

        // Emit to conversation room (for active conversation view)
        io.to(roomName).emit('new_direct_message', {
          message: messageWithSender,
          conversationId
        });

        // Emit to recipient's DM room (for inbox updates)
        io.to(`dm:${args.recipientId}`).emit('conversation_updated', {
          conversationId,
          lastMessage: {
            text: args.text.trim(),
            senderId: currentUserId,
            timestamp: now
          }
        });

        console.log(`[DM] Real-time events sent for message in conversation ${conversationId}`);
      } catch (error) {
        console.error('Failed to send Socket.IO events:', error);
        // Don't fail the mutation if Socket.IO fails
      }

      return newMessage;
    },

    //MUTATION: markConversationAsRead(conversationId: String!): Conversation!
    //Purpose: Mark all messages in a conversation as read by current user
    //Auth: Only conversation participants
    markConversationAsRead: async (_, args, context) => {
      requireAuth(context);

      if (!args.conversationId) {
        throw new GraphQLError('conversationId is required', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      helpers.checkArg(args.conversationId, 'string', 'id');

      const currentUserId = context.currentUser._id.toString();
      const conversations = await conversationsCollection();

      // Verify conversation exists and user is participant
      const conversation = await conversations.findOne({
        _id: new ObjectId(args.conversationId),
        participants: currentUserId
      });

      if (!conversation) {
        throw new GraphQLError('Conversation not found or access denied', {
          extensions: { code: 'FORBIDDEN' }
        });
      }

      // Mark all messages as read by current user
      const messages = await directMessagesCollection();
      await messages.updateMany(
        {
          conversationId: args.conversationId,
          readBy: { $ne: currentUserId }
        },
        {
          $addToSet: { readBy: currentUserId }
        }
      );

      // Reset unread count for current user
      const now = new Date().toISOString();
      await conversations.updateOne(
        { _id: new ObjectId(args.conversationId) },
        {
          $set: {
            'participantObjects.$[user].unreadCount': 0,
            'participantObjects.$[user].lastReadAt': now
          }
        },
        {
          arrayFilters: [{ 'user.userId': currentUserId }]
        }
      );

      // Invalidate cache
      try {
        await redisClient.del(`conversations:${currentUserId}`);
        await redisClient.del(`conversation:${args.conversationId}`);
        console.log(`Conversation caches invalidated after marking as read.`);
      } catch (error) {
        console.error('Failed to invalidate conversation caches:', error);
      }

      // Emit read receipt to conversation participants
      try {
        const roomName = `conversation:${args.conversationId}`;
        io.to(roomName).emit('message_read', {
          conversationId: args.conversationId,
          userId: currentUserId,
          readAt: now
        });

        // Also notify sender's other devices
        io.to(`dm:${currentUserId}`).emit('conversation_read', {
          conversationId: args.conversationId,
          readAt: now
        });

        console.log(`[READ RECEIPT] User ${currentUserId} marked conversation ${args.conversationId} as read`);
      } catch (error) {
        console.error('[READ RECEIPT] Failed to emit Socket.IO event:', error);
      }

      // Return updated conversation
      return await conversations.findOne({ _id: new ObjectId(args.conversationId) });
    },
  },
};

export default resolvers;
