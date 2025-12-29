import React, {useState} from 'react';
import {useQuery, useMutation} from '@apollo/client';
import queries from '../../queries.js';
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useNavigate, Link } from "react-router-dom";

import {
    checkIsProperFirstOrLastName,
    checkIsProperString,
    checkIsProperPassword,
    validateEmail
} from "../../helpers";

const EditUser = () => {
    const { user } = useCurrentUser();
    const userId = user?._id;

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");
    const [department, setDepartment] = useState("");
    const [bio, setBio] = useState("");

    const [editUser] = useMutation(queries.EDIT_USER);

    const {
        data: userData,
        loading: userLoading,
        error: userError
    } = useQuery(queries.GET_USER_BY_ID, {
        variables: {id: userId},
        fetchPolicy: 'network-only'
    });

    const {
        data: departmentData,
        loading: departmentLoading,
        error: departmentError,
    } = useQuery(queries.GET_ENUM_DEPARTMENT);

    const {
        data: roleData,
        loading: roleLoading,
        error: roleError,
    } = useQuery(queries.GET_ENUM_ROLE);

    const filteredRoles = roleData
        ? roleData.__type.enumValues.filter(
            (role) => role.name.toLowerCase() !== "admin"
            )
        : [];

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userDetails = userData.getUserById;
        
        const {
            firstName,
            lastName,
            email,
            role,
            department,
            bio
        } = e.target.elements;

        let firstNameValue, lastNameValue, emailValue, roleValue, departmentValue, bioValue;

        try {
            if(firstName.value !== ""){
                firstName.value = checkIsProperFirstOrLastName(firstName.value, "firstName");
                firstNameValue = firstName.value;
            } else {
                firstNameValue = userDetails.firstName;
            }
            if(lastName.value !== ""){
                lastName.value = checkIsProperFirstOrLastName(lastName.value, "lastName");
                lastNameValue = lastName.value;
            } else {
                lastNameValue = userDetails.lastName;
            }
            if(email.value){
                email.value = validateEmail(email.value);
                emailValue = email.value;
            } else {
                emailValue = userDetails.email;
            }
            if(role.value){
                role.value = checkIsProperString(role.value, "role");
                roleValue = role.value;
            } else {
                roleValue = userDetails.role;
            }
            if(department.value){
                department.value = checkIsProperString(department.value, "department");
                departmentValue = department.value;
            } else {
                departmentValue = userDetails.department;
            }
            if(bio.value){
                bio.value = checkIsProperString(bio.value, "bio");
                bioValue = bio.value;
            } else {
                bioValue = userDetails.bio;
            }

            const {data} = await editUser({
                variables: {
                    id: userId,
                    firstName: firstNameValue,
                    lastName: lastNameValue,
                    email: emailValue,
                    role: roleValue,
                    department: departmentValue,
                    bio: bioValue,
                }
            });

            navigate("/dashboard");

        } catch(error) {
            alert("Error: " +  error.message);
            console.error(error)
        }
    }
    
    if(!user) return <p className="loader">Loading user...</p>;
    if(userLoading) return <p className="loader">Loading user data...</p>;
    if(userError) return <p className="error-message">Error loading user data: {userError.message}</p>


    return (
        <div className="d-card col-12 col-md-6 glassEffect my-4 mx-auto">
            <div className="d-card-header">
                <h2>Edit User</h2>
            </div>
            <div className="d-card-body">
                <form id="editUserForm" onSubmit={handleSubmit} autoComplete="off">
                    {/* First Name */}
                    <div className="form-floating md-3">
                        <input 
                            className="form-control"
                            type="text"
                            id="firstName"
                            name="firstName"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                        <label htmlFor="firstName">First Name:</label>
                    </div>

                    {/* Last Name */}
                    <div className="form-floating md-3">
                        <input 
                            className="form-control"
                            type="text"
                            id="lastName"
                            name="lastName"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                        <label htmlFor="lastName">Last Name:</label>
                    </div>

                    {/* Email */}
                    <div className="form-floating md-3">
                        <input 
                            className="form-control"
                            type="email"
                            id="email"
                            name="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <label htmlFor="email">Email:</label>
                    </div>

                    {/* Role */}
                    <div className="form-floating md-3">
                    {roleLoading ? (
                        <select className="form-select" disabled>
                            <option>Loading Roles...</option>
                        </select>
                        ) : roleError ? (
                        <select className="form-select" disabled>
                            <option>Error loading Roles</option>
                        </select>
                        ) : (
                        <select
                            className="form-select"
                            id="role"
                            name="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="">Select a Role</option>
                            {filteredRoles.map((role) => (
                            <option key={role.name} value={role.name}>
                                {role.name}
                            </option>
                            ))}
                        </select>
                        )}
                        <label htmlFor="role">Role:</label>
                    </div>

                    {/* Department */}
                    <div className="form-floating md-3">
                        {departmentLoading ? (
                            <select className="form-select" disabled>
                                <option>Loading departments...</option>
                            </select>
                        ) : departmentError ? (
                            <select className="form-select" disabled>
                                <option>Error Loading Departments</option>
                            </select>
                        ) : (
                            <select
                                className="form-select"
                                id="department"
                                name="department"
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                            >
                                <option value="">Select a Department</option>
                                {departmentData.__type.enumValues.map((dept) => (
                                    <option key={dept.name} value={dept.name}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        <label htmlFor="department">Department</label>
                    </div>

                    {/* Bio */}
                    <div className="form-floating md-3">
                        <textarea
                            className="form-control"
                            id="bio"
                            name="bio"
                            placeholder="Bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows="3"
                            style={({height:"100px"})}
                        ></textarea>
                        <label htmlFor="bio">Bio:</label>
                    </div>

                    {/* Submit Button */}
                    <div className="row">
                        <div className="col-6 mt-3">
                            <button
                                className="btn btn-primary col-12 py-2"
                                type="submit"
                                id="submit"
                            >Submit</button>
                        </div>
                        <div className="col-6 mt-3">
                            <Link 
                                className="btn btn-secondary col-12 py-2" 
                                to="/dashboard"
                            >Cancel</Link>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default EditUser;