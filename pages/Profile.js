import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/Profile.css";

function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("You must be logged in to view this page.");
      setLoading(false);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`http://localhost:5000/profile/${userId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch profile");
        setUser(data.user);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate, userId]);

  if (loading) return <div className="loading">Loading Profile...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!user) return <div className="error-message">User not found.</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Profile Picture */}
        <div className="profile-picture-container">
          <img
            src={
              user.profile_picture
                ? `http://localhost:5000${user.profile_picture}`
                : "https://via.placeholder.com/150"
            }
            alt="Profile"
            className="profile-picture"
          />
        </div>

        {/* Basic Info */}
        <h1>{user.name}</h1>
        <p className="email">{user.email}</p>

        {/* Academic Info */}
        <div className="section">
          <h2>Academic Details</h2>
          <p><strong>Roll Number:</strong> {user.roll_number}</p>
          <p><strong>Department:</strong> {user.department}</p>
          <p><strong>Year of Study:</strong> {user.year_of_study}</p>
        </div>

        {/* Contact */}
        <div className="section">
          <h2>Contact Details</h2>
          <p><strong>Phone:</strong> {user.phone_number}</p>
        </div>

        {/* Skills */}
        <div className="section">
          <h2>Skills</h2>
          {Array.isArray(user.skills) && user.skills.length > 0 ? (
            <ul className="skills-list">
              {user.skills.map((skill, index) => (
                <li key={index} className="skill-pill">{skill}</li>
              ))}
            </ul>
          ) : (
            <p>No skills added yet.</p>
          )}
        </div>

        {/* Projects */}
        <div className="section">
          <h2>Projects</h2>
          {Array.isArray(user.projects) && user.projects.length > 0 ? (
            <ul>
              {user.projects.map((project, index) => (
                <li key={index}>
                  <strong>{project.project_name}</strong><br />
                  <span>{project.project_description}</span><br />
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      🔗 View Project
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No projects added yet.</p>
          )}
        </div>

        {/* Documents */}
        <div className="section">
          <h2>Documents</h2>
          {Array.isArray(user.documents) && user.documents.length > 0 ? (
            <ul>
              {user.documents.map((doc, index) => (
                <li key={index}>
                  <strong>{doc.name}</strong> —{" "}
                  <a
                    href={`http://localhost:5000${doc.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="document-link"
                  >
                    📄 View / Download
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>No documents uploaded yet.</p>
          )}
        </div>

        {/* Back Button */}
        <button className="back-btn" onClick={() => navigate("/")}>
          ⬅ Back to Home
        </button>
      </div>
    </div>
  );
}

export default Profile;
