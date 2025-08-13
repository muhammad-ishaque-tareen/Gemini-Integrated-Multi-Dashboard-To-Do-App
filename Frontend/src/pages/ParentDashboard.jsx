
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import './ParentDashboard.css';
import Calculator from '../components/Calculator';

export default function ParentDashboard() {
  const navigate= useNavigate();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [childDashboards, setChildDashboards] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    visibility: 'private'
  });

useEffect(() => {
  const fetchUserData = async () => {
    const storeUser = localStorage.getItem("LoggedInUser");
    if (storeUser) {
      const user = JSON.parse(storeUser);  // Fix: lowercase 'user'
      try {
        const response = await axios.get(`http://localhost:3000/user-details/${user.id}`);  // Fix: use 'user'
        if (response.status === 200 && response.data.user) {  // Fix: check response.data.user
          const userData = response.data.user;  // Fix: use response.data.user
          setLoggedInUser(userData);
          localStorage.setItem("LoggedInUser", JSON.stringify(userData));
        }
        else {
          console.error("Failed to fetch the User Data From Database.");
          handleLogout();
        }
      }
      catch (err) {
        console.error("Error While Fetching user details!", err);
        handleLogout();  // Add handleLogout() on error
      }
    }
    else {
      setLoggedInUser(null);  // Fix: use null instead of false
      handleLogout();
    }
  }; 
  fetchUserData();
}, []);


  useEffect(() => {
  const fetchAllDashboards = async () => {
    if (loggedInUser && loggedInUser.id) {
      try {
        const response = await axios.get(`http://localhost:3000/dashboard/${loggedInUser.id}`);
        if (response.status === 200) {
          setChildDashboards(response.data);
        } else {
          console.error("Failed to Fetch Child Dashboards.");
          setChildDashboards([]);
        }
      } catch (err) {
        console.error("Error While Fetching ChildDashboards:", err);
        setChildDashboards([]);
      }
    } else {
      console.log("Waiting for user data to load...");
      setChildDashboards([]);
    }
  };
  if (loggedInUser && loggedInUser.id) {
    fetchAllDashboards();
  }
}, [loggedInUser]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateDashboard =async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      console.error("Please Enter the Dashboard Title.");
      return;
    }
    if(!loggedInUser || !loggedInUser.id || !loggedInUser.email)
    {
      console.error("User not logged in or missing user details for dashboard creation.");
      return; 
    }


    try
    {
     const newDashboardData=
      {
    
       userId:loggedInUser.id,
       owneremail:loggedInUser.email,
       Title: formData.title,
       visibility: formData.visibility,
     };
     const response = await axios.post('http://localhost:3000/createnewdashboard',newDashboardData);
     if(response.status==201)
     {
      console.log("New Dashboard Created Successfully");
      setChildDashboards(prev=>[...prev, response.data]);
      setFormData({title: '', visibility : 'private'});
      setShowCreateForm(false);
     }
     else
     {
      console.error("Failed to Create New Dashboard", response.data.message);
     }

   } 
   catch(err)
   {
    console.error("Failed to create Dashboard", err);
   }

    
  };

 const handleDeleteDashboard = async(dashboardId) => {
  if (window.confirm('Are you sure you want to delete this dashboard?'))
  {
    try
    {
      if(!loggedInUser?.id || !dashboardId)
      {
        console.error("User id and dashboard id is required to delete the dashboard.");
        return;
      }
      
      const response = await axios.delete('http://localhost:3000/deletedashboard', {
        data: {   
          userId: loggedInUser.id,
          dashboardId
        }
      });

      if(response && response.status === 200)
      {
        console.log('Dashboard deleted successfully from backend:', dashboardId);
        setChildDashboards(prev => prev.filter(dashboard => dashboard.id !== dashboardId));
      }
      else 
      {
        console.error("Failed to delete dashboard:", response.data?.message || 'Unknown error');
      }
    }
    catch(err)
    {
      console.error("Error deleting dashboard:", err);
      console.error("Error details:", err.response?.data?.message || err.message);
    }
  }
};

  const handleViewDashboard = (dashboardId) => {
    
    navigate(`/dashboard/${dashboardId}`);
   
  };

  const handleLogout = () => {
    localStorage.removeItem("LoggedInUser");
    setLoggedInUser(null);
    console.log("User Logged Out Successfully");
    navigate('/');
  };

  const isOwner = (dashboard) => {
    return loggedInUser && dashboard.user_id === loggedInUser.id;
  };

  return (
    <div className="parent-dashboard">
     
      <div className="dashboard-navbar">
        <div className="dashboard-title">
          <h2>Parent Dashboard</h2>
          <p>Welcome, {loggedInUser?.firstname} {loggedInUser?.secondname} !</p>
        </div>
        <div className="dashboard-controls">
          <button 
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
          <button 
            className="create-btn"
            onClick={() => setShowCreateForm(true)}
          >
            Create
          </button>
            <button 
              className="create-btn"
              onClick={() => setShowCalculator(true)}
            >
               Calculator
            </button>
        </div>
      </div>
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Dashboard</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ×
              </button>

            </div>
            <form onSubmit={handleCreateDashboard} className="create-form">
              <div className="form-group">
                <label>Dashboard Title:</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter dashboard title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Owner Email:</label>
                <input
                  type="email"
                  value={loggedInUser?.email || ''}
                  disabled
                  className="disabled-input"
                />
              </div>
              <div className="form-group">
                <label>Visibility:</label>
                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleInputChange}
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div className="form-buttons">
                <button type="submit" className="submit-btn">
                  Create Dashboard
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
     {showCalculator && (
  <Calculator showCalculator={showCalculator} setShowCalculator={setShowCalculator} />
)}
      <div className="dashboards-container">
        <div className="table-wrapper">
          <table className="dashboards-table">
            <thead>
              <tr>
                <th>Sr. No</th>
                <th>Owner Email</th>
                <th>Dashboard Title</th>
                <th>Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {childDashboards.length > 0 ? (
                childDashboards.map((dashboard, index) => (
                  <tr key={dashboard.id}>
                    <td>{index + 1}</td>
                    <td>{dashboard.owner_email}</td>
                    <td>{dashboard.title}</td>
                    <td>
                      <span className={`visibility-badge ${dashboard.visibility}`}>
                        {dashboard.visibility}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="view-btn"
                          onClick={() => handleViewDashboard(dashboard.id)}
                        >
                          View
                        </button>
                        {isOwner(dashboard) && (
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteDashboard(dashboard.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">
                    No dashboards found. Create your first dashboard!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}