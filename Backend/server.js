import express, { response } from 'express';
import cors from 'cors';
import mysql2, { createConnection } from 'mysql2';
import dotenv from 'dotenv';

import { GoogleGenerativeAI } from '@google/generative-ai'; 
dotenv.config();
// const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
app.use(express.json());
app.use(cors());

// DB Connection
const db = createConnection({
    host: "localhost",
    user: 'root',
    password: '',
    database: 'todo_app_db'
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to MySQL Database.");
  }
});

// Example test route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.post("/signup", (req, res) => {
  const { firstname, secondname, username, email, password } = req.body;
  const InsertQuery = `
        INSERT INTO users (firstname, secondname, username, email, password)
        VALUES (?, ?, ?, ?, ?)
      `;
  db.query(InsertQuery, [firstname, secondname, username, email, password], (err, result) => {
    if (err) console.log(err);
    return res.status(201).json({ message: 'User registered successfully' });
  });
});

app.post("/login", (req, res) => {
  const { username, email, password } = req.body;
  const SelectQuery = `SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?`;
  
  db.query(SelectQuery, [username, email, password], (err, result) => {
    if (err) {
      console.error("Database error:", err); 
      return res.status(500).json({ message: 'Database error' });
    }
    const user = result[0];
    return res.status(200).json({
      message: "Logged in Successfully",
      users: {
        id: user.id,
        firstname: user.firstname,
        secondname: user.secondname,
        username: user.username,
        email: user.email
      }
    });
  });
});

app.put('/forgetpassword',(req, res)=>
{

  const{email, newPassword, rePassword}=req.body;
 
  if(!email || !newPassword || !rePassword)
  {
    return res.status(400).json({message:'All fields are Require'});
  }
  if(newPassword !==rePassword)
  {
    return res.status(401).json({message: 'New Passwrod and Re Password does not match'});
  }
  const UpdateQuery = `UPDATE users SET password = ? WHERE email = ?`;
  
  db.query(UpdateQuery, [newPassword, email ],(err, result)=>{
   
     console.log('after db.query Run',err);
    if(err)
    {
      return res.status(500).json({message: 'Database Forget password error'});
    }
    else
    {
      return res.status(200).json({message:'Password Updated Successfully'});
    }

  });

});
app.get('/todolists/:UserId', (req, res) => {
  const userid = req.params.UserId;
  const dashboardId = req.query.dashboardId;
  
  let query = "SELECT * FROM todo_lists WHERE user_id = ?";
  let params = [userid];
  
  if (dashboardId) {
    query += " AND dashboard_id = ?";
    params.push(dashboardId);
  }
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Error fetching todo lists:", err);
      return res.status(500).json({message: "Database query failed"});
    }
    return res.status(200).json(result);
  });
});
app.get('/todos/:listId', (req, res) => {
  const listId = req.params.listId;
  
  const fetchTodosQuery = "SELECT * FROM todos WHERE list_id = ?";
  db.query(fetchTodosQuery, [listId], (err, result) => {
    if (err) {
      console.error("Error fetching todos:", err);
      return res.status(500).json({ message: "Database query failed" });
    }
    
    const todos = result.map(todo => ({
      ...todo,
      endDate: todo.end_date
    }));
    
    return res.status(200).json(todos);
  });
});
app.post('/addtodolist', (req, res)=>{
     const{title, user_id, username, dashboardId} =req.body;
     if(!dashboardId || !user_id || !title)
     {
      console.error("DashboardId, UserId and Title are necessary ");
      return res.status(400).json({message:"All Fields are required!"});
     }

     const GetDashboardOwnerQuery =`SELECT user_id FROM child_dashboards WHERE id=?`;
     db.query(GetDashboardOwnerQuery, [dashboardId], (err, DashboardOwner)=>
    {
      if(err)
      {
        console.error("Database error fetching dashboard owner for addtodolist:", err);
        return res.status(500).json({message:"Database Error Fetching UserId for Addtodolist Query"});
      }
      if(DashboardOwner.length===0 || DashboardOwner[0].user_id != user_id)
      {
        return res.status(403).json({message: "You do not have permission To Add a ToDo List to this Dashboard."});
      }
       const AddTodoListQuery= `INSERT INTO todo_lists(user_id, title , username, dashboard_id) VALUES(?,?,?, ?)`;
     db.query(AddTodoListQuery, [user_id, title, username, dashboardId], (err, result)=>
    {
      if(err)
      {
        return res.status(500).json({message:"Error in Database"});
      }

      const newTodoList =
       {
         id: result.insertId,
          user_id,
          title,
          username,
          dashboard_id:dashboardId
        };

         return res.status(201).json(newTodoList);

       });
    });

});

app.delete('/deletetodolist', (req, res) => {
    const { listId, userId } = req.body;
    if (!listId || !userId) {
        console.error("listId and userId are necessary");
        return res.status(400).json({ message: "All Fields are required!" });
    }
    const GetListOwnerQuery = `SELECT user_id FROM todo_lists WHERE id = ?`;
    db.query(GetListOwnerQuery, [listId], (err, ListOwner) => {
        if (err) {
            console.error("Database error fetching list owner for deletetodolist:", err);
            return res.status(500).json({ message: "Database Error Fetching UserId for Deletetodolist Query" });
        }
        if (ListOwner.length === 0 || ListOwner[0].user_id != userId) {
            return res.status(403).json({ message: "You do not have permission to delete this ToDo List." });
        }
        const deleteTodosQuery = `DELETE FROM todos WHERE list_id = ?`;
        db.query(deleteTodosQuery, [listId], (err, result) => {
            if (err) {
                console.error("Error deleting todos:", err);
                return res.status(500).json({ message: "Failed to delete todos" });
            }

            const DeleteListQuery = `DELETE FROM todo_lists WHERE id = ?`;
            db.query(DeleteListQuery, [listId], (err, result) => {
                if (err) {
                    console.error("Error deleting list:", err);
                    return res.status(500).json({ message: "Failed to delete list" });
                }
                return res.status(200).json({ message: "List deleted successfully" });
            });
        });
    });
});
app.post('/updatelistTitle', (req, res) => {
    const { listId, newTitle, userId } = req.body;

    // 1. Validate that all required fields are present
    if (!listId || !newTitle || !userId) {
        console.error("listId, newTitle, and userId are necessary");
        return res.status(400).json({ message: "All fields are required!" });
    }

    // 2. Query the database to check if the user is the list owner
    const GetListOwnerQuery = `SELECT user_id FROM todo_lists WHERE id = ?`;
    db.query(GetListOwnerQuery, [listId], (err, ListOwner) => {
        if (err) {
            console.error("Database error fetching list owner for updatelistTitle:", err);
            return res.status(500).json({ message: "Database Error Fetching UserId for Update List Title Query" });
        }

        // 3. Check for authorization
        if (ListOwner.length === 0 || ListOwner[0].user_id != userId) {
            return res.status(403).json({ message: "You do not have permission to update this ToDo List." });
        }

        // 4. If the user is authorized, proceed with the update
        const UpdateTodoListTiltleQuery = `UPDATE todo_lists SET title=? WHERE id =?`;
        db.query(UpdateTodoListTiltleQuery, [newTitle, listId], (err, result) => {
            if (err) {
                console.error("Error While Running db query in updatetodoListTile", err);
                return res.status(500).json({ message: "Database Error in Update Todo List Title" });
            } else {
                return res.status(200).json({ listId, updatedTitle: newTitle });
            }
        });
    });
});
app.post('/SaveTodoToList', (req, res)=>
{
  const { listId, title, description, goal, endDate, completed, expanded } = req.body;

const values = [listId, title, description, goal, endDate, completed, expanded];

  const SaveTodoToListQuery = `
INSERT INTO todos ( list_id, title, description, goal, end_date, completed, expanded) 
VALUES (?, ?, ?, ?, ?, ?, ?)
`;

 db.query(SaveTodoToListQuery, values, (err, Result)=>
{
  if(err)
  {
    console.error("Error in Running db Query:", err);
    return res.status(500).json({message:"Database Errors in Saving Todo To List"});
  }
const savedTodo = {
      id: Result.insertId, 
      title,
      description,
      goal,
      endDate,
      completed,
      expanded,
      listId
    };

    return res.status(200).json(savedTodo);
  

});

});

