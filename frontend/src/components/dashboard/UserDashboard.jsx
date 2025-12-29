import React, {useState} from 'react';
import { Link } from 'react-router-dom';
import {useQuery} from '@apollo/client';
import queries from '../../queries';
import ActionBar from '../common/ActionBar';
import { useCurrentUser } from "../../hooks/useCurrentUser";
import moment from 'moment';

const UserDashboard = () => {

  const { user } = useCurrentUser();
  const userId = user?._id;

    
    // User Data
    const userData = useQuery(queries.GET_USER_BY_ID, {
        variables: { id: userId },
        fetchPolicy: "network-only",
      });
    const userLoading = userData.loading;
    const userError = userData.error;

  // NewsFeed Data
  const updatesData = useQuery(queries.GET_UPDATES, {
    fetchPolicy: "network-only",
  });
  const updateLoading = updatesData.loading;
  const updateError = updatesData.error;

  // Format Date
  const formatDate = (date) => {
    let newDate = new Date(date);
    const formattedDate = newDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    // return formattedDate;
    return moment(formattedDate).format("MMM Do, YYYY");
  };

  // If user not loaded yet
  if (!user) {
    return <p className="loader">Loading user...</p>;
  }

  // If loading
  if (userLoading || updateLoading) {
    return <p className="loader">Loading...</p>;
  }

    // If error
    if(userError || updateError){ return <p className="error-message">Error loading: {userError? userError.message : updateError.message}</p>}

    // Return data
    const userDetails = userData.data.getUserById;
    const updates = updatesData.data.updates;
    return(
        <main className="dashboard">
            <ActionBar role={userDetails.role} />
            <div className="main-content">
                <h1>Welcome {userDetails.firstName} {userDetails.lastName}</h1>
                <div className="dashboard-table">
                    {/* MAIN CARDS (Column) */}
                    <div className="d-column">

                        {/* PROJECTS CARD */}
                        <div className="d-card glassEffect">
                            <div className="d-card-header">
                                <h2>Project List</h2>
                                <Link className="card-header-link" to="/project">
                                    View All
                                </Link>
                            </div>
                            <div className="d-card-body">
                                <table className="d-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Professors</th>
                                            <th>Students</th>
                                            <th>Creation Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userDetails.projects && userDetails.projects.map((project) => {
                                            return(
                                                <tr key={project._id}>
                                                    <td>{project.title}</td>
                                                    <td>{project.professors.length}</td>
                                                    <td>{project.students.length}</td>
                                                    <td>{formatDate(project.createdDate)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* APPLICATIONS CARD */}
                        <div className="d-card glassEffect">
                            <div className="d-card-header">
                                <h2>Applications List</h2>
                                <Link className="card-header-link" to="/application">
                                    View All
                                </Link>
                            </div>
                            <div className="d-card-body">
                                <table className="d-table">
                                    <thead>
                                        <tr>
                                            <th>Project Name</th>
                                            <th>Creation Date</th>
                                            <th>Last Application Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userDetails.applications && userDetails.applications.slice(0,10).map( (application) => {
                                            return (
                                                <tr key={application._id}>
                                                    <td>{application.project.title}</td>
                                                    <td>{formatDate(application.applicationDate)}</td>
                                                    <td>{formatDate(application.lastUpdatedDate)}</td>
                                                    <td>{application.status}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* SIDE CARDS */}
                    <div className="d-column">

                        {/* USER INFORMATION */}
                        <div className="d-card glassEffect">
                            <div className="d-card-header">
                                <h2>User Information</h2>
                                <Link
                                    className="card-header-link"
                                    to="/edituser"
                                >Edit</Link>
                            </div>
                            <div className="d-card-body">
                                <dl className="desc-list">
                                    <div>
                                        <dt>Name:</dt>
                                        <dd>{userDetails.firstName} {userDetails.lastName}</dd>
                                    </div>
                                    <div>
                                        <dt>Email:</dt>
                                        <dd>{userDetails.email}</dd>
                                    </div>
                                    <div>
                                        <dt>Role:</dt>
                                        <dd>{userDetails.role}</dd>
                                    </div>
                                    <div>
                                        <dt>Department: </dt>
                                        <dd>{userDetails.department}</dd>
                                    </div>
                                    <div>
                                        <dt>Applications:</dt>
                                        <dd>{userDetails.numOfApplications}</dd>
                                    </div>
                                    <div>
                                        <dt>Projects:</dt>
                                        <dd>{userDetails.numOfProjects}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* NEWS FEED CARD */}
                        <div className="d-card glassEffect">
                            <div className="d-card-header">
                                <h2>News Feed</h2>
                                <Link className="card-header-link" to="/newsfeed/">View All</Link>
                            </div>
                            <div className="d-card-body">
                                <ul className="news-list">
                                    {updates && updates.slice(0,10).map( (update) => {
                                        return(
                                            <li key={update._id}>
                                                <div className="news-text">
                                                    <p className="news-list-header">{update.subject.replace("_", " ")}</p>
                                                    <p>{update.content}</p>
                                                </div>
                                                <p>{formatDate(update.postedDate)}</p>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}

export default UserDashboard;
