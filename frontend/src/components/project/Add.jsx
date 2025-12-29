import React, {useState} from "react";
import {useMutation, useQuery} from "@apollo/client";
import {useNavigate} from "react-router-dom";
import queries from "../../queries";
import {useCurrentUser} from "../../hooks/useCurrentUser";
import {Editor} from 'react-draft-wysiwyg';
import {EditorState, convertToRaw} from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import "../../assets/css/editor.css"

const AddProject = () => {
    const { user } = useCurrentUser();
    const userId = user?._id;

    const [title, setTitle] = useState("");
    const [department, setDepartment] = useState("");
    const [description, setDescription] = useState("");
    const [editorState, setEditorState] = useState(EditorState.createEmpty());

    const {
        data: departmentData,
        loading: departmentLoading,
        error: departmentError,
    } = useQuery(queries.GET_ENUM_DEPARTMENT);

    const [addProjectMutation] = useMutation(queries.ADD_PROJECT);
    const navigate = useNavigate();

    const handleEditorStateChange = (state) => {
        setEditorState(state);

        setDescription(draftToHtml(convertToRaw(editorState.getCurrentContent())))
    }



    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const {data} = await addProjectMutation({
                variables: {
                    title,
                    description,
                    department,
                    professorIds: [userId],
                },
            });

            navigate("/project");
        } catch (error) {
            alert(`Error adding project: ${error.message}`);
        }
    };

    if (!user) return <p className="loader">Loading user...</p>;
    if (departmentLoading) return <p className="loader">Loading departments...</p>;
    if (departmentError)
        return <p>Error loading departments: {departmentError.message}</p>;

    return (
        <div className="d-card col-12 col-md-6 glassEffect my-4 mx-auto">
            <div className="d-card-header">
                <h2>Add New Project</h2>
            </div>
            <div className="d-card-body">
                <form id="addProjectForm" onSubmit={handleSubmit}>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            type="text"
                            id="title"
                            name="title"
                            placeholder="Project Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                        <label htmlFor="title">Project Title:</label>
                    </div>

                    <div className="form-floating mb-3">
                        <select
                            className="form-control"
                            id="department"
                            name="department"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            required
                        >
                            <option value="" disabled>
                                Select Department
                            </option>
                            {departmentData?.__type?.enumValues.map((dept) => (
                                <option key={dept.name} value={dept.name}>
                                    {dept.name.replace(/_/g, " ")}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="department">Department:</label>
                    </div>

                    <div className=" mb-3">
                        {/*<textarea*/}
                        {/*    className="form-control"*/}
                        {/*    id="description"*/}
                        {/*    name="description"*/}
                        {/*    placeholder="Project Description"*/}
                        {/*    rows="3"*/}
                        {/*    style={{height: "100px"}}*/}
                        {/*    value={description}*/}
                        {/*    onChange={(e) => setDescription(e.target.value)}*/}
                        {/*    required*/}
                        {/*></textarea>*/}
                        <label htmlFor="description">Project Description:</label>
                        <Editor
                            id="description"
                            name="description"
                            required
                            className="form-control"
                            editorState={editorState}
                            wrapperClassName="demo-wrapper"
                            editorClassName="demo-editor"
                            onEditorStateChange={handleEditorStateChange}
                        />
                    </div>


                    <div className="row">
                        <div className="offset-4 col-4 mt-3">
                            <button
                                className="btn btn-primary col-12 py-2"
                                type="submit"
                                id="submit"
                            >
                                Add Project
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProject;