app.post('/UpdateTodo', (req, res)=>
{
  
  const { listId,todoId, title, description,  goal,endDate, completed, expanded}=req.body;

  const UpdateTodoQuery = `UPDATE todos SET title=?, description=?, goal=?, end_date=?, completed=?, expanded=? WHERE id=? AND list_id=?`;

  db.query(UpdateTodoQuery, [title, description, goal, endDate, completed,expanded, todoId, listId], (err, result) =>
  {
    if(err)
    {
      console.error("Error While Updating Todo: ", err);
      return res.status(500).json({message: "Error In Database During Updating Todo"});
    }
    else
    {
      return res.status(200).json("Todo Updated Successfully");
    }

  });

});


app.delete('/DeleteTodo', (req, res)=>
{
  const {todoId, listId} = req.body;
  const DeleteTodoQuery = `DELETE FROM todos WHERE id=? AND list_id=?`;
  db.query(DeleteTodoQuery, [todoId, listId],(err, result)=>
  {
    if(err)
    {
      console.error("Error While Delete Todo Query", err);
      return res.status(500).json({message: "Database Error in Deleting Todo"});

    }
    return res.status(200).json({message: "Todo Deleted Successfully"});
  });
});

app.post('/addgemini', (req, res)=>
{

  const { userId, Title, Response, dashboardId}= req.body;
    
      if( !Title || !Response || !dashboardId)
      {
        console.error("All Fields are Required");
        return res.status(400).json({message: "Bad Request All fields are Required."});

      }

      const CheckGeminiWidgetOwner= `SELECT user_id FROM child_dashboards WHERE id=?`;
      db.query(CheckGeminiWidgetOwner, [dashboardId], (err, OwnerResult)=>
      {
        if(err)
        {
          return res.status(500).json({message: "Database Error in Fetching Owner of the Dashboard!"});
        }
        if(OwnerResult.length === 0 || OwnerResult[0].user_id!=userId)
        {
          return res.status(403).json({message: "You don't have permission to Add Gemini Widget."});
        }
        const AddGeminiWidget = `INSERT INTO gemini_table(user_id, title, response, dashboard_id) VALUES (?,?,?,?)`;
        const values =[userId, Title, Response, dashboardId];
        db.query(AddGeminiWidget, values , (err, result)=>
         {
          if(err)
          {
             console.error("Error While Adding the Gemini Wdiget to Database: ", err);
             return res.status(500).json({message : "Database Error During Adding new Gemini Widget!"});
          }
          
          const newGeminiWidget =
          {
            id:result.insertId,
            user_id:userId,
            title:Title,
            response:Response,
            dashboard_id:dashboardId
          };
          return res.status(201).json(newGeminiWidget);
     });  
  });
});
app.get('/geminiwidgets/:UserId', (req, res)=>
{
  const userid=req.params.UserId;
  
  const FetchGeminiWidgets="SELECT * From gemini_table WHERE user_id=?";
  db.query(FetchGeminiWidgets, [userid],(err, result)=>
  {
    if (err)
    {
      console.error("The Fetch Gemini Widgets error : ", err);
      return res.status(500).json({message:"Database Query failed during fetching Gemini Widgets."});
    }
    else
    {
      return res.status(200).json(result);
    }

  });

});

