//TYPEDEFS.JS
//Purpose: Create the type definitions for the query and our data
//Why: Specifies the structure of the data that can be queried or mutated

//EXPORT typeDefs CONSTANT
//TYPE: string
//#graphql: Helps indicate string represents GraphQL schema language (useful for editor appearance preferences)
export const typeDefs = `#graphql

#TYPE: Query
#Purpose: Defines the types of queries users can use to retrieve data

    type Query {
    
        #FETCH ALL
        
            # users: [User]
            # Purpose: Returns an array of all users.
            # Caching: one-hour expiration; completed in resolvers.js.
                
                users: [User]
            
            # projects: [Project]
            # Purpose: Returns an array of all projects.
            # Caching: one-hour expiration; completed in resolvers.js.
            
                projects: [Project]

            # updates: [Update]
            # Purpose: Returns an array of all updates.
            # Caching: one-hour expiration; completed in resolvers.js.
            
                updates: [Update] 
                
            # applications: [Application]
            # Purpose: Returns an array of all applications.
            # Caching: one-hour expiration; completed in resolvers.js.
            
                applications: [Application]

            # comments: [Comment]
            # Purpose: Returns an array of all comments.
            # Caching: one-hour expiration; completed in resolvers.js.
            
                comments: [Comment] 


        #GETBYID
        
            # getUserById(_id: String!): User
            # Purpose: Retrieves a single user by ID.
            # Caching: No expiration time; completed in resolvers.js.
            
                getUserById(_id: String!): User
            
            # getProjectById(_id: String!): Project
            # Purpose: Retrieves a single project by ID.
            # Caching: No expiration time; completed in resolvers.js.
            
                getProjectById(_id: String!): Project

            # getUpdateById(_id: String!): Update
            # Purpose: Retrieves a single update by ID.
            # Caching: No expiration time; completed in resolvers.js.

                getUpdateById(_id: String!): Update

            # getUpdatesByProjectId(projectId: String!, limit: Int): [Update]
            # Purpose: Get recent updates for a specific project (simple last-N pagination)
            # Auth: Public (anyone can view project updates)
            # Caching: 10 min TTL

                getUpdatesByProjectId(projectId: String!, limit: Int = 10): [Update]

            # getApplicationById(_id: String!): Application
            # Purpose: Retrieves a single application by ID.
            # Caching: No expiration time; completed in resolvers.js.
            
                getApplicationById(_id: String!): Application

            # getCommentById(_id: String!): Comment
            # Purpose: Retrieves a single comment by ID.
            # Caching: No expiration time; completed in resolvers.js.
            
                getCommentById(_id: String!): Comment

        #ADDITIONAL SEARCH FUNCTIONALITY
        
            # getProfessorsByProjectId(projectId: String!): [User]
            # Purpose: Retrieves a list of professors names for a given project by ID.
            # Caching: One-hour expiration; completed in resolvers.js.
            
                getProfessorsByProjectId(projectId: String!): [User]

            # getStudentsByProjectId(projectId: String!): [User]
            # Purpose: Retrieves a list of students names for a given project by ID.
            # Caching: One-hour expiration; completed in resolvers.js.
            
                getStudentsByProjectId(projectId: String!): [User]

            # getCommentsByUpdateId(updateId: String!): [Comment]
            # Purpose: Retrieves a list of comments for a given update by ID.
            # Caching: One-hour expiration; completed in resolvers.js.
            
                getCommentsByUpdateId(updateId: String!): [Comment]

            # getCommentsByApplicationId(applicationId: String!): [Comment]
            # Purpose: Retrieves a list of comments for a given update by ID.
            # Caching: One-hour expiration; completed in resolvers.js.
            
                getCommentsByApplicationId(applicationId: String!): [Comment]
        
            # projectsByDepartment(department: Department!): [Project]
            # Purpose: Returns an array of projects that match the specified department.
            # Caching: One-hour expiration; completed in resolvers.js.
            
                projectsByDepartment(department: Department!): [Project]
            
            # updatesBySubject(subject: UpdateSubject!): [Update]
            # Purpose: Returns an array of updates that match the specified subject.
            # Caching: One-hour expiration; completed in resolvers.js.
            
                updatesBySubject(subject: UpdateSubject!): [Update]

            # projectsByCreatedYear(min: Int!, max: Int!): [Project]
            # Purpose: Returns an array of projects established within the specified year range (inclusive).
            # Caching: One-hour expiration; completed in resolvers.js.
            # Constraints: min > 0, max >= min, max cannot be more than the current year.
            
                projectsByCreatedYear(min: Int!, max: Int!): [Project]
            
            #searchProjectByTitle(searchTerm: String!): [Project]
            # Purpose: Returns an array of projects whose titles contain the specified search term (case-insensitive).
            # Caching: One-hour expiration; completed in resolvers.js.

                searchProjectByTitle(searchTerm: String!): [Project]

            # projectsFeed(input: ProjectsFeedInput!): ProjectsFeedResult!
            # Purpose: Returns paginated projects feed with filtering and cursor pagination
            # Caching: 600s (10 min) with hash-based key
            # Replaces: projects, projectsByDepartment, projectsByCreatedYear, searchProjectByTitle (legacy queries deprecated)

                projectsFeed(input: ProjectsFeedInput!): ProjectsFeedResult!

            # appliedProjectsFeed(input: AppliedProjectsFeedInput!): AppliedProjectsFeedResult!
            # Purpose: Returns projects user has applied to with application status
            # Auth: Requires authentication (current user only)
            # Caching: 300s (5 min) with hash-based key (shorter TTL due to status changes)

                appliedProjectsFeed(input: AppliedProjectsFeedInput!): AppliedProjectsFeedResult!


            # Purpose: Returns an array of users whose names contain the specified search term (case-insensitive).
            # Caching: One-hour expiration; completed in resolvers.js.
            
                searchUserByName(searchTerm: String!): [User]

            # Purpose: Returns an array of projects that had the usersIds stored in the professor or student arrays
            # Caching: One-hour expiration; completed in resolvers.js.
                getProjectsByUserId (_id: String!): [Project]

            # me: User
            # Purpose: Returns the currently authenticated user from context
            # No caching (user-specific data)
                me: User

        #HOME FEED V2 QUERIES

            # feed(cursor: FeedCursorInput): FeedPage!
            # Purpose: Returns paginated feed of posts (newest first)
            # Caching: Optional (invalidate on post creation)

                feed(cursor: FeedCursorInput): FeedPage!

            # postComments(postId: String!, cursor: CommentsCursorInput): CommentsPage!
            # Purpose: Returns paginated comments for a specific post
            # Caching: Optional (invalidate on comment creation)

                postComments(postId: String!, cursor: CommentsCursorInput): CommentsPage!

        #DIRECT MESSAGING QUERIES

            # conversations(cursor: ConversationsCursorInput): ConversationsPage!
            # Purpose: Returns paginated list of conversations for current user (newest first)
            # Auth: Authenticated users only
            # Caching: Optional (invalidate on new message)

                conversations(cursor: ConversationsCursorInput): ConversationsPage!

            # conversationMessages(conversationId: String!, cursor: MessagesCursorInput): MessagesPage!
            # Purpose: Returns paginated messages for a specific conversation
            # Auth: Only conversation participants can access
            # Caching: Optional (invalidate on new message in conversation)

                conversationMessages(
                    conversationId: String!
                    cursor: MessagesCursorInput
                ): MessagesPage!

            # getOrCreateConversation(recipientId: String!): Conversation!
            # Purpose: Get existing conversation with recipient, or create if doesn't exist
            # Auth: Authenticated users only
            # Caching: No cache (mutation-like behavior)

                getOrCreateConversation(recipientId: String!): Conversation!

    }

#TYPE DEFINITIONS

    # User Type: Definition
        
        type User {
            _id: String!                    # ObjectId, required
            clerkId: String!                # Clerk user ID, required, unique
            firstName: String!              # required
            lastName: String!               # required
            email: String!                  # Required and should be unique
            role: Role!                     # required (enum)
            department: Department!         # required (enum)
            bio: String                     # not required
            headline: String                # not required, e.g. "Computer Science Student"
            location: String                # not required, e.g. "Hoboken, NJ"
            city: String                    # not required, e.g. "Hoboken"
            profileLinks: ProfileLinks      # not required, social/external links
            profilePhoto: String            # not required, URL to profile photo
            coverPhoto: String              # not required, URL to cover/banner photo
            featuredProjectId: String       # not required, ID of featured project
            skills: [String]                # not required, array of skill names
            education: [Education]          # not required, educational background
            experience: [Experience]        # not required, work/research experience
            applications: [Application]     # Computed Value, Array of application objects
            projects: [Project]             # Computed value, arraay of project objects
            numOfApplications: Int!         # Computed value, number of applications completed
            numOfProjects: Int!             # Computed value, number of projects involved in
        }

    # ProfileLinks Type: Social and external profile links
        type ProfileLinks {
            github: String
            linkedin: String
            website: String
        }

    # Education Type: Educational background
        type Education {
            institution: String!
            degree: String
            field: String
            startDate: String
            endDate: String
            location: String
            description: String
        }

    # Experience Type: Work/research experience
        type Experience {
            title: String!
            company: String
            location: String
            startDate: String
            endDate: String
            description: String
        }

    # Project Type: Definition

        type Project {
            _id: String!                    # ObjectId, required
            title: String!                  # required
            description: String             # not required
            createdDate: String!            # ISO format, required
            department: Department!         # required (enum)
            professors: [User]             # array of user objects where Role = professor, required
            students: [User]                # array of user objects where Role = student, not required
            applications: [Application]     # array of Applicaiton objects
            numOfApplications: Int!         # Computed value, number of applications for this project
            updates: [Update]               # Computed value,
            numOfUpdates: Int!              # Computed value, the number of updates delivered about this project
            githubUrl: String               # Portfolio: GitHub repository URL
            liveUrl: String                 # Portfolio: Live demo URL
            demoVideoUrl: String            # Portfolio: Demo video URL
            techStack: [String]             # Portfolio: Array of technologies used
        }

    # Update Type: Definition (A conglomeration of updates builds newsfeeds)
   
        type Update {
            _id: String!                    # ObjectId, required
            posterUser: User!               # Computed value, shows user object who created update
            subject: UpdateSubject!         # Enum defining the type of update, required
            content: String!                # Additional details related to project update
            project: Project!               # Computed value, shows the associated project object, required
            postedDate: String!             # ISO format, required
            comments: [Comment]             # Computed Value, shows the Array of commment objects added to update, not required
            numOfComments: Int!             # Computed value, shows the number of comments under this update
        }

    # Application Type: Definition

        type Application {
            _id: String!                    # ObjectId, required
            applicant: User!                # Computed Value, shows user object who applied to project, required
            project: Project!               # Computed Value, shows associated project object, required
            applicationDate: String!        # ISO format required
            lastUpdatedDate: String!        # ISO format required, shows when last modified
            status: ApplicationStatus!      # Enum defining where the application stands, required
            comments: [Comment]             # Computed Value, shows array of commments added to application, not required
            numOfComments: Int!             # Computed value, the number of comments under this application
        }

    # Comment Type: Definition

        type Comment {
            _id: String!                    # ObjectId, required
            commenter: User!                # Computed Value, shows the ser object who made the comment, required
            content: String!                # text content of the comment, required
            postedDate: String!             # ISO format, required
            destinationId: String!          # Reference ID for the update or application where the comment is stored
        }

    # LoginResponse Type: Definition

        type LoginResponse {
            message: String!
            _id: String
            name: String
            email: String
            role: String
        }


#ENUM DEFINITIONS

    # Role

        enum Role {
            STUDENT
            PROFESSOR
            ADMIN
        }  
            
    # Department (Only for the engineering school; possible to build out for later iterations of project)

        enum Department {
            BIOMEDICAL_ENGINEERING
            CHEMICAL_ENGINEERING_AND_MATERIALS_SCIENCE
            CHEMISTRY_AND_CHEMICAL_BIOLOGY
            CIVIL_ENVIRONMENTAL_AND_OCEAN_ENGINEERING
            COMPUTER_SCIENCE
            ELECTRICAL_AND_COMPUTER_ENGINEERING
            MATHEMATICAL_SCIENCES
            MECHANICAL_ENGINEERING
            PHYSICS
            SYSTEMS_AND_ENTERPRISES
        }

    # UpdateSubject

        enum UpdateSubject {
            CALL_FOR_APPLICANTS     # Recruiting collaborators or team members
            TEAM_UPDATE             # Changes in team members or roles
            PROJECT_LAUNCH          # Announcing project initiation
            MILESTONE_REACHED       # Achievements or significant progress
            PROGRESS_REPORT         # Regular updates on project status
            DEADLINE_UPDATE         # Upcoming or changed deadlines
            REQUEST_FOR_FEEDBACK    # Seeking input or suggestions
            FUNDING_UPDATE          # Updates on grants or budget status
            EVENT_ANNOUNCEMENT      # Workshops, seminars, or related events
            ISSUE_REPORTED          # Challenges, delays, or technical issues
            PUBLISHED_ANNOUNCEMENT  # Published papers or deliverables
            FINAL_RESULTS           # Sharing project outcomes or conclusions
            PROJECT_COMPLETION      # Declaring project completion
        }     

    # ApplicationStatus

        enum ApplicationStatus {
            PENDING        # Submitted and in review
            APPROVED       # Accepted application
            REJECTED       # Declined application
            WITHDRAWN      # Applicant withdrew application
            WAITLISTED     # Application is placed on a waiting list
        }    


    # CommentDestination

        enum CommentDestination {
                UPDATE
                APPLICATION
            }

#HOME FEED V2 TYPE DEFINITIONS

    # Post Type: Definition (LinkedIn-style social posts)

        type Post {
            _id: String!                    # ObjectId, required
            author: User!                   # Computed Value, user who created the post
            text: String!                   # Post content, required
            media: [PostMedia!]             # Array of media items (images/videos)
            createdAt: String!              # ISO format, required
            updatedAt: String!              # ISO format, required
            likeCount: Int!                 # Denormalized count of likes
            commentCount: Int!              # Denormalized count of comments
            viewerHasLiked: Boolean!        # Computed: whether current user liked this post
        }

    # PostComment Type: Definition

        type PostComment {
            _id: String!                    # ObjectId, required
            postId: String!                 # Reference to parent post
            commenter: User!                # Computed Value, user who commented
            text: String!                   # Comment content (note: 'text' not 'content' to match frontend)
            createdAt: String!              # ISO format, required
            updatedAt: String!              # ISO format, required
        }

    # PostMedia Type: Definition

        type PostMedia {
            type: MediaType!                # IMAGE or VIDEO
            url: String!                    # URL to media file
            thumbnailUrl: String            # Optional thumbnail for videos
            alt: String                     # Alt text for images
        }

    # FeedPage Type: Cursor-based pagination for posts

        type FeedPage {
            items: [Post!]!                 # Array of posts
            nextCursor: String              # Cursor for next page (null if no more)
        }

    # CommentsPage Type: Cursor-based pagination for comments

        type CommentsPage {
            items: [PostComment!]!          # Array of comments
            nextCursor: String              # Cursor for next page (null if no more)
        }

    # MediaType Enum

        enum MediaType {
            IMAGE
            VIDEO
        }

#DIRECT MESSAGING TYPES

    # Conversation Type: 1:1 messaging thread

        type Conversation {
            _id: String!                    # ObjectId, required
            participants: [User!]!          # Computed: Resolved to full User objects
            lastMessage: LastMessagePreview # Preview of most recent message
            unreadCount: Int!               # Computed: Unread messages for current user
            createdAt: String!              # ISO format, required
            updatedAt: String!              # ISO format, required
        }

    # LastMessagePreview Type: Preview for conversation list

        type LastMessagePreview {
            text: String!                   # Message text
            sender: User!                   # Computed: Resolved to User object
            timestamp: String!              # ISO format
        }

    # DirectMessage Type: Individual message in conversation

        type DirectMessage {
            _id: String!                    # ObjectId, required
            conversationId: String!         # Reference to conversation
            sender: User!                   # Computed: Resolved to User object
            text: String!                   # Message content, required
            isRead: Boolean!                # Computed: Whether current user has read
            createdAt: String!              # ISO format, required
            updatedAt: String!              # ISO format, required
        }

    # ConversationsPage Type: Cursor-based pagination for conversations

        type ConversationsPage {
            items: [Conversation!]!         # Array of conversations
            nextCursor: String              # Cursor for next page (null if no more)
        }

    # MessagesPage Type: Cursor-based pagination for messages

        type MessagesPage {
            items: [DirectMessage!]!        # Array of messages
            nextCursor: String              # Cursor for next page (null if no more)
        }

#INPUT TYPES FOR HOME FEED V2

    # FeedCursorInput: Pagination input for feed query

        input FeedCursorInput {
            limit: Int                      # Number of items to fetch (default 10)
            cursor: String                  # Cursor from previous page (null for first page)
        }

    # CommentsCursorInput: Pagination input for comments query

        input CommentsCursorInput {
            limit: Int                      # Number of items to fetch (default 5)
            cursor: String                  # Cursor from previous page (null for first page)
        }

    # PostMediaInput: Input for creating posts with media

        input PostMediaInput {
            type: MediaType!                # IMAGE or VIDEO
            url: String!                    # URL to media file
            thumbnailUrl: String            # Optional thumbnail
            alt: String                     # Alt text
        }

#INPUT TYPES FOR DIRECT MESSAGING

    # ConversationsCursorInput: Pagination input for conversations query

        input ConversationsCursorInput {
            limit: Int                      # Number of items to fetch (default 20)
            cursor: String                  # Cursor from previous page (null for first page)
        }

    # MessagesCursorInput: Pagination input for messages query

        input MessagesCursorInput {
            limit: Int                      # Number of items to fetch (default 30)
            cursor: String                  # Cursor from previous page (null for first page)
        }

    # ProfileLinksInput: Input for profile social/external links

        input ProfileLinksInput {
            github: String                  # GitHub profile URL
            linkedin: String                # LinkedIn profile URL
            website: String                 # Personal website URL
        }

    # EducationInput: Input for education entries
        input EducationInput {
            institution: String!            # Institution name (required)
            degree: String                  # Degree name
            field: String                   # Field of study
            startDate: String               # Start date (YYYY-MM or YYYY-MM-DD)
            endDate: String                 # End date (YYYY-MM or YYYY-MM-DD)
            location: String                # Location
            description: String             # Description
        }

    # ExperienceInput: Input for experience entries
        input ExperienceInput {
            title: String!                  # Job/role title (required)
            company: String                 # Company/organization name
            location: String                # Location
            startDate: String               # Start date (YYYY-MM or YYYY-MM-DD)
            endDate: String                 # End date (YYYY-MM or YYYY-MM-DD)
            description: String             # Description
        }

    # UpdateProjectPortfolioInput: Input for updating project portfolio details

        input UpdateProjectPortfolioInput {
            githubUrl: String               # GitHub repository URL
            liveUrl: String                 # Live demo URL
            demoVideoUrl: String            # Demo video URL
            techStack: [String]             # Array of technologies used
        }

    # UpdateMyProfileInput: Input for updating current user's profile

        input UpdateMyProfileInput {
            headline: String                # Professional headline
            location: String                # Location (e.g. "Hoboken, NJ")
            city: String                    # City (e.g. "Hoboken")
            bio: String                     # About/bio text
            profileLinks: ProfileLinksInput # Social/external links
            profilePhoto: String            # Profile photo URL
            coverPhoto: String              # Cover/banner photo URL
            featuredProjectId: String       # Featured project ID
            skills: [String]                # Array of skill names
            education: [EducationInput]     # Educational background
            experience: [ExperienceInput]   # Work/research experience
        }

#MUTATIONS

  type Mutation {
    
    # addUser
    # Purpose: Create an user and save them to MongoDB.
    # Cache: Add the user to the Redis cache.
        
        addUser(
            firstName: String!
            lastName: String!
            email: String!
            role: Role!
            department: Department!
            bio: String
        ): User
    
    # removeUser
    # Purpose: Remove a user from MongoDB.
    # Cache: Ensure both the user is removed from the Redis cache.
    
        removeUser(
            _id: String!
        ): User
    
    # editUser
    # Purpose: Update an author's details based on the provided fields.
    # Cache: Ensure the Redis cache is updated accordingly.

        editUser(
            _id: String!
            firstName: String
            lastName: String
            email: String
            role: Role
            department: Department
            bio: String
        ): User

    # updateMyProfile
    # Purpose: Update the current authenticated user's profile
    # Auth: Uses context.currentUser (no _id required)
    # Cache: Clear user caches after update

        updateMyProfile(
            input: UpdateMyProfileInput!
        ): User

    # addProject
    # Purpose: Add a new project to MongoDB
    # Cache: Add the project to Redis and ensure proper caching for related entities.
    
        addProject(
            title: String!
            department: Department!
            description: String
            professorIds: [String]      # Array of IDs for professors to associate with the project, not required, will be resolved to user objects
            studentIds: [String]        # Array of IDs for students to associate with the project, not required, will be resolved to user objects
        ): Project
    
    # removeProject
    # Purpose: Remove a project from MongoDB and clear its related data 
    # Cache: Clear the Redis cache for the project and related caches
   
        removeProject(
            _id: String!
        ): Project
    
    # editProject
    # Purpose: Update a project's detail
    # Cache: Ensure Redis cache is updated for both the project and its related entities

        editProject(
            _id: String!
            title: String
            description: String
            department: Department
            professorIds: [String]
            studentIds: [String]
            applicationIds: [String]
        ): Project

    # updateProjectPortfolio
    # Purpose: Update project portfolio details (URLs, tech stack)
    # Auth: Only project professors/students can update
    # Cache: Clear project caches after update

        updateProjectPortfolio(
            projectId: String!
            input: UpdateProjectPortfolioInput!
        ): Project

    # addUpdate
    # Purpose: Create a new update and add it to MongoDB.
    # Cache: Add the update to the Redis cache.

        addUpdate(
            posterId: String!             # ID of the User who created the update, will resolve to a user object
            subject: UpdateSubject!       # Enum defining the type of update
            content: String!              # Details about the update
            projectId: String!            # ID of the associated Project, will resolve to a project object
        ): Update
          
    # removeUpdate
    # Purpose: Remove an update
    # Cache: Ensure the update is removed from Redis cache.
   
        removeUpdate(
            _id: String!
        ): Update

    # editUpdate
    # Purpose: Update a updates's details based on the provided fields.
    # Cache: Ensure the Redis cache is updated accordingly.
       
        editUpdate(
            _id: String!                    
            posterId: String              # ID of the User who created the update, will resolve to a user object   
            subject: UpdateSubject        
            content: String                
            projectId: String             # ID of the Project associated with the update, will resolve to a project object
        ): Update

    # addApplication
    # Purpose: Add an application based on the provided fields
    # Cache: add the individaul application cache, delete applications cache
        
        addApplication(                  
            applicantId: String!          # ID of the User who applied, will resolve to a user object    
            projectId: String!            # ID of the Project, will resolve to a project object                                 
        ): Application

    # editApplication
    # Purpose: Edit an application based on the provided fields
    # Cache: add the individaul application cache, delete applications cache
        
        editApplication(
            _id: String!                    
            applicantId: String          # ID of the User who applied, will resolve to a user object    
            projectId: String            # ID of the Project, will resolve to a project object 
            status: ApplicationStatus
        ): Application

    # removeApplication
    # Purpose: Remove a application based on the provided fields
    # Cache: delete the individaul application cache, delete applications cache
        
        removeApplication(
            _id: String!
        ): Application

    # changeApplicationStatus
    # Purpose: Change the status of an application, if accepted add to project, if rejected just update the STATUS

        changeApplicationStatus(
            _id: String!
            status: ApplicationStatus!
        ): Application

    # addComment
    # Purpose: Create a new comment and add it to an existing update or application.
    # Cache: add the individual comment cache, delete the comments cache; handle caches or applications/updates

        addComment(
            commenterId: String!                        # ID of the User who commented, will resolve to a user object 
            destinationId: String!                      # ID of where comment will appear
            content: String!               
        ): Comment

    # editComment
    # Purpose: Edit a comment's content; handle udpates/applications as needed
    # Cache: add the individual comment cache, delete the comments cache; handle 

        editComment(
            _id: String!
            content: String
            commenterId: String      
        ): Comment

    # removeComment
    # Purpose: Remove a comment and update the appropriate caches.
    # Cache: delete the individual comment cache, delete the comments cache; handle application/updates caches as needed

        removeComment(
            _id: String!
        ): Comment

    #login

        login(token: String!): LoginResponse!

    #HOME FEED V2 MUTATIONS

    # createPost
    # Purpose: Create a new post with optional media
    # Cache: Invalidate feed cache
    # Auth: All authenticated users can post

        createPost(
            text: String!
            media: [PostMediaInput!]
        ): Post!

    # toggleLike
    # Purpose: Like or unlike a post (toggle)
    # Cache: Update post cache
    # Auth: All authenticated users

        toggleLike(
            postId: String!
        ): Post!

    # addPostComment
    # Purpose: Add a comment to a post
    # Cache: Invalidate comments cache for this post
    # Auth: All authenticated users

        addPostComment(
            postId: String!
            text: String!
        ): PostComment!

    # deletePost
    # Purpose: Delete a post (only by author)
    # Cache: Invalidate feed cache
    # Auth: Only post author can delete

        deletePost(
            postId: String!
        ): Boolean!

    #DIRECT MESSAGING MUTATIONS

    # sendDirectMessage
    # Purpose: Send a direct message to another user
    # Cache: Invalidate conversation list caches for both participants
    # Auth: All authenticated users
    # Creates conversation if it doesn't exist

        sendDirectMessage(
            recipientId: String!
            text: String!
        ): DirectMessage!

    # markConversationAsRead
    # Purpose: Mark all messages in a conversation as read by current user
    # Cache: Update conversation cache (unread count)
    # Auth: Only conversation participants

        markConversationAsRead(
            conversationId: String!
        ): Conversation!

        }

    #PROJECTS FEED V2 TYPES
    #Purpose: Paginated, efficient project feed with minimal over-fetching

    # ProjectsFeedInput
    # Purpose: Input parameters for projectsFeed query with pagination and filters

        input ProjectsFeedInput {
            first: Int = 20                    # Default 20, max 50 per page
            after: String                      # Cursor (base64 JSON: {createdDate, _id})
            searchTerm: String                 # Search in title (case-insensitive)
            departments: [Department!]         # Multi-select departments
            createdAfter: String               # ISO date (>= filter)
            createdBefore: String              # ISO date (<= filter)
            professorId: String                # For "My Projects" tab (future)
            myProjects: Boolean                # Filter to user's projects (professor OR student)
        }

    # ProjectSummary
    # Purpose: Lightweight project type for list views (no field resolvers)
    # All fields computed in aggregation pipeline

        type ProjectSummary {
            _id: String!
            title: String!
            descriptionPreview: String         # First 200 chars (no HTML stripping in MVP)
            createdDate: String!
            department: Department!
            professorCount: Int!               # Computed via $size
            studentCount: Int!                 # Computed via $size
            leadProfessor: UserSummary         # First professor via $lookup
            hasPortfolio: Boolean!             # True if any URL exists
        }

    # UserSummary
    # Purpose: Minimal user info for embedded display

        type UserSummary {
            _id: String!
            firstName: String!
            lastName: String!
            department: Department
        }

    # ProjectsFeedResult
    # Purpose: Relay-style cursor pagination result

        type ProjectsFeedResult {
            edges: [ProjectEdge!]!
            pageInfo: PageInfo!
        }

        type ProjectEdge {
            cursor: String!                    # Base64({createdDate, _id})
            node: ProjectSummary!
        }

        type PageInfo {
            hasNextPage: Boolean!
            endCursor: String                  # Last cursor, null if empty
        }

    # ========== APPLIED PROJECTS FEED ==========
    # Purpose: Show projects user has applied to with application status

        type AppliedProjectSummary {
            _id: String!
            title: String!
            descriptionPreview: String
            createdDate: String!
            department: Department!
            professorCount: Int!
            studentCount: Int!
            leadProfessor: UserSummary
            hasPortfolio: Boolean!
            application: ApplicationSummary!   # User's application to this project
        }

        type ApplicationSummary {
            _id: String!
            status: ApplicationStatus!
            applicationDate: String!
            lastUpdatedDate: String!
        }

        input AppliedProjectsFeedInput {
            first: Int = 20
            after: String
            statusFilter: ApplicationStatus    # Optional: filter by status
        }

        type AppliedProjectsFeedResult {
            edges: [AppliedProjectEdge!]!
            pageInfo: PageInfo!
        }

        type AppliedProjectEdge {
            cursor: String!
            node: AppliedProjectSummary!
        }

`;
