import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import queries from "../../queries";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../../hooks/useCurrentUser";

function ApplicationList() {
  const { user } = useCurrentUser();
  const id = user?._id;
  const userRole = user?.role;

  const { loading, error, data, refetch } = useQuery(queries.GET_USER_BY_ID, {
    variables: { id },
    fetchPolicy: "network-only",
  });

  const [selectedApplication, setSelectedApplication] = useState(null);

  // Mutation to remove an application
  const [removeApplication] = useMutation(queries.REMOVE_APPLICATION);

    const addButton = () => {
        if(userRole === "STUDENT"){
            return(
                <Link className="btn btn-success ms-2" to="/application/add">
                    Add
                </Link>
            );
        }
    }

  const handleDelete = async () => {
    if (!selectedApplication?._id) return;

    const confirmDeletion = window.confirm(
      `Are you sure you want to delete the project "${selectedApplication.project.title}"?`
    );
    if (confirmDeletion) {
      try {
        let id = selectedApplication._id;
        await removeApplication({ variables: { id: id } });
        await refetch();
      } catch (error) {
        alert(`Deletion Failed: ${error}`);
        console.error("Deletion failed: ", error);
      }
    }
  };

  useEffect(() => {
    if (data) {
      setSelectedApplication(null); //Reset selected application when data changes
    }
  }, [data]);

  if (!user) {
    return <p className="loader">Loading user...</p>;
  } else if (loading) {
    return <p className="loader">Loading...</p>;
  } else if (error) {
    return <p className="error-message">Error: {error.message}</p>;
  } else {
    const applications = data?.getUserById?.applications || [];
    return (
      <main className="dashboard">
        <div className="container my-3">
          <div className="d-card glassEffect">
            <div className="d-card-header">
              <div className="row col-12 d-flex">
                <div className="col my-auto">
                  <h2>Application List</h2>
                </div>
                <div className="col-auto d-flex">
                  {selectedApplication?._id ? (
                    <div className="d-flex">
                      <Link
                        className="nav-link"
                        to={"/application/" + selectedApplication?._id}
                      >
                        <button className="btn btn-info ms-2">Details</button>
                      </Link>
                      <button
                        className="btn btn-danger ms-2"
                        onClick={handleDelete}
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="d-flex">
                      <button className="btn btn-info ms-2 invisible">
                        Details
                      </button>
                      <button className="btn btn-danger ms-2 invisible">
                        Delete
                      </button>
                    </div>
                  )}
                  {addButton}
                </div>
              </div>
            </div>
            <div className="d-card-body mb-3 p-0">
              <div className="row">
                {/* Left Side: Application List */}
                <div className="col-md-4">
                  <ul className="chat-list">
                    {applications.map((application, index) => (
                      <li
                        key={application._id}
                        onClick={() => setSelectedApplication(application)}
                        className={
                          selectedApplication?._id === application._id
                            ? "active"
                            : ""
                        }
                      >
                        <span className="chat-list-number">{index + 1}.</span>
                        <p className="chat-list-header">
                          {application.project.title}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Right Side: Reading Pane */}
                <div className="col-md-8 my-3 border-start">
                  {selectedApplication ? (
                    <div>
                      <h2>{selectedApplication.project.title}</h2>
                      <p>{selectedApplication.status}</p>
                    </div>
                  ) : (
                    <p>Select an application to view its status</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }
}

export default ApplicationList;
