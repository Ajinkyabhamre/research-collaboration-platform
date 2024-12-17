import React, { useState } from "react";
import KeyIcon from "../../assets/svg/KeyIcon.jsx";

const ResetPasswordRequest = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    //Reset Password Logic
  };

  return (
    <div className="d-card col-12 col-md-4 glassEffect my-4 mx-auto">
      <div className="d-card-header">
        <h2>
          <KeyIcon />
          Reset Password Request
        </h2>
      </div>
      <div className="d-card-body">
        <form id="resetpassword" onSubmit={handleSubmit}>
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

          <div className="row">
            <div className="offset-4 col-4 mt-3">
              <button
                className="btn btn-primary col-12 py-2"
                type="submit"
                id="submit"
              >
                Reset Password Request
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordRequest;
