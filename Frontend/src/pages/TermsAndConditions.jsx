
import React from 'react';
import './TermsAndConditions.css';
import { useNavigate } from 'react-router-dom';

export default function TermsAndConditions() {
  const navigate = useNavigate();

  return (
    <div className="terms-container">
      <h1>Terms and Conditions</h1>
      <p>
        By using this Todo App, you agree to the following terms and conditions.
        Please read them carefully.
      </p>

      <ul>
        <li>You are responsible for the security of your login credentials.</li>
        <li>All tasks and data you enter are stored locally in your browser.</li>
        <li>This app does not share or sell your personal data.</li>
        <li>Use the app respectfully and avoid inappropriate content.</li>
        <li>We reserve the right to update the terms at any time.</li>
      </ul>

      <p>
        If you do not agree with any of these terms, please stop using the application.
        Continued use of the app implies acceptance of these terms.
      </p>

      <button className="back-btn" onClick={() => navigate("/")}>
        Back to Home
      </button>
    </div>
  );
}
