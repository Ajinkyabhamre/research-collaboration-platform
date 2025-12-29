import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import queries from "../queries";
import { useCurrentUser } from "../hooks/useCurrentUser";

const Newsfeed = () => {
  const { user } = useCurrentUser();
  const userId = user?._id; // User ID for adding comments

  const { loading, error, data, refetch } = useQuery(queries.GET_UPDATES);

  const [showAddPostForm, setShowAddPostForm] = useState(false);
  const [newPost, setNewPost] = useState({
    subject: "",
    content: "",
    projectId: "",
  });

  const [newComment, setNewComment] = useState(""); // New comment input
  const [activeUpdateId, setActiveUpdateId] = useState(null); // Active update for comments
  const [addComment] = useMutation(queries.ADD_COMMENT);
  const [removeComment] = useMutation(queries.REMOVE_COMMENT);
  const [addUpdate] = useMutation(queries.ADD_UPDATE);
  const [removeUpdate] = useMutation(queries.REMOVE_UPDATE);

  // Fetch Projects using GET_PROJECTS
  const {
    data: userData,
    loading: projectsLoading,
    error: projectsError,
  } = useQuery(queries.GET_USER_BY_ID, {
    variables: { id: userId },
  });

  // Subject Enum Options
  const subjectOptions = [
    "CALL_FOR_APPLICANTS",
    "TEAM_UPDATE",
    "PROJECT_LAUNCH",
    "MILESTONE_REACHED",
    "PROGRESS_REPORT",
    "DEADLINE_UPDATE",
    "REQUEST_FOR_FEEDBACK",
    "FUNDING_UPDATE",
    "EVENT_ANNOUNCEMENT",
    "ISSUE_REPORTED",
    "PUBLISHED_ANNOUNCEMENT",
    "FINAL_RESULTS",
    "PROJECT_COMPLETION",
  ];

  if (!user) return <p className="loader">Loading user...</p>;
  if (loading) return <p>Loading updates...</p>;
  if (error) return <p>Error loading updates. Please try again later.</p>;

  // Add a new post
  const handleAddPost = async () => {
    const { subject, content, projectId } = newPost;
    if (!subject || !content || !projectId)
      return alert("All fields are required!");

    try {
      await addUpdate({
        variables: {
          posterId: userId,
          subject,
          content,
          projectId,
        },
      });
      setNewPost({ subject: "", content: "", projectId: "" }); // Reset input
      refetch();
      setShowAddPostForm(false);
    } catch (error) {
      console.error("Error adding post:", error);
    }
  };

  // Render Add Post Form
  const renderAddPostForm = () => (
    <div className="add-post-form glassEffect">
      <h3>Create New Post</h3>

      {/* Subject Dropdown */}
      <select
        value={newPost.subject}
        onChange={(e) => setNewPost({ ...newPost, subject: e.target.value })}
      >
        <option value="">Select Subject</option>
        {subjectOptions.map((subject) => (
          <option key={subject} value={subject}>
            {subject.replace(/_/g, " ")} {/* Beautify text */}
          </option>
        ))}
      </select>

      {/* Content Input */}
      <textarea
        placeholder="Content"
        value={newPost.content}
        onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
      />

      {/* Project Dropdown */}
      <select
        value={newPost.projectId}
        onChange={(e) => setNewPost({ ...newPost, projectId: e.target.value })}
      >
        <option value="">Select Project</option>
        {projectsLoading && <option>Loading projects...</option>}
        {projectsError && <option>Error fetching projects</option>}
        {userData?.getUserById.projects?.map((project) => (
          <option key={project._id} value={project._id}>
            {project.title} - {project._id}
          </option>
        ))}
      </select>

      {/* Add Post Button */}
      <button onClick={handleAddPost} className="btn-add">
        Add Post
      </button>
    </div>
  );

  // Render individual update
  // const renderUpdate = (update) => (
  //   <div key={update._id} className="news-card">
  //     <div className="news-header">
  //       <div className="user-avatar">{update.posterUser.firstName[0]}</div>
  //       <div>
  //         <h3>
  //           {update.posterUser.firstName} {update.posterUser.lastName}
  //         </h3>
  //         <p className="news-meta">
  //           {update.posterUser.role} · {update.posterUser.department}
  //         </p>
  //       </div>
  //     </div>
  //     <div className="news-body">
  //       <h4>{update.subject.replace(/_/g, " ")}</h4>
  //       <p>{update.content}</p>
  //       <p>
  //         <strong>Project:</strong> {update.project.title}
  //       </p>
  //     </div>
  //     <div className="news-footer">
  //       <p className="news-date">
  //         {new Date(update.postedDate).toLocaleDateString()}
  //       </p>
  //       <button
  //         className="btn-view-comments"
  //         onClick={() =>
  //           setActiveUpdateId((prev) =>
  //             prev === update._id ? null : update._id
  //           )
  //         }
  //       >
  //         {activeUpdateId === update._id ? "Hide Comments" : "View Comments"}
  //       </button>
  //     </div>
  //   </div>
  // );

  const handleAddComment = async (updateId) => {
    if (!newComment.trim()) return alert("Comment cannot be empty!");
    try {
      await addComment({
        variables: {
          destinationId: updateId,
          commenterId: userId,
          content: newComment,
        },
      });
      setNewComment(""); // Clear comment input
      refetch(); // Refresh the data
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  // Handle removing a comment
  const handleRemoveComment = async (commentId, updateId) => {
    try {
      await removeComment({
        variables: {
          id: commentId,
        },
      });
      refetch();
    } catch (err) {
      console.error("Error removing comment:", err);
    }
  };

  const renderComments = (comments, updateId) => {
    return (
      <div className="comments-section">
        {comments.length > 0 ? (
          <div>
            <h5>Comments</h5>
            <ul className="comments-list">
              {comments.map((comment) => (
                <li key={comment._id} className="comment">
                  <p>
                    <strong>
                      {comment.commenter
                        ? `${comment.commenter.firstName} ${comment.commenter.lastName}`
                        : "Unknown User"}
                    </strong>
                    : {comment.content}
                  </p>
                  <button
                    onClick={() => handleRemoveComment(comment._id)}
                    className="btn-remove"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No comments yet. Be the first to comment!</p>
        )}
        <div className="add-comment-section">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            onClick={() => handleAddComment(updateId)}
            className="btn-view-comments"
          >
            Add
          </button>
        </div>
      </div>
    );
  };

  const renderUpdate = (update) => (
    <div key={update._id} className="news-card glassEffect">
      <div className="news-header">
        <div className="user-avatar">{update.posterUser.firstName[0]}</div>
        <div>
          <h3>
            {update.posterUser.firstName} {update.posterUser.lastName}
          </h3>
          <p className="news-meta">
            {update.posterUser.role} · {update.posterUser.department.replaceAll("_", " ")}
          </p>
        </div>
      </div>
      <div className="news-body">
        <h4>{update.subject.replace(/_/g, " ")}</h4>
        <p>{update.content}</p>
        <p>
          <strong>Project:</strong> {update.project.title}
        </p>
      </div>
      <div className="news-footer">
        <p className="news-date">
          {new Date(update.postedDate).toLocaleDateString()}
        </p>
        <button
          className="btn-view-comments"
          onClick={() =>
            setActiveUpdateId((prev) =>
              prev === update._id ? null : update._id
            )
          }
        >
          {activeUpdateId === update._id ? "Hide Comments" : "View Comments"}
        </button>
      </div>
      {activeUpdateId === update._id &&
        renderComments(update.comments, update._id)}
    </div>
  );

  // Render the full newsfeed
  return (
    <div className="newsfeed">
      <div className="newsfeed-content">
        <div className="newsfeed-header">
          <h2>Newsfeed</h2>
          <button
            onClick={() => setShowAddPostForm((prev) => !prev)}
            className="btn-new-post"
          >
            {showAddPostForm ? "Hide New Post" : "New Post"}
          </button>
        </div>
        {showAddPostForm && renderAddPostForm()}
        {data.updates.length > 0 ? (
          data.updates.map((update) => renderUpdate(update))
        ) : (
          <p>No updates available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default Newsfeed;
