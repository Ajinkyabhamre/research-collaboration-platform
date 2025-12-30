import { gql } from "@apollo/client";

/* QUERIES
 ******************************** */
// GET CURRENT USER
const ME = gql`
  query Me {
    me {
      _id
      firstName
      lastName
      email
      role
      department
      bio
      headline
      location
      city
      profileLinks {
        github
        linkedin
        website
      }
      profilePhoto
      coverPhoto
      featuredProjectId
      skills
      education {
        institution
        degree
        field
        startDate
        endDate
        location
        description
      }
      experience {
        title
        company
        location
        startDate
        endDate
        description
      }
      numOfProjects
      numOfApplications
    }
  }
`;

// GET ALL
const GET_PROJECTS = gql`
  query Projects {
    projects {
      _id
      title
      description
      createdDate
      department
      professors {
        _id
        firstName
        lastName
      }
      students {
        _id
        firstName
        lastName
      }
      numOfApplications
      numOfUpdates
    }
  }
`;

// PROJECTS FEED V2 - Paginated feed with cursor pagination
const PROJECTS_FEED = gql`
  query ProjectsFeed($input: ProjectsFeedInput!) {
    projectsFeed(input: $input) {
      edges {
        cursor
        node {
          _id
          title
          descriptionPreview
          createdDate
          department
          professorCount
          studentCount
          leadProfessor {
            _id
            firstName
            lastName
            department
          }
          hasPortfolio
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const APPLIED_PROJECTS_FEED = gql`
  query AppliedProjectsFeed($input: AppliedProjectsFeedInput!) {
    appliedProjectsFeed(input: $input) {
      edges {
        cursor
        node {
          _id
          title
          descriptionPreview
          createdDate
          department
          professorCount
          studentCount
          leadProfessor {
            _id
            firstName
            lastName
            department
          }
          hasPortfolio
          application {
            _id
            status
            applicationDate
            lastUpdatedDate
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const GET_APPLICATIONS = gql`
  query Applications {
    applications {
      _id
      applicantId
      projectId
      applicationDate
      lastUpdatedDate
      status
      comments
    }
  }
`;
const GET_UPDATES_BY_PROJECT_ID = gql`
  query GetUpdatesByProjectId($projectId: String!, $limit: Int) {
    getUpdatesByProjectId(projectId: $projectId, limit: $limit) {
      _id
      posterUser {
        _id
        firstName
        lastName
        profilePhoto
        role
      }
      subject
      content
      postedDate
      numOfComments
    }
  }
`;

const GET_UPDATES = gql`
  query Updates {
    updates {
      _id
      posterUser {
        firstName
        lastName
        role
        department
      }
      subject
      content
      project {
        title
      }
      postedDate
      numOfComments
      postedDate
      posterUser {
        firstName
        lastName
        _id
      }
      project {
        _id
        title
      }
      subject
      comments {
        _id
        content
        commenter {
          firstName
          lastName
        }
      }
    }
  }
`;

// GET BY ID
const GET_USER_BY_ID = gql`
  query GetUserById($id: String!) {
    getUserById(_id: $id) {
      _id
      firstName
      lastName
      email
      role
      department
      bio
      headline
      location
      city
      profileLinks {
        github
        linkedin
        website
      }
      profilePhoto
      coverPhoto
      featuredProjectId
      skills
      education {
        institution
        degree
        field
        startDate
        endDate
        location
        description
      }
      experience {
        title
        company
        location
        startDate
        endDate
        description
      }
      applications {
        _id
        applicant {
          _id
          firstName
          lastName
        }
        project {
          _id
          title
        }
        applicationDate
        lastUpdatedDate
        status
        numOfComments
      }
      projects {
        _id
        title
        professors {
          _id
          firstName
          lastName
        }
        students {
          _id
          firstName
          lastName
        }
        createdDate
      }
      numOfApplications
      numOfProjects
    }
  }
`;
const GET_PROJECT_BY_ID = gql`
  query Query($id: String!) {
    getProjectById(_id: $id) {
      _id
      title
      applications {
        _id
        applicant {
          _id
          firstName
          lastName
        }
        status
      }
      professors {
        _id
        firstName
        lastName
        email
        department
        role
      }
      students {
        _id
        firstName
        lastName
        email
        department
        role
      }
      department
      createdDate
      description
      numOfApplications
    }
  }
`;

const GET_UPDATE_BY_ID = gql`
  query GetUpdateById($id: String!) {
    getUpdateById(_id: $id) {
      _id
      subject
      content
      comments {
        _id
        commenter {
          firstName
          lastName
        }
        content
        postedDate
      }
      numOfComments
    }
  }
`;
const GET_APPLICATION_BY_ID = gql`
  query GetApplicationById($id: String!) {
    getApplicationById(_id: $id) {
      _id
      applicant {
        _id
        firstName
        lastName
      }
      project {
        _id
        title
        professors {
          _id
          firstName
          lastName
        }
      }
      applicationDate
      lastUpdatedDate
      status
      numOfComments
    }
  }
`;

const CHANGE_APPLICATION_STATUS = gql`
  mutation Mutation($id: String!, $status: ApplicationStatus!) {
    changeApplicationStatus(_id: $id, status: $status) {
      _id
      applicationDate
      status
    }
  }
`;

// GET & SEARCH QUERIES
const GET_PROFESSORS_BY_PROJECT_ID = gql`
  query Query($projectId: String!) {
    getProfessorsByProjectId(projectId: $projectId) {
      _id
      firstName
      lastName
      email
      role
      department
      bio
      applications {
        _id
        applicantId
        projectId
      }
      projects {
        _id
        title
      }
      numOfApplications
      numOfProjects
    }
  }
`;
const GET_STUDENT_BY_PROJECT_ID = gql`
  query Query($projectId: String!) {
    getStudentsByProjectId(projectId: $projectId) {
      _id
      firstName
      lastName
      email
      role
      department
      bio
      applications {
        _id
        applicantId
        projectId
      }
      projects {
        _id
        title
      }
      numOfApplications
      numOfProjects
    }
  }
`;

const GET_PROJECTS_BY_USER_ID = gql`
  query GetProjectsByUserId($id: String!) {
    getProjectsByUserId(_id: $id) {
      _id
      title
      department
      professors {
        _id
        firstName
        lastName
      }
      students {
        _id
        firstName
        lastName
      }
      createdDate
      githubUrl
      liveUrl
      demoVideoUrl
      techStack
    }
  }
`;

const PROJECTS_BY_DEPARTMENT = gql`
  query Query($department: Department!) {
    projectsByDepartment(department: $department) {
      _id
      title
      createdDate
      department
      professors {
        _id
        firstName
        lastName
      }
      students {
        _id
        firstName
        lastName
      }
      applications {
        _id
        applicantId
        projectId
        status
      }
      numOfApplications
      numOfUpdates
    }
  }
`;
const UDPATES_BY_SUBJECT = gql`
  query Query($subject: updateSubject!) {
    updatesBySubject(updateSubject: $updateSubject) {
      _id
      posterId
      subject
      constent
      projectId
      poastedDate
      comments
      numOfComments
    }
  }
`;

const PROJECTS_BY_CREATED_YEAR = gql`
  query Query($min: Int!, $max: Int!) {
    projectsByCreatedYear(min: $min, max: $max) {
      _id
      title
      createdDate
      department
      professors {
        _id
        firstName
        lastName
      }
      students {
        _id
        firstName
        lastName
      }
      applications {
        _id
        applicantId
        projectId
        status
      }
      numOfApplications
      numOfUpdates
    }
  }
`;
const SEARCH_PROJECT_BY_TITLE = gql`
  query Query($searchTerm: String!) {
    searchProjectByTitle(searchTerm: $searchTerm) {
      _id
      title
      createdDate
      department
      professors {
        _id
        firstName
        lastName
      }
      students {
        _id
        firstName
        lastName
      }
      applications {
        _id
        applicantId
        projectId
        status
      }
      numOfApplications
      numOfUpdates
    }
  }
`;
const SEARCH_USER_BY_NAME = gql`
  query SearchUserByName($searchTerm: String!) {
    searchUserByName(searchTerm: $searchTerm) {
      _id
      firstName
      lastName
      email
      role
      department
      headline
      profilePhoto
    }
  }
`;

/* MUTATIONS
 ******************************** */
// ADD
const ADD_USER = gql`
  mutation AddUser(
    $firstName: String!
    $lastName: String!
    $email: String!
    $password: String!
    $role: Role!
    $department: Department!
    $bio: String
  ) {
    addUser(
      firstName: $firstName
      lastName: $lastName
      email: $email
      password: $password
      role: $role
      department: $department
      bio: $bio
    ) {
      _id
      firstName
      lastName
    }
  }
`;
const ADD_PROJECT = gql`
  mutation AddProject(
    $title: String!
    $description: String
    $department: Department!
    $professorIds: [String!]!
    $studentIds: [String]
  ) {
    addProject(
      title: $title
      description: $description
      department: $department
      professorIds: $professorIds
      studentIds: $studentIds
    ) {
      _id
      title
      description
      createdDate
      department
      professors {
        _id
        firstName
        lastName
      }
      students {
        _id
        firstName
        lastName
      }
      numOfApplications
      numOfUpdates
    }
  }
`;
const ADD_UPDATE = gql`
  mutation AddUpdate(
    $posterId: String!
    $subject: UpdateSubject!
    $content: String!
    $projectId: String!
  ) {
    addUpdate(
      posterId: $posterId
      subject: $subject
      content: $content
      projectId: $projectId
    ) {
      _id
      content
      postedDate
      subject
      posterUser {
        firstName
        lastName
        role
      }
      project {
        title
      }
    }
  }
`;

const ADD_APPLICATION = gql`
  mutation AddApplication($applicantId: String!, $projectId: String!) {
    addApplication(applicantId: $applicantId, projectId: $projectId) {
      _id
      applicationDate
      lastUpdatedDate
      status
      applicant {
        _id
        firstName
        lastName
      }
      project {
        _id
        title
      }
    }
  }
`;

// EDIT
const EDIT_USER = gql`
  mutation EditUser(
    $id: String!
    $lastName: String
    $firstName: String
    $department: Department
    $bio: String
    $role: Role
    $email: String
  ) {
    editUser(
      _id: $id
      lastName: $lastName
      firstName: $firstName
      department: $department
      bio: $bio
      role: $role
      email: $email
    ) {
      _id
    }
  }
`;

const UPDATE_MY_PROFILE = gql`
  mutation UpdateMyProfile($input: UpdateMyProfileInput!) {
    updateMyProfile(input: $input) {
      _id
      firstName
      lastName
      email
      role
      department
      bio
      headline
      location
      city
      profileLinks {
        github
        linkedin
        website
      }
      profilePhoto
      coverPhoto
      featuredProjectId
      skills
      education {
        institution
        degree
        field
        startDate
        endDate
        location
        description
      }
      experience {
        title
        company
        location
        startDate
        endDate
        description
      }
      numOfProjects
      numOfApplications
    }
  }
`;

const EDIT_PROJECT = gql`
  mutation EditProject(
    $id: String!
    $title: String
    $department: Department
    $professorIds: [String]
    $studentIds: [String]
  ) {
    editProject(
      _id: $id
      title: $title
      department: $department
      professorIds: $professorIds
      studentIds: $studentIds
    ) {
      _id
      title
      createdDate
      department
      professors {
        _id
        firstName
        lastName
      }
      students {
        _id
        firstName
        lastName
      }
      applications {
        _id
        applicantId
        projectId
        status
      }
      numOfApplications
      numOfUpdates
    }
  }
`;
const EDIT_UPDATE = gql`
  mutation EditUpdate(
    $id: String!
    $posterId: String
    $subject: UpdateSubject
    $content: String
    $projectId: String
  ) {
    editUpdate(
      id: $id
      posterId: $posterId
      subject: $subject
      content: $content
      projectId: $projectId
    ) {
      _id
      posterId
      subject
      constent
      projectId
      poastedDate
      comments
      numOfComments
    }
  }
`;
const EDIT_APPLICATION = gql`
  mutation EditApplication($id: String!, $projectId: String) {
    editApplication(_id: $id, projectId: $projectId) {
      _id
    }
  }
`;

// DELETE
const REMOVE_USER = gql`
  mutation RemoveUser($id: String!) {
    removeUser(_id: $id) {
      _id
      firstName
      lastName
    }
  }
`;
const REMOVE_PROJECT = gql`
  mutation RemoveProject($id: String!) {
    removeProject(_id: $id) {
      _id
      title
    }
  }
`;
const REMOVE_UPDATE = gql`
  mutation RemoveUpdate($id: String!) {
    removeUpdate(_id: $id) {
      _id
    }
  }
`;
const REMOVE_APPLICATION = gql`
  mutation RemoveApplication($id: String!) {
    removeApplication(_id: $id) {
      _id
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($token: String!) {
    login(token: $token) {
      message
      _id
      name
      email
      role
    }
  }
`;

const GET_ENUM_DEPARTMENT = gql`
  query GetEnumValues {
    __type(name: "Department") {
      enumValues {
        name
      }
    }
  }
`;

const GET_ENUM_ROLE = gql`
  query GetEnumValues {
    __type(name: "Role") {
      enumValues {
        name
      }
    }
  }
`;

const ADD_COMMENT = gql`
  mutation AddComment(
    $commenterId: String!
    $destinationId: String!
    $content: String!
  ) {
    addComment(
      commenterId: $commenterId
      destinationId: $destinationId
      content: $content
    ) {
      _id
      content
      postedDate
      commenter {
        firstName
        lastName
      }
    }
  }
`;

const REMOVE_COMMENT = gql`
  mutation RemoveComment($id: String!) {
    removeComment(_id: $id) {
      _id
    }
  }
`;

/* HOME FEED V2 QUERIES & MUTATIONS
 ******************************** */

const FEED = gql`
  query Feed($cursor: FeedCursorInput) {
    feed(cursor: $cursor) {
      items {
        _id
        author {
          _id
          firstName
          lastName
          role
          department
          email
        }
        text
        media {
          type
          url
          thumbnailUrl
          alt
        }
        createdAt
        updatedAt
        likeCount
        commentCount
        viewerHasLiked
      }
      nextCursor
    }
  }
`;

const POST_COMMENTS = gql`
  query PostComments($postId: String!, $cursor: CommentsCursorInput) {
    postComments(postId: $postId, cursor: $cursor) {
      items {
        _id
        postId
        commenter {
          _id
          firstName
          lastName
          role
          department
        }
        text
        createdAt
        updatedAt
      }
      nextCursor
    }
  }
`;

const CREATE_POST = gql`
  mutation CreatePost($text: String!, $media: [PostMediaInput!]) {
    createPost(text: $text, media: $media) {
      _id
      author {
        _id
        firstName
        lastName
        role
        department
      }
      text
      media {
        type
        url
        thumbnailUrl
        alt
      }
      createdAt
      updatedAt
      likeCount
      commentCount
      viewerHasLiked
    }
  }
`;

const TOGGLE_LIKE = gql`
  mutation ToggleLike($postId: String!) {
    toggleLike(postId: $postId) {
      _id
      likeCount
      viewerHasLiked
    }
  }
`;

const ADD_POST_COMMENT = gql`
  mutation AddPostComment($postId: String!, $text: String!) {
    addPostComment(postId: $postId, text: $text) {
      _id
      postId
      commenter {
        _id
        firstName
        lastName
        role
        department
      }
      text
      createdAt
      updatedAt
    }
  }
`;

const DELETE_POST = gql`
  mutation DeletePost($postId: String!) {
    deletePost(postId: $postId)
  }
`;

const UPDATE_PROJECT_PORTFOLIO = gql`
  mutation UpdateProjectPortfolio($projectId: String!, $input: UpdateProjectPortfolioInput!) {
    updateProjectPortfolio(projectId: $projectId, input: $input) {
      _id
      title
      githubUrl
      liveUrl
      demoVideoUrl
      techStack
    }
  }
`;

// DIRECT MESSAGING QUERIES & MUTATIONS

const CONVERSATIONS = gql`
  query Conversations($cursor: ConversationsCursorInput) {
    conversations(cursor: $cursor) {
      items {
        _id
        participants {
          _id
          firstName
          lastName
          profilePhoto
        }
        lastMessage {
          text
          sender {
            _id
            firstName
            lastName
          }
          timestamp
        }
        unreadCount
        updatedAt
      }
      nextCursor
    }
  }
`;

const CONVERSATION_MESSAGES = gql`
  query ConversationMessages($conversationId: String!, $cursor: MessagesCursorInput) {
    conversationMessages(conversationId: $conversationId, cursor: $cursor) {
      items {
        _id
        sender {
          _id
          firstName
          lastName
          profilePhoto
        }
        text
        isRead
        createdAt
      }
      nextCursor
    }
  }
`;

const GET_OR_CREATE_CONVERSATION = gql`
  query GetOrCreateConversation($recipientId: String!) {
    getOrCreateConversation(recipientId: $recipientId) {
      _id
      participants {
        _id
        firstName
        lastName
        profilePhoto
      }
      lastMessage {
        text
        sender {
          _id
          firstName
          lastName
        }
        timestamp
      }
      unreadCount
      updatedAt
    }
  }
`;

const SEND_DIRECT_MESSAGE = gql`
  mutation SendDirectMessage($recipientId: String!, $text: String!) {
    sendDirectMessage(recipientId: $recipientId, text: $text) {
      _id
      sender {
        _id
        firstName
        lastName
        profilePhoto
      }
      text
      isRead
      createdAt
    }
  }
`;

const MARK_CONVERSATION_AS_READ = gql`
  mutation MarkConversationAsRead($conversationId: String!) {
    markConversationAsRead(conversationId: $conversationId) {
      _id
      unreadCount
    }
  }
`;

let exported = {
  ME,
  GET_PROJECTS,
  PROJECTS_FEED,
  APPLIED_PROJECTS_FEED,
  GET_APPLICATIONS,
  GET_UPDATES,
  GET_UPDATES_BY_PROJECT_ID,
  GET_USER_BY_ID,
  GET_PROJECT_BY_ID,
  GET_UPDATE_BY_ID,
  GET_APPLICATION_BY_ID,
  CHANGE_APPLICATION_STATUS,
  GET_PROFESSORS_BY_PROJECT_ID,
  GET_STUDENT_BY_PROJECT_ID,
  GET_PROJECTS_BY_USER_ID,
  PROJECTS_BY_DEPARTMENT,
  UDPATES_BY_SUBJECT,
  PROJECTS_BY_CREATED_YEAR,
  SEARCH_PROJECT_BY_TITLE,
  SEARCH_USER_BY_NAME,
  ADD_USER,
  ADD_PROJECT,
  ADD_UPDATE,
  ADD_APPLICATION,
  EDIT_USER,
  UPDATE_MY_PROFILE,
  EDIT_PROJECT,
  EDIT_UPDATE,
  EDIT_APPLICATION,
  REMOVE_USER,
  REMOVE_PROJECT,
  REMOVE_UPDATE,
  REMOVE_APPLICATION,
  LOGIN_MUTATION,
  GET_ENUM_DEPARTMENT,
  GET_ENUM_ROLE,
  ADD_COMMENT,
  REMOVE_COMMENT,
  // Home Feed V2
  FEED,
  POST_COMMENTS,
  CREATE_POST,
  TOGGLE_LIKE,
  ADD_POST_COMMENT,
  DELETE_POST,
  UPDATE_PROJECT_PORTFOLIO,
  // Direct Messaging
  CONVERSATIONS,
  CONVERSATION_MESSAGES,
  GET_OR_CREATE_CONVERSATION,
  SEND_DIRECT_MESSAGE,
  MARK_CONVERSATION_AS_READ,
};

export default exported;
