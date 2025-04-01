import React, { useState } from "react";
import "../styles/Signup.css";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    bio: "",
    academicYear: "",
    major: "",
    department: "",
    rollNumber: "",
    skills: "",
    projects: "",
  });

  const [documents, setDocuments] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDocumentChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setDocuments((prevDocs) => [...prevDocs, ...newFiles]);
  };

  const removeSelectedFile = (index) => {
    setDocuments((prevDocs) => prevDocs.filter((_, i) => i !== index));
  };

  const removeUploadedFile = async (index, filePath) => {
    try {
      const response = await fetch("http://localhost:5000/remove-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) throw new Error("Failed to delete file.");

      setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    } catch (error) {
      console.error("Error removing file:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.email || !formData.password || !formData.name || !formData.bio) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    const submissionData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submissionData.append(key, value);
    });

    documents.forEach((document) => {
      submissionData.append("documents", document);
    });

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        body: submissionData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Signup failed.");

      alert("Registration successful! Your files have been uploaded.");
      setUploadedFiles(data.uploadedFiles || []);
      setDocuments([]);
      setFormData({
        name: "",
        email: "",
        password: "",
        bio: "",
        academicYear: "",
        major: "",
        department: "",
        rollNumber: "",
        skills: "",
        projects: "",
      });
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
        {Object.keys(formData).map((field) => (
          <input
            key={field}
            type={field === "password" ? "password" : "text"}
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={formData[field]}
            onChange={handleChange}
            required={field === "name" || field === "email" || field === "password" || field === "bio"}
          />
        ))}

        <input type="file" multiple onChange={handleDocumentChange} />
        {documents?.length > 0 && (
          <div className="file-preview">
            <h4>Selected Files:</h4>
            <ul>
              {documents.map((doc, index) => (
                <li key={index}>
                  {doc.name} <button type="button" className="remove-file-btn" onClick={() => removeSelectedFile(index)}>❌</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button type="submit" disabled={loading}>{loading ? "Signing up..." : "Signup"}</button>
      </form>

      {uploadedFiles?.length > 0 && (
        <div className="uploaded-files">
          <h3>Uploaded Files</h3>
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index}>
                <a href={`http://localhost:5000${file}`} target="_blank" rel="noopener noreferrer">{file}</a>
                <button type="button" className="remove-file-btn" onClick={() => removeUploadedFile(index, file)}>❌</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Signup;