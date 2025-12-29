import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useUser } from "@clerk/clerk-react";
import { useCurrentUser } from "../hooks/useCurrentUser";

import { useQuery } from "@apollo/client";
import queries from "../queries";

function Chat() {
  const { user: clerkUser } = useUser();
  const { user: mongoUser } = useCurrentUser();
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);

  // Fetch user data using useQuery
  const { data, loading, error } = useQuery(queries.GET_USER_BY_ID, {
    variables: { id: mongoUser?._id },
    skip: !clerkUser || !mongoUser, // Skip query if not authenticated
  });

  useEffect(() => {
    if (!clerkUser || !mongoUser) {
      window.location.href = "/login";
      return;
    }

    const newSocket = io("http://localhost:4001");
    setSocket(newSocket);

    newSocket.emit("user_connected", {
      email: clerkUser.primaryEmailAddress.emailAddress,
      role: mongoUser.role,
    });

    // if (socket && selectedChannel) {
    //   socket.emit("join_channel", selectedChannel);

    //   // Listen for previous messages
    //   socket.on("previous_messages", (previousMessages) => {
    //     setMessages(previousMessages);
    //   });
    // }

    // Listen for incoming messages
    newSocket.on("chat_message", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [clerkUser, mongoUser]);

  useEffect(() => {
    if (socket && selectedChannel) {
      socket.emit("join_channel", selectedChannel);

      // setMessages([]);
      // socket.emit("fetch_previous_messages", selectedChannel);

      socket.on("previous_messages", (previousMessages) => {
        setMessages(previousMessages); // Set previous messages for the new channel
      });
    }

    // Cleanup the "previous_messages" listener when the channel changes
    // return () => {
    //   if (socket) {
    //     socket.off("previous_messages");
    //   }
    // };
  }, [socket, selectedChannel]);

  const handleChannelSelect = (channelId) => {
    if (socket) {
      // Join the selected channel
      socket.emit("join_channel", channelId);
      setSelectedChannel(channelId);
    }
  };

  const handleSendMessage = () => {
    console.log("Sending message:", message);
    if (!message.trim()) alert("Please enter a message");
    if (socket && message.trim() && selectedChannel) {
      // Emit the message to the specific channel
      socket.emit("chat_message", {
        channel: selectedChannel,
        user: clerkUser.primaryEmailAddress.emailAddress,
        message,
      });
      setMessage(""); // Clear the input
    }
  };

  if (loading) return <p className="loader">Loading...</p>;
  if (error) return <p className="error-message">Error: {error.message}</p>;

  const user = data?.getUserById;
  const projects = user?.projects || [];

  return (
    <div className="chat-container">
      <h2>
        Welcome to the Chat, {user.firstName} {user.lastName}
      </h2>

      <div className="channels">
        <h3>Select a Channel:</h3>
        <ul>
          {projects.map((project) => (
            <li
              key={project._id}
              className={selectedChannel === project._id ? "selected" : ""}
              onClick={() => handleChannelSelect(project._id)} // Join the channel on click
            >
              {project.title}
            </li>
          ))}
        </ul>
      </div>

      {selectedChannel && (
        <div className="messages">
          <h4>
            Channel: {projects.find((p) => p._id === selectedChannel)?.title}
          </h4>
          <div className="message-list">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${
                  msg.user === clerkUser.primaryEmailAddress.emailAddress
                    ? "current-user"
                    : "other-user"
                }`}
              >
                <strong>{msg.user}:</strong> {msg.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="message-input">
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={!selectedChannel}
        />
        <button
          onClick={handleSendMessage}
          disabled={!selectedChannel || !message.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
