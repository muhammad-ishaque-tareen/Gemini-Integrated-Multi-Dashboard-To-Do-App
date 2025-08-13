// Dashboard.jsx

import axios from 'axios';
import * as React from 'react';
import { useState, useRef, useEffect } from 'react'
import { Plus, Edit2, Trash2, Check, X, Search, Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {

    const { dashboardId: urlDashboardId } = useParams();
    const navigate = useNavigate();

    const [todoLists, setTodoLists] = useState([]);
    const [user, setUser] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [editingListId, setEditingListId] = useState(null);
    const [editingTodoId, setEditingTodoId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [addingTodoToList, setAddingTodoToList] = useState(null);
    const [query, setQuery] = useState('');
    const [isLoading, setLoading] = useState(false);
    const [geminiWidgets, setGeminiWidgets] = useState([]);
    const [dashboardId, setDashboardId] = useState(null);
    const [dashboardInfo, setDashboardInfo] = useState(null);
    const [isOwner, setIsOwner] = useState(false);
    const [geminiresponse, setGeminiResponse] = useState('');


    useEffect(() => {
        if (urlDashboardId) {
            setDashboardId(urlDashboardId);
        }
    }, [urlDashboardId]);

    useEffect(() => {
        const storedUser = localStorage.getItem("LoggedInUser");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/');
        }
    }, [navigate]);

    const [editTodoForm, setEditTodoForm] = useState(
        {
            title: '',
            description: '',
            goal: '',
            endDate: '',
        }
    );

    const [newTodoForm, setNewTodoForm] = useState(
        {
            title: '',
            description: '',
            goal: '',
            endDate: ''
        }
    );

    const sidebarRef = useRef(null);
    const dropdownRef = useRef(null);

    // Main useEffect for fetching dashboard info and todo lists
    useEffect(() => {
        const fetchDashboardContent = async () => {
            if (!dashboardId || !user?.id) return;

            setLoading(true);
            try {
                const dashboardResponse = await axios.get(`http://localhost:3000/dashboard-info/${dashboardId}`);
                const dashboardData = dashboardResponse.data;
                if (!dashboardData) {
                    alert('Dashboard not found');
                    navigate('/parent-dashboard');
                    return;
                }

                const isDashboardPrivate = dashboardData.visibility === 'private';
                const isUserOwner = dashboardData.user_id === user.id;

                if (isDashboardPrivate && !isUserOwner) {
                    alert('You do not have permission to view this dashboard');
                    navigate('/parent-dashboard');
                    return;
                }

                setDashboardInfo(dashboardData);
                setIsOwner(isUserOwner);

                // FIX: Use dashboardData.user_id to fetch the todo lists
                const TodoListResponse = await axios.get(`http://localhost:3000/todolists/${dashboardData.user_id}?dashboardId=${dashboardId}`);
                const lists = TodoListResponse.data;

                const listsWithTodos = await Promise.all(
                    lists.map(async (list) => {
                        try {
                            const todosResponse = await axios.get(`http://localhost:3000/todos/${list.id}`);
                            return { ...list, todos: todosResponse.data || [] };
                        } catch (err) {
                            console.error(`Error fetching todos for list ${list.id}:`, err);
                            return { ...list, todos: [] };
                        }
                    })
                );

                setTodoLists(listsWithTodos);

            } catch (err) {
                console.error('Error fetching dashboard content:', err);
                if (err.response?.status === 404) {
                    alert('Dashboard not found');
                    navigate('/parent-dashboard');
                } else if (err.response?.status === 403) {
                    alert('You do not have permission to view this dashboard');
                    navigate('/parent-dashboard');
                }
            } finally {
                setLoading(false);
            }
        };

        if (dashboardId && user?.id) {
            fetchDashboardContent();
        }
    }, [dashboardId, user?.id, navigate]);

    // Second useEffect for fetching Gemini widgets
    useEffect(() => {
        const fetchGeminiWidgets = async () => {
            if (!dashboardId || !dashboardInfo?.user_id) return; // Wait for dashboardInfo to be available

            try {
                // FIX: Use dashboardInfo.user_id to fetch the Gemini widgets
                const response = await axios.get(`http://localhost:3000/geminiwidgets/${dashboardInfo.user_id}?dashboardId=${dashboardId}`);
                setGeminiWidgets(response.data);
            } catch (err) {
                console.error("Error while fetching Gemini Widgets", err);
                setGeminiWidgets([]);
            }
        };

        if (dashboardId && dashboardInfo?.user_id) { // Only run after dashboardInfo is set
            fetchGeminiWidgets();
        }
    }, [dashboardId, dashboardInfo?.user_id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                sidebarRef.current &&
                !sidebarRef.current.contains(event.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {

            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ... (rest of the functions remain unchanged)

    const handleNewTodoFormChange = (e) => {
        setNewTodoForm(
            {
                ...newTodoForm,
                [e.target.name]: e.target.value
            }
        );
    };

    const handleEditTodoFormChange = (e) => {
        setEditTodoForm(
            {
                ...editTodoForm,
                [e.target.name]: e.target.value
            }
        );
    };

    const AddNewGeminiWidget = async () => {

        try {
            const result = await axios.post('http://localhost:3000/addgemini', {
                Title: 'Gemini Widget',
                userId: user.id,
                Response: ' By Defualt Text',
                dashboardId: dashboardId
            });
            if (result && result.status === 200) {
                console.log("New Gemini Wdiget Added Successfully");
            }
            setGeminiWidgets(prevWidgets => [...prevWidgets, result.data]);
        }
        catch (err) {
            console.error("Failed to Add New Gemini Widget To Database", err);
        }
    };

    const addNewTodoList = async () => {
        const newListData =
        {
            title: 'New Todo List',
            user_id: user.id,
            username: user.firstname + ' ' + user.secondname,
            dashboardId: dashboardId
        };
        try {
            const response = await axios.post('http://localhost:3000/addtodolist', newListData);
            const newList = {
                ...response.data,
                todos: []
            };
            setTodoLists([...todoLists, newList]);
        }
        catch (err) {
            console.error(err);
        }

    };

    const deleteList = async (listId, userId) => {
        try {
            const response = await axios.delete('http://localhost:3000/deletetodolist', {
                data: { listId, userId }
            });
            setTodoLists(todoLists.filter(list => list.id !== listId));
        } catch (err) {
            console.error("Delete List Error ", err);
        }
    };

    const deleteGeminiWidget = async (WidgetId, userId) => {
        try {
            const response = await axios.delete('http://localhost:3000/DeleteGeminiWidget', {
                data: { WidgetId, userId }
            });
            setGeminiWidgets(geminiWidgets.filter(widget => widget.id !== WidgetId));
        } catch (err) {
            console.error("Delete Gemini Widget Error ", err);
        }
    };


    const startAddingTodo = (listId) => {
        setAddingTodoToList(listId);
        setNewTodoForm({
            title: '',
            description: '',
            goal: '',
            endDate: ''
        });
    };

    const saveTodoToList = async (listId) => {
        if (!listId) {
            console.error("Error: listId is missing when trying to save a todo.");
            return;
        }

        try {
            if (newTodoForm.title.trim() && newTodoForm.description.trim()) {
                const newTodo = {
                    title: newTodoForm.title.trim(),
                    description: newTodoForm.description.trim(),
                    goal: newTodoForm.goal.trim(),
                    endDate: newTodoForm.endDate,
                    completed: false
                };
                console.log("Sending Todo:", { listId, ...newTodo });
                const response = await axios.post('http://localhost:3000/SaveTodoToList', {
                    listId,
                    ...newTodo
                });
                const savedTodo = response.data;
                setTodoLists(prev =>
                    prev.map(list =>
                        list.id === listId
                            ? { ...list, todos: [...list.todos, savedTodo] }
                            : list
                    )
                );
            }
            setAddingTodoToList(null);
            setNewTodoForm({
                title: '',
                description: '',
                goal: '',
                endDate: ''
            });
        }
        catch (err) {
            console.error("Error while saving ToDo to List:", err);
        }
    };

    const cancelAddingTodo = () => {
        setAddingTodoToList(null);
        setNewTodoForm(
            {
                title: '',
                description: '',
                goal: '',
                endDate: ''
            }
        );
    };

    const updateTodo = async (listId, todoId, title, description, goal, endDate, completed, expanded) => {
        try {
            const response = await axios.post('http://localhost:3000/UpdateTodo',
                {
                    listId,
                    todoId,
                    title,
                    description,
                    goal,
                    endDate,
                    completed,
                    expanded
                });
            if (response) {
                const updatedDataForState = {
                    title,
                    description,
                    goal,
                    endDate,
                    completed,
                    expanded
                };
                setTodoLists(todoLists.map(list =>
                    list.id === listId ?
                        {
                            ...list,
                            todos: list.todos.map(todo =>
                                todo.id === todoId ? { ...todo, ...updatedDataForState } : todo
                            )
                        } : list
                ));
                return true;
            }
            return false;
        }
        catch (err) {
            console.error("Error During Update Todo", err);
        }
    };

    const deleteTodo = async (listId, todoId) => {
        try {
            const responst = await axios.delete('http://localhost:3000/DeleteTodo',
                {
                    data: { listId, todoId }
                }
            );
            setTodoLists(todoLists.map(list =>
                list.id === listId
                    ? { ...list, todos: list.todos.filter(todo => todo.id !== todoId) }
                    : list
            ));

        }
        catch (err) {
            console.error("Error deleting todo:", err);
        }
    };

    const startEditingTodo = (todo) => {
        setEditingTodoId(todo.id);
        setEditTodoForm({
            title: todo.title,
            description: todo.description,
            goal: todo.goal,
            endDate: todo.endDate
        });
    };

    const saveEditedTodo = async (listId, todoId) => {

        try {
            if (!editTodoForm.title.trim() || !editTodoForm.description.trim() || !editTodoForm.goal.trim() || !editTodoForm.endDate) {
                console.warn("Cannot save edited todo: All fields are required.");
                return;
            }
            const CurrentTodo = todoLists
                .find(list => list.id === listId)?.todos
                .find(todo => todo.id === todoId);
            if (!CurrentTodo) {
                console.error("Todo To Be Edited is not found in the state.");
                return;
            }
            const Success = await updateTodo(
                listId,
                todoId,
                editTodoForm.title.trim(),
                editTodoForm.description.trim(),
                editTodoForm.goal.trim(),
                editTodoForm.endDate,
                CurrentTodo.completed,
                CurrentTodo.expanded
            );
            if (Success) {
                setEditingTodoId(null);
                setEditTodoForm({
                    title: '',
                    description: '',
                    goal: '',
                    endDate: ''
                });
            }
        }
        catch (err) {
            console.error("Error while saving Edited Todo", err);
        }
    };

    const cancelEditingTodo = () => {
        setEditingTodoId(null);
        setEditTodoForm({
            title: '',
            description: '',
            goal: '',
            endDate: ''
        });
    };

    const startEditingList = (id, currentValue) => {
        setEditingListId(id);
        setEditValue(currentValue);
    };

    const saveEditedList = async () => {
        try {
            const response = await axios.post('http://localhost:3000/updatelistTitle', {
                listId: editingListId,
                newTitle: editValue.trim(),
            });
            if (response.status === 200) {
                console.log("List title updated");
            }
            setEditingListId(null);
            setEditValue('');
        } catch (error) {
            console.error("Error updating list title:", error);
        }
    };

    const cancelEditingList = () => {
        setEditingListId(null);
        setEditValue('');
    };

    const toggleTodoExpanded = (listId, todoId) => {
        setTodoLists(todoLists.map(list =>
            list.id === listId
                ? {
                    ...list,
                    todos: list.todos.map(todo =>
                        todo.id === todoId
                            ? { ...todo, expanded: !todo.expanded }
                            : todo
                    )
                }
                : list
        ));
    };

    const handleSearch = async (e, widgetId) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setGeminiWidgets(prevWidgets =>
            prevWidgets.map(widget =>
                widget.id === widgetId ? { ...widget, geminiresponse: 'Searching...' } : widget
            )
        );
        try {
            const result = await axios.post('http://localhost:3000/gemini/search',
                {
                    query: query.trim(),
                    userId: user.id,
                    widgetId: widgetId
                });
            if (result.data.success) {
                setGeminiWidgets(prevWidgets =>
                    prevWidgets.map(widget =>
                        widget.id === widgetId
                            ? { ...widget, geminiresponse: result.data.geminiresponse }
                            : widget
                    )
                );
                setQuery(' ');
                setLoading(false);
            }
            else {
                console.error('Search Error:', result.data.message);
                setGeminiWidgets(prevWidgets =>
                    prevWidgets.map(widget =>
                        widget.id === widgetId ? { ...widget, geminiresponse: `Error: ${result.data.message}` } : widget
                    )
                );
            }
        }
        catch (err) {
            console.error('Search Error:', err);
            setGeminiResponse('Sorry, there was an error processing your request.');
        }
    };

    return (
        <div className="page-container">
            {isOwner && (
                <div className="menu-button-container" ref={dropdownRef}>
                    <div className="menu-buttons">
                        <button onClick={() => setShowSidebar(!showSidebar)} className="menu-button">
                            <span>Add</span>
                        </button>
                    </div>

                    {showSidebar && (
                        <>
                            <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} />
                            <div className="sidebar-content" ref={sidebarRef}>
                                <div className="sidebar-header">
                                    <button onClick={() => setShowSidebar(false)} className="close-button">
                                        <span>Close</span>
                                    </button>
                                </div>

                                <button onClick={addNewTodoList} className="sidebar-button">
                                    <span>Add Todo List</span>
                                </button>

                                <button onClick={AddNewGeminiWidget} className="sidebar-button">
                                    <span>Add Gemini</span>
                                </button>

                                <button
                                    onClick={() => {
                                        console.log("Add Youtube Widget");
                                        setShowSidebar(false);
                                    }}
                                    className="sidebar-button"
                                >
                                    <span>YouTube</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="main-content">
                <div className="header-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 className="header-title">
                                {dashboardInfo?.title || 'Dashboard'}
                                {!isOwner && <span className="read-only-badge">Read Only</span>}
                            </h1>
                            <p className="header-subtitle">
                                {isOwner
                                    ? `Welcome, ${user?.firstname} ${user?.secondname} - Manage your todos and tasks`
                                    : `Viewing ${dashboardInfo?.owner_email}'s dashboard`
                                }
                            </p>
                        </div>
                        <button onClick={() => navigate('/parentdashboard')} className="back-button">
                            Back
                        </button>
                    </div>
                </div>

                <div className="todo-lists-grid">
                    {geminiWidgets.map((widget) => (
                        <div key={widget.id} className="gemini-widget">
                            <div className="gemini-header">
                                <h3 className="gemini-title">Gemini Widget</h3>
                                {isOwner && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => deleteGeminiWidget(widget.id)} className="delete-button">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {widget.response && (
                                <div className="response-container">
                                    <div className="response-content">{widget.response}</div>
                                </div>
                            )}

                            <div className="gemini-content">
                                <form onSubmit={(e) => handleSearch(e, widget.id)} className="search-form">
                                    <div className="search-input-container">
                                        <input
                                            type="text"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Search From Gemini"
                                            disabled={isLoading || !isOwner}
                                            className="search-input"
                                        />
                                        {isOwner && (
                                            <button
                                                type="submit"
                                                className="search-gemini-button"
                                                disabled={isLoading || !query.trim()}
                                            >
                                                {isLoading ? <Loader2 size={16} className="spinning" /> : <Search size={16} />}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    ))}
                    {todoLists.map((list) => (
                        <div key={list.id} className="todo-list-container">
                            <div className="widget-header">
                                <div style={{ flex: 1 }}>
                                    {editingListId === list.id && isOwner ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="edit-input"
                                                onKeyPress={(e) => e.key === 'Enter' && updateListTitle(list.id, editValue)}
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => updateListTitle(list.id, editValue)}
                                                className="save-button"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button onClick={cancelEditingList} className="cancel-button">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <h3 className="list-title">📋 {list.title}</h3>
                                            <p className="list-item-count">{list.todos.length} items</p>
                                        </>
                                    )}
                                </div>
                                {isOwner && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => startEditingList(list.id, list.title)} className="edit-button">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => deleteList(list.id)} className="delete-button">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="todo-items-container">
                                {list.todos.map((todo) => (
                                    <div key={todo.id} className="todo-item">
                                        {editingTodoId !== todo.id && (
                                            <div className="todo-header">
                                                <div
                                                    className={`todo-title ${todo.completed ? 'completed' : 'incomplete'}`}
                                                    onClick={() => toggleTodoExpanded(list.id, todo.id)}
                                                >
                                                    {todo.title}
                                                </div>
                                                {isOwner && (
                                                    <div className="todo-actions">
                                                        <button onClick={() => startEditingTodo(todo)} className="edit-button">
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button onClick={() => deleteTodo(list.id, todo.id)} className="delete-button">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {todo.expanded && editingTodoId !== todo.id && (
                                            <div className="todo-details">
                                                {todo.description && (
                                                    <p style={{ margin: '4px 0' }}>
                                                        <strong>Description:</strong> {todo.description}
                                                    </p>
                                                )}
                                                {todo.endDate && (
                                                    <p style={{ margin: '4px 0' }}>
                                                        <strong>End Date:</strong> {todo.endDate}
                                                    </p>
                                                )}
                                                {todo.goal && (
                                                    <p style={{ margin: '4px 0' }}>
                                                        <strong>Goal:</strong> {todo.goal}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        {editingTodoId === todo.id && isOwner && (
                                            <div className="edit-todo-form">
                                                <input
                                                    type="text"
                                                    name="title"
                                                    value={editTodoForm.title}
                                                    onChange={handleEditTodoFormChange}
                                                    placeholder="Todo title"
                                                    className="form-input"
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    value={editTodoForm.description}
                                                    name="description"
                                                    onChange={handleEditTodoFormChange}
                                                    placeholder="Description"
                                                    className="form-input"
                                                    required
                                                />
                                                <input
                                                    type="date"
                                                    name="endDate"
                                                    value={editTodoForm.endDate ? editTodoForm.endDate.split('T')[0] : ''}
                                                    onChange={handleEditTodoFormChange}
                                                    placeholder="End Date"
                                                    className="form-input"
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    value={editTodoForm.goal}
                                                    name="goal"
                                                    onChange={handleEditTodoFormChange}
                                                    placeholder="Goal"
                                                    className="form-input"
                                                    required
                                                />
                                                <div className="form-buttons">
                                                    <button onClick={() => saveEditedTodo(list.id, todo.id)} className="add-todo-button">
                                                        Save
                                                    </button>
                                                    <button onClick={cancelEditingTodo} className="cancel-form-button">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isOwner && addingTodoToList !== list.id && (
                                    <button onClick={() => startAddingTodo(list.id)} className="add-todo-container">
                                        <Plus size={20} />
                                    </button>
                                )}
                                {isOwner && addingTodoToList === list.id && (
                                    <div className="add-todo-form">
                                        <input
                                            name="title"
                                            value={newTodoForm.title}
                                            onChange={handleNewTodoFormChange}
                                            placeholder="Todo Title"
                                            className="form-input"
                                            required
                                        />
                                        <input
                                            name="description"
                                            value={newTodoForm.description}
                                            onChange={handleNewTodoFormChange}
                                            placeholder="Description"
                                            className="form-input"
                                            required
                                        />
                                        <input
                                            name="endDate"
                                            type="date"
                                            value={newTodoForm.endDate ? newTodoForm.endDate.split('T')[0] : ''}
                                            onChange={handleNewTodoFormChange}
                                            className="form-input"
                                            required
                                        />
                                        <input
                                            name="goal"
                                            value={newTodoForm.goal}
                                            onChange={handleNewTodoFormChange}
                                            placeholder="Goal"
                                            className="form-input"
                                        />
                                        <div className="form-buttons">
                                            <button onClick={() => saveTodoToList(list.id)} className="add-todo-button">
                                                Save
                                            </button>
                                            <button onClick={cancelAddingTodo} className="cancel-form-button">
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;