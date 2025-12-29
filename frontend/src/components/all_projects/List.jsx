import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import queries from "../../queries.js";
import { useCurrentUser } from "../../hooks/useCurrentUser";

const departmentOptions = [
  { value: "ALL", label: "All" },
  { value: "BIOMEDICAL_ENGINEERING", label: "Biomedical Engineering" },
  {
    value: "CHEMICAL_ENGINEERING_AND_MATERIALS_SCIENCE",
    label: "Chemical Engineering And Materials Science",
  },
  {
    value: "CHEMISTRY_AND_CHEMICAL_BIOLOGY",
    label: "Chemistry And Chemical Biology",
  },
  {
    value: "CIVIL_ENVIRONMENTAL_AND_OCEAN_ENGINEERING",
    label: "Civil Environmental And Ocean Engineering",
  },
  { value: "COMPUTER_SCIENCE", label: "Computer Science" },
  {
    value: "ELECTRICAL_AND_COMPUTER_ENGINEERING",
    label: "Electrical And Computer Engineering",
  },
  { value: "MATHEMATICAL_SCIENCES", label: "Mathematical Sciences" },
  { value: "MECHANICAL_ENGINEERING", label: "Mechanical Engineering" },
  { value: "PHYSICS", label: "Physics" },
  { value: "SYSTEMS_AND_ENTERPRISES", label: "Systems And Enterprises" },
];

const AllProjectList = () => {
  const { user } = useCurrentUser();
  const userId = user?._id;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");

  // Query to fetch all projects
  const {
    data: projectsData,
    loading: projectsLoading,
    error: projectsError,
    refetch: refetchAllProjects,
  } = useQuery(queries.GET_PROJECTS, {
    fetchPolicy: "network-only",
  });

  // Query to fetch user-specific data (applications and current projects)
  const {
    data: userData,
    loading: userLoading,
    error: userError,
    refetch: refetchUserData,
  } = useQuery(queries.GET_USER_BY_ID, {
    variables: { id: userId },
    fetchPolicy: "network-only",
  });

  const [selectedProject, setSelectedProject] = useState(null);
  const [enrollProject] = useMutation(queries.ADD_APPLICATION);

  const handleEnroll = async (project) => {
    try {
      await enrollProject({
        variables: {
          applicantId: userId, // Current user's ID
          projectId: project._id, // Selected project's ID
        },
      });
      alert(`Successfully applied to project: ${project.title}`);

      await refetchAllProjects(); // Refetch all projects to update enrollment status
      await refetchUserData(); // Refetch user data to update enrollment status
    } catch (error) {
      console.error("Error applying to project:", error.message);
      alert("Failed to apply to the project. Please try again.");
    }
  };

  useEffect(() => {
    if (projectsData) {
      setSelectedProject(null); // Reset selected project when project data changes
    }
  }, [projectsData]);

  if (!user) return <p className="loader">Loading user...</p>;
  if (projectsLoading || userLoading)
    return <p className="loader">Loading projects...</p>;
  if (projectsError)
    return <p>Error loading projects: {projectsError.message}</p>;
  if (userError)
    return (
      <p className="error-message">
        Error loading user data: {userError.message}
      </p>
    );

  const projects = projectsData?.projects || [];
  const userApplications = userData?.getUserById?.applications || [];
  const userProjects = userData?.getUserById?.projects || [];

  // Function to check if the user is already enrolled in a project
  const isUserEnrolled = (project) => {
    const isInApplications = userApplications.some(
      (application) => application.project._id === project._id
    );
    const isInProjects = userProjects.some(
      (userProject) => userProject._id === project._id
    );
    return isInApplications || isInProjects;
  };

  const formatDepartment = (department) => {
    return department
      .split("_") // Split by underscores
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" "); // Join the words back with spaces
  };

  return (
    <main className="dashboard">
      <div className="container my-3">
        <div className="d-card glassEffect">
          <div className="d-card-header">
            <div className="col-12">
              <div className="row">
                <div className="col my-auto">
                  <h2>All Project List</h2>
                </div>
                <div className="col-3 my-auto">
                  <input
                    type="text"
                    className="form-control"
                    id="searchTerm"
                    placeholder="Search by Project Name"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    value={searchTerm}
                  />
                </div>
                <div className="col-3 my-auto">
                  <select
                    className="form-select"
                    aria-label="Default select example"
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    {departmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-auto d-flex">
                  {user?.role === "STUDENT" && (
                    <div className="d-flex">
                      {selectedProject?._id ? (
                        isUserEnrolled(selectedProject) ? (
                          <button className="btn btn-success ms-2" disabled>
                            Enrolled
                          </button>
                        ) : (
                          <button
                            className="btn btn-info ms-2"
                            onClick={() => handleEnroll(selectedProject)}
                          >
                            Enroll
                          </button>
                        )
                      ) : (
                        <button className="btn btn-info ms-2 invisible">
                          Enroll
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="d-card-body mb-3 p-0">
            <div className="row">
              {/* Left Side: Project List */}
              <div className="col-md-4 pe-0">
                <ul className="chat-list">
                  {projects
                    .filter((p) =>
                      p.title.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .filter((p) =>
                      selectedDepartment === "ALL"
                        ? true
                        : p.department === selectedDepartment
                    )
                    .map((project, index) => (
                      <li
                        key={project._id}
                        onClick={() => setSelectedProject(project)}
                        className={
                          selectedProject?._id === project._id ? "active" : ""
                        }
                      >
                        <span className="chat-list-number">{index + 1}.</span>
                        <p className="chat-list-header">{project.title}</p>
                        <p>
                          {
                            departmentOptions.find(
                              (department) =>
                                department.value === project.department
                            ).label
                          }
                        </p>
                      </li>
                    ))}
                </ul>
              </div>
              {/* Right Side: Reading Pane */}
              <div className="col-md-8 my-3 border-start">
                {selectedProject ? (
                  <div>
                    <h2>{selectedProject.title}</h2>
                    <p>{formatDepartment(selectedProject.department)}</p>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: selectedProject.description,
                      }}
                    >
                      {/* {selectedProject.description} */}
                    </p>
                  </div>
                ) : (
                  <p>Select a project to view its details.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AllProjectList;
