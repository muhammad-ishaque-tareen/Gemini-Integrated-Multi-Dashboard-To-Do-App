// src/pages/About.jsx
import React from 'react';
import './About.css';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="about-container">
      <h1>About Our Todo App</h1>
      <p>
        This Smart Todo App helps users track their daily tasks, boost productivity,
        and keep things organized. It was built with React, styled for simplicity,
        and enhanced with routing, local storage, and component-driven design.
      </p>
      <p>Key Features:</p>
      <ul>
        <li>Task management with persistent storage</li>
        <li>Search tasks by keyword</li>
        <li>User login & session saving</li>
      </ul>
      <button className="back-home-btn" onClick={() => navigate("/")}>
        Go to Home
      </button>
    </div>
  );
}