app.delete('/DeleteGeminiWidget', (req, res) => {
    const { WidgetId, userId } = req.body;

    // 1. Validate that both the WidgetId and userId are present
    if (!WidgetId || !userId) {
        console.error("WidgetId and userId are necessary");
        return res.status(400).json({ message: "All Fields are required!" });
    }

    // 2. Query the database to get the owner's ID
    const GetWidgetOwnerQuery = `SELECT user_id FROM gemini_table WHERE id = ?`;
    db.query(GetWidgetOwnerQuery, [WidgetId], (err, WidgetOwner) => {
        if (err) {
            console.error("Database error fetching widget owner for DeleteGeminiWidget:", err);
            return res.status(500).json({ message: "Database Error Fetching UserId for Widget Deletion Query" });
        }

        // 3. Check for authorization
        // The widget doesn't exist (length === 0) or the user IDs don't match
        if (WidgetOwner.length === 0 || WidgetOwner[0].user_id !== userId) {
            return res.status(403).json({ message: "You do not have permission to delete this widget." });
        }

        // 4. If the user is authorized, proceed with the deletion
        const DeleteGeminiWidgetQuery = `DELETE FROM gemini_table WHERE id = ?`;
        db.query(DeleteGeminiWidgetQuery, [WidgetId], (err, result) => {
            if (err) {
                console.error("The Error in Deleting Gemini Widget:", err);
                return res.status(500).json({ message: "The Error in Database while Executing database Query" });
            }

            if (result.affectedRows > 0) {
                return res.status(200).json({ message: "The Gemini Widget Deleted Successfully" });
            } else {
                return res.status(404).json({ message: "Widget not found" });
            }
        });
    });
});
app.post('/gemini/search', async(req, res)=>
{
  const {query, userId,  widgetId } = req.body;
  let geminiResponseText=" ";
  
  try
  {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });
    const result = await model.generateContent(query);
    const response = result.response; 
    geminiResponseText = response.text();
    const UpdateGeminiResponse =  `UPDATE gemini_table SET response=? WHERE id=? AND user_id=?`;
    db.query(UpdateGeminiResponse, [geminiResponseText,  widgetId, userId], (err, result)=>
    {
      if(err)
      {
        console.error("Error in Updating gemini table to set new response: ", err);
        return res.status(500).json({message: "Database Error in Updating Gemini Table"});
      }
      return res.status(200).json({
                success: true,
                geminiresponse: geminiResponseText,
                message: "Gemini response saved and sent successfully."
            });

    });
  }
  catch(err)
  {
    console.log(err);
  }


});
app.get('/user-details/:userId', (req, res)=>
{
  const userId= req.params.userId;
  const getUserData= `SELECT id, firstname, secondname, username, email FROM users WHERE id=?`;
  db.query(getUserData, [userId], (err, result)=>
  {
    if(err)
    {
      console.error("Fails to Run The get user details Query", err);
      return res.status(500).json({message: 'Internal Server Error in Geting user Details'});
    }
    if(result.length>0)
    if(result.length>0)
    {
       return res.status(200).json({user:result[0]}); 
    }
    else
    {
      return res.status(404).json({message: "User Not Found"});
    }

  });

});

