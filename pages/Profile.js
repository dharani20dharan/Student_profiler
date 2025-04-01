import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/Profile.css";

function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams(); // Get userId from URL
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
  
    console.log(`Fetching profile for user ID: ${userId}`); // Log userId
  
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`http://localhost:5000/profile/${userId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error ${response.status}: ${errorText}`);
        }
  
        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.message);
      }
      setLoading(false);
    };
  
    fetchUserProfile();
  }, [navigate, userId]);
  // Re-fetch when userId changes

  if (loading) return <div className="loading">Loading Profile...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!user) return <div className="error-message">User not found.</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-info">
          <h1>{user.name || "No Name Provided"}</h1>
          <p className="email">{user.email || "No Email Provided"}</p>
          <p className="bio">{user.bio || "No bio available."}</p>
        </div>
      </div>
      <div className="profile-details">
        <h2>Academic Information</h2>
        <p><strong>Academic Year:</strong> {user.academic_year || "N/A"}</p>
        <p><strong>Major:</strong> {user.major || "N/A"}</p>
        <p><strong>Department:</strong> {user.department || "N/A"}</p>
        <p><strong>Roll Number:</strong> {user.roll_number || "N/A"}</p>
      </div>
      <button className="back-btn" onClick={() => navigate("/")}>
        Back to Home
      </button>
    </div>
  );
}

export default Profile;
