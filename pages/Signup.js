import React, { useState } from "react";
import "../styles/Signup.css";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
    yearOfStudy: "",
    major: "",
    department: "",
    rollNumber: "",
    phoneNumber: "",
    skills: "",
  });

  const [projects, setProjects] = useState([{ name: "", description: "", links: "" }]);
  const [documents, setDocuments] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProjectChange = (index, field, value) => {
    const updatedProjects = [...projects];
    updatedProjects[index][field] = value;
    setProjects(updatedProjects);
  };

  const addProjectField = () => {
    setProjects([...projects, { name: "", description: "", links: "" }]);
  };

  const handleDocumentChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setDocuments((prev) => [...prev, ...newFiles]);
  };

  const handleProfilePicChange = (e) => {
    setProfilePicture(e.target.files[0]);
  };

  const removeSelectedFile = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const removeUploadedFile = async (index, filePath) => {
    try {
      const response = await fetch("http://localhost:5000/remove-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) throw new Error("Failed to delete file.");
      setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error removing file:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const requiredFields = ["name", "email", "password", "bio"];
    const hasEmptyRequired = requiredFields.some((field) => !formData[field]);

    if (hasEmptyRequired) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    const submissionData = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "skills") {
        const skillsArray = value.split(",").map((skill) => skill.trim());
        submissionData.append("skills", JSON.stringify(skillsArray));
      } else {
        submissionData.append(key, value);
      }
    });

    const formattedProjects = projects.map((proj) => ({
      project_name: proj.name,
      project_description: proj.description,
      links: proj.links,
    }));
    submissionData.append("projects", JSON.stringify(formattedProjects));

    documents.forEach((doc) => submissionData.append("documents", doc));
    if (profilePicture) submissionData.append("profilePicture", profilePicture);

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        body: submissionData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Signup failed.");

      alert("✅ Registration successful!");

      setUploadedFiles(data.uploadedFiles || []);
      setDocuments([]);
      setProfilePicture(null);
      setProjects([{ name: "", description: "", links: "" }]);
      setFormData({
        name: "",
        email: "",
        password: "",
        bio: "",
        yearOfStudy: "",
        major: "",
        department: "",
        rollNumber: "",
        phoneNumber: "",
        skills: "",
      });

      navigate(`/`);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="signup-container">
      <h2>Signup</h2>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <h3>Basic Info</h3>
        {Object.keys(formData).map((field) => (
          <input
            key={field}
            type={field === "password" ? "password" : "text"}
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={formData[field]}
            onChange={handleChange}
            required={["name", "email", "password", "bio"].includes(field)}
          />
        ))}

        {/* Project Information */}
        <h3>Projects</h3>
        {projects.map((proj, idx) => (
          <div className="project-group" key={idx}>
            <input
              type="text"
              placeholder="Project Name"
              value={proj.name}
              onChange={(e) => handleProjectChange(idx, "name", e.target.value)}
            />
            <input
              type="text"
              placeholder="Description"
              value={proj.description}
              onChange={(e) => handleProjectChange(idx, "description", e.target.value)}
            />
            <input
              type="text"
              placeholder="Links"
              value={proj.links}
              onChange={(e) => handleProjectChange(idx, "links", e.target.value)}
            />
          </div>
        ))}
        <button type="button" onClick={addProjectField}>
          ➕ Add Another Project
        </button>

        {/* Profile Picture Upload */}
        <h3>Profile Picture</h3>
        <input type="file" accept="image/*" onChange={handleProfilePicChange} />
        {profilePicture && <p className="preview-text">Selected: {profilePicture.name}</p>}

        {/* Document Upload */}
        <h3>Documents</h3>
        <input type="file" multiple onChange={handleDocumentChange} />
        {documents.length > 0 && (
          <div className="file-preview">
            <h4>Selected Files:</h4>
            <ul>
              {documents.map((doc, index) => (
                <li key={index}>
                  {doc.name}
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={() => removeSelectedFile(index)}
                  >
                    ❌
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Signing up..." : "Signup"}
        </button>
      </form>

      {/* Display uploaded files with delete option */}
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h3>Uploaded Files</h3>
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index}>
                <a href={`http://localhost:5000${file}`} target="_blank" rel="noopener noreferrer">
                  {file}
                </a>
                <button
                  type="button"
                  className="remove-file-btn"
                  onClick={() => removeUploadedFile(index, file)}
                >
                  ❌
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Signup;
