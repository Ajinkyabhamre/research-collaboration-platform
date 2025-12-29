import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import HomeIcon from "../../../assets/svg/HomeIcon_2";
import NextIcon from "../../../assets/svg/NextIcon";
import ChatIcon from "../../../assets/svg/ChatIcon_2";
import AnnouncementIcon from "../../../assets/svg/Announcement";
import VoiceIcon from "../../../assets/svg/VoiceIcon";
import Team from "../../../assets/svg/Team";
import Requests from "../../../assets/svg/Requests";
import { useCurrentUser } from "../../../hooks/useCurrentUser";

const ActionBar = (props) => {
  const { user } = useCurrentUser();
  const location = useLocation(); // Get the current route location

  useEffect(() => {
    const sidebar = document.querySelector(".sidebar");
    const toggle = document.querySelector(".sidebar .toggle");

    if (toggle) {
      toggle.addEventListener("click", () => {
        if (sidebar.classList.contains("open"))
          sidebar.classList.remove("open");
        else sidebar.classList.add("open");
      });
    }

    // Cleanup event listeners on component unmount
    return () => {
      if (toggle) toggle.removeEventListener("click", () => {});
    };
  }, []); // Empty dependency array ensures this only runs once on mount

  // Utility to determine if a route is active
  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar glassEffect open">
      <div className="toggle">
        <div className="iconSwitch">
          <NextIcon />
        </div>
      </div>

      <div className="logo fw-bold">{props.projectTitle}</div>

      <nav>
        <div className="nav-title">Management</div>

        <ul>
          <Link
            to={`/project/${props.projectId}`}
            className="nav-link d-flex p-0"
          >
            <li
              className={`nav-item ${
                isActive(`/project/${props.projectId}`) ? "active" : ""
              }`}
            >
              <div className="iconSwitch">
                <HomeIcon />
              </div>
              <span className="my-auto">Home</span>
            </li>
          </Link>
          <Link
            to={`/project/${props.projectId}/team`}
            className="nav-link d-flex p-0"
          >
            <li
              className={`nav-item ${
                isActive(`/project/${props.projectId}/team`) ? "active" : ""
              }`}
            >
              <div className="iconSwitch">
                <Team />
              </div>
              <span className="my-auto">Team</span>
            </li>
          </Link>

          {user?.role === "PROFESSOR" && (
            <Link
              to={`/project/${props.projectId}/requests`}
              className="nav-link d-flex p-0"
            >
              {" "}
              <li
                className={`nav-item ${
                  isActive(`/project/${props.projectId}/requests`)
                    ? "active"
                    : ""
                }`}
              >
                <div className="iconSwitch">
                  <Requests />
                </div>
                <span className="my-auto">Requests</span>
              </li>
            </Link>
          )}
        </ul>

        {/* <div className="nav-title">Channel</div>
        <ul>
          <li
            className={`nav-item ${isActive("/channel/text") ? "active" : ""}`}
          >
            <div className="iconSwitch d-flex">
              <ChatIcon />
            </div>
            <span>Text</span>
          </li>

          <li
            className={`nav-item ${
              isActive("/channel/announcement") ? "active" : ""
            }`}
          >
            <div className="iconSwitch d-flex">
              <AnnouncementIcon />
            </div>
            <span>Announcement</span>
          </li>
        </ul> */}
      </nav>
    </div>
  );
};

export default ActionBar;
