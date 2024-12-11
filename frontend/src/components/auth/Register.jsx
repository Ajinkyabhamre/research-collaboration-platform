import React, { useState } from "react";
import KeyIcon from "../../assets/svg/KeyIcon";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [bio, setBio] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Add logic to handle form submission (e.g., API call)
    console.log({
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      role,
      department,
      bio,
    });
  };

  return (
    <div className="d-card col-12 col-md-6 glassEffect my-4 mx-auto">
      <div className="d-card-header">
        <h2>
          <KeyIcon /> Register
        </h2>
      </div>
      <div className="d-card-body">
        <form id="registerform" onSubmit={handleSubmit}>
          <div className="form-floating mb-3">
            <input
              className="form-control"
              type="text"
              id="firstName"
              name="firstName"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <label htmlFor="firstName">First Name:</label>
          </div>

          <div className="form-floating mb-3">
            <input
              className="form-control"
              type="text"
              id="lastName"
              name="lastName"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            <label htmlFor="lastName">Last Name:</label>
          </div>

          <div className="form-floating mb-3">
            <input
              className="form-control"
              type="email"
              id="email"
              name="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label htmlFor="email">Email:</label>
          </div>

          <div className="form-floating mb-3">
            <input
              className="form-control"
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label htmlFor="password">Password:</label>
          </div>

          <div className="form-floating mb-3">
            <input
              className="form-control"
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <label htmlFor="confirmPassword">Confirm Password:</label>
          </div>

          <div className="form-floating mb-3">
            <input
              className="form-control"
              type="text"
              id="role"
              name="role"
              placeholder="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            />
            <label htmlFor="role">Role:</label>
          </div>

          <div className="form-floating mb-3">
            <input
              className="form-control"
              type="text"
              id="department"
              name="department"
              placeholder="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            />
            <label htmlFor="department">Department:</label>
          </div>

          <div className="form-floating mb-3">
            <textarea
              className="form-control"
              id="bio"
              name="bio"
              placeholder="Short Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows="3"
              style={{ height: "100px" }}
              required
            ></textarea>
            <label htmlFor="bio">Bio:</label>
          </div>

          <div className="row">
            <div className="offset-4 col-4 mt-3">
              <button
                className="btn btn-warning col-12 py-2"
                type="submit"
                id="submit"
              >
                Register
              </button>
            </div>
          </div>
        </form>
        <div className="mt-2">
          <a href="/auth/login">Already have an account? Login</a>
        </div>
      </div>
    </div>
  );
};

export default Register;