app.post('/createnewdashboard', (req, res)=>
{
  const {userId, owneremail, Title, visibility}= req.body;
  const InsertIntoChildDashboard = `INSERT INTO child_dashboards(user_id, owner_email, title, visibility ) VALUES (?,?,?,?)`;
  db.query(InsertIntoChildDashboard, [userId, owneremail, Title, visibility], (err, result)=>
  {
    if(err)
    {
      console.error("Error Occured During Creating New Child Dashboard", err);
      return res.status(500).json({message: "Database Error During Creating Child Dashboard. "});
    }
    if (result.affectedRows>0)
    {
      const newDashboard =
      {
        id:result.insertId,
        user_id:userId,
        owner_email: owneremail,
        title: Title,
        visibility: visibility,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '), 
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
      console.log("Child Dashboard Created Successfully");
      return res.status(201).json(newDashboard);
    }
    else
    {
      return res.status(500).json({messaage: 'Failed to create Dashboard(No rows affected)'});
    }

  });

});
app.get('/dashboard/:userId', (req, res) => {
    const userId = req.params.userId;

    const ShowAllChildDashboard = `SELECT id, user_id, owner_email, title, visibility, created_at, updated_at FROM child_dashboards WHERE user_id = ? OR (visibility = 'public' AND user_id != ?)`;

    db.query(ShowAllChildDashboard, [userId, userId], (err, dashboards) => {
        if (err) {
            console.error("Error fetching child dashboards:", err);
            return res.status(500).json({ message: "Database error while fetching dashboards." });
        }

        if (dashboards.length === 0) {
            return res.status(200).json([]);
        }

        const dashboardIds = dashboards.map(dashboard => dashboard.id);
        const getTodoListsQuery = `SELECT id, user_id, title, username, dashboard_id FROM todo_lists WHERE dashboard_id IN (${dashboardIds.map(() => '?').join(',')})`;
        
        db.query(getTodoListsQuery, dashboardIds, (err, todolists) => {
            if (err) {
                console.error("Error in fetching todo lists for dashboards:", err);
                return res.status(500).json({ message: "Database Error in Fetching Todolists" });
            }

            const getGeminiWidgetQuery = `SELECT id, user_id, title, response, dashboard_id FROM gemini_table WHERE dashboard_id IN (${dashboardIds.map(() => '?').join(',')})`;
            
            db.query(getGeminiWidgetQuery, dashboardIds, (err, geminiWidgets) => {
                if (err) {
                    console.error("Failed to Fetch Gemini Widget:", err);
                    return res.status(500).json({ message: "Database Error in fetching Gemini Widgets" });
                }

                if (todolists && todolists.length > 0) {
                    const TodoListIds = todolists.map(todolist => todolist.id);
                    const getTodosQuery = `SELECT * FROM todos WHERE list_id IN (${TodoListIds.map(() => '?').join(',')})`;
                    
                    db.query(getTodosQuery, TodoListIds, (err, todosresult) => {
                        if (err) {
                            console.error("Error While Fetching Todos for Dashboards:", err);
                            return res.status(500).json({ message: "Database Error in Fetching Todos for Dashboard." });
                        }

                        const Result = dashboards.map(dashboard => ({
                            ...dashboard,
                            isOwner: dashboard.user_id === parseInt(userId),
                            todolists: todolists
                                .filter(list => list.dashboard_id === dashboard.id)
                                .map(list => ({
                                    ...list,
                                    todos: todosresult
                                        .filter(todo => todo.list_id === list.id)
                                        .map(todo => ({
                                            ...todo,
                                            endDate: todo.end_date
                                        }))
                                })),
                            geminiWidgets: geminiWidgets.filter(widget => widget.dashboard_id === dashboard.id)
                        }));

                        return res.status(200).json(Result);
                    });
                } else {
                    // No todo lists found, return dashboards with empty todo lists but with gemini widgets
                    const Result = dashboards.map(dashboard => ({
                        ...dashboard,
                        isOwner: dashboard.user_id === parseInt(userId),
                        todolists: [],
                        geminiWidgets: geminiWidgets.filter(widget => widget.dashboard_id === dashboard.id)
                    }));
                    
                    return res.status(200).json(Result);
                }
            });
        });
    });
});



app.delete('/deletedashboard', (req, res)=>
{
  const{dashboardId, userId} = req.body;
  const DeleteDashboardQuery=   `DELETE FROM child_dashboards WHERE id=? AND user_id=?`;
  db.query(DeleteDashboardQuery, [dashboardId,userId], (err, result)=>
  {
    if(err)
    {
      console.error("Failed to Delete Dashboard.", err);
      return res.status(500).json({message:'Database Error in Deleting the Child Dashboard.'});
    }
    if( result.affectedRows>0)
    {
      console.log("Successfully Deleted The Child Dashboard.");
      return res.status(200).json({message: "The Dashboard Deleted Successfully."});

    }
    else
    {
      return res.status(404).json({message:"Dashboard Does not found or The user does not have permission to delete."});
    }
  });
});
app.get('/geminiwidgets/:UserId', (req, res) => {
  const userid = req.params.UserId;
  const dashboardId = req.query.dashboardId;
  
  let query = "SELECT * FROM gemini_table WHERE user_id = ?";
  let params = [userid];
  
  if (dashboardId) {
    query += " AND dashboard_id = ?";
    params.push(dashboardId);
  }
  
  db.query(query, params, (err, result) => {
    if (err) {
      console.error("Error fetching Gemini Widgets:", err);
      return res.status(500).json({message: "Database query failed"});
    }
    return res.status(200).json(result);
  });
});
// Add this new endpoint to your backend
app.get('/dashboard-info/:dashboardId', (req, res) => {
  const dashboardId = req.params.dashboardId;
  
  const getDashboardInfo = `SELECT * FROM child_dashboards WHERE id = ?`;
  
  db.query(getDashboardInfo, [dashboardId], (err, result) => {
    if (err) {
      console.error("Error fetching dashboard info:", err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (result.length === 0) {
      return res.status(404).json({ message: "Dashboard not found" });
    }
    
    return res.status(200).json(result[0]);
  });
});
const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});