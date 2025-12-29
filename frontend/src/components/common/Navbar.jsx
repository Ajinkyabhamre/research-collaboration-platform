import React from "react";
import { Link, useLocation } from "react-router-dom"; // Import useLocation
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import DarkMode from "../../assets/svg/DarkMode";
import LightMode from "../../assets/svg/LightMode";

import RcpLogo from "../../assets/svg/RcpLogo";

const Navbar = () => {
  const location = useLocation(); // Get the current location

  // Helper function to determine active route
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar navbar-expand-md sticky-top glassEffect">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <div className="d-flex">
            <div className="iconSwitch">
              <RcpLogo />
            </div>
            <span className="my-auto fs-3 fw-bold">Research Collaboration</span>
          </div>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <SignedOut>
              <li className="nav-item">
                <Link
                  className={`nav-link ${isActive("/") ? "active" : ""}`}
                  to="/"
                >
                  Home
                </Link>
              </li>
            </SignedOut>

            {/* Add Newsfeed as News */}
            <SignedIn>
              <li className="nav-item">
                <Link
                  className={`nav-link ${
                    isActive("/newsfeed") ? "active" : ""
                  }`}
                  to="/newsfeed"
                >
                  News
                </Link>
              </li>
            </SignedIn>
            {/* Show links based on authentication */}
            <SignedOut>
              <li className="nav-item">
                <Link
                  className={`nav-link ${
                    isActive("/sign-in") ? "active" : ""
                  }`}
                  to="/sign-in"
                >
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={`nav-link ${
                    isActive("/sign-up") ? "active" : ""
                  }`}
                  to="/sign-up"
                >
                  Register
                </Link>
              </li>
            </SignedOut>
            <SignedIn>
              <li className="nav-item">
                <Link
                  className={`nav-link ${
                    isActive("/dashboard") ? "active" : ""
                  }`}
                  to="/dashboard"
                >
                  Dashboard
                </Link>
              </li>
              {/* Show links based on user role */}
              <li className="nav-item">
                <Link
                  className={`nav-link ${
                    isActive("/allprojects") ? "active" : ""
                  }`}
                  to="/allprojects"
                >
                  Project Database
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className={`nav-link ${
                    isActive("/project") ? "active" : ""
                  }`}
                  to="/project"
                >
                  My Projects
                </Link>
              </li>

              <li className="nav-item ms-5">
                <UserButton afterSignOutUrl="/" />
              </li>
            </SignedIn>

            {/* Theme toggle */}
            <li className="ms-5">
              <div className="d-flex">
                <div className="my-auto ms-auto iconSwitch">
                  <LightMode />
                </div>
                <div>
                  <a href="#" className="p-0">
                    <div id="switch" className="m-4">
                      <div id="circle" className="iconSwitch"></div>
                    </div>
                  </a>
                </div>
                <div className="my-auto me-auto iconSwitch">
                  <DarkMode />
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
