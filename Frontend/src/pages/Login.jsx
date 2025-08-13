import React, { useState } from "react";
import users from "../usersdata/users";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();

  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

const handleEmail=(e)=>{
  const value=e.target.value;
  setEmail(value);
  if(!value.includes('@')){
    setError("Please Enter a Valid Email");
  }
  else{
    setError(' ');
  }
};

  const handleLogin = async (e) => {
    e.preventDefault();
    try{
       const response = await axios.post('http://localhost:3000/login', {
        username,
        email,
        password
       });
       if(response.status==200)
       {
         localStorage.setItem("LoggedInUser", JSON.stringify(response.data.users));
          navigate("/parentdashboard");
       }
    }
    catch(error)
    {
      if(response.error && error.response.status==401)
      {
        setError("Invalid Username or Password");
      }
      else 
        {
          ("Server Error, Please Try again letter");
        }
        setTimeout(() => setError(""), 3000);

  
  }
};

  return (
    <div className="login-container">
      <form className="login-form-container" onSubmit={handleLogin}>
        <h2>Login</h2>
        <input
          type="text"
          value={username}
          placeholder="Please Enter User Name"
          onChange={(e) => setUserName(e.target.value)}
        />
        <input
          type="email"
          value={email}
          placeholder="Please Enter a Valid Email."
          onChange={handleEmail}
        />
        <input
          type="password"
          value={password}
          placeholder="Please Enter Your Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="button-row">
          <button type="submit" className="left-btn">
            Login
          </button>
          <button
            type="button"
            className="right-btn"
            onClick={() => navigate("/forgetpassword")}
          >
            Forgot Password
          </button>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
  }
