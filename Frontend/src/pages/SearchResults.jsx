// src/pages/SearchResults.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./SearchResults.css";

export default function SearchResults() {
  const { term } = useParams();
  const navigate = useNavigate();

  const loggedUser = JSON.parse(localStorage.getItem("LoggedInUser"));
  const storedTodos = JSON.parse(localStorage.getItem("userTodos")) || {};
  const userTodos = loggedUser ? storedTodos[loggedUser.username] || [] : [];

  const filteredTodos = userTodos.filter((todo) =>
    todo.toLowerCase().includes(term.toLowerCase())
  );

  return (
    <div className="search-wrapper">
      <button onClick={() => navigate("/dashboard")} className="back-btn">
        ← Back to Dashboard
      </button>

      <h2>
        Search Results for: <span className="search-term">{term}</span>
      </h2>

      {filteredTodos.length > 0 ? (
        <ul className="todo-list">
          {filteredTodos.map((todo, idx) => (
            <li key={idx} className="todo-item">
              {todo}
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-results">No matching tasks found.</p>
      )}
    </div>
  );
}
