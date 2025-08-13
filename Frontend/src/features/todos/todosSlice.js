// src/features/todos/todosSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  todoLists: [],
  title: '',
  description: '',
  goal: '',
  endDate: '',
  editingListId: null,
  editingTodoId: null,
  expandedTodoId: null,
  username: '',
};

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    setField: (state, action) => {
      state[action.payload.field] = action.payload.value;
    },
    loadTodos: (state, action) => {
      const { username } = action.payload;
      state.username = username;
      const stored = JSON.parse(localStorage.getItem('multiTodos')) || {};
      state.todoLists = stored[username] || [];
    },
    addTodoList: (state, action) => {
      const newList = {
        id: Date.now(),
        type: action.payload.type, 
        title: action.payload.title,
        todos: [],
      };
      state.todoLists.push(newList);
      localStorage.setItem(
        'multiTodos',
        JSON.stringify({ ...JSON.parse(localStorage.getItem('multiTodos') || '{}'), [state.username]: state.todoLists })
      );
    },
    deleteList: (state, action) => {
      state.todoLists = state.todoLists.filter(list => list.id !== action.payload);
      localStorage.setItem(
        'multiTodos',
        JSON.stringify({ ...JSON.parse(localStorage.getItem('multiTodos') || '{}'), [state.username]: state.todoLists })
      );
    },
    updateListTitle: (state, action) => {
      const { listId, newTitle } = action.payload;
      const list = state.todoLists.find(list => list.id === listId);
      if (list && newTitle.trim()) list.title = newTitle;
      localStorage.setItem(
        'multiTodos',
        JSON.stringify({ ...JSON.parse(localStorage.getItem('multiTodos') || '{}'), [state.username]: state.todoLists })
      );
    },
    addTodoToList: (state, action) => {
      const { listId, todo } = action.payload;
      const list = state.todoLists.find(list => list.id === listId);
      if (list) {
        list.todos.push({
          ...todo,
          id: Date.now(),
          completed: false,
        });
        localStorage.setItem(
          'multiTodos',
          JSON.stringify({ ...JSON.parse(localStorage.getItem('multiTodos') || '{}'), [state.username]: state.todoLists })
        );
      }
    },
    deleteTodo: (state, action) => {
      const { listId, todoId } = action.payload;
      const list = state.todoLists.find(list => list.id === listId);
      if (list) {
        list.todos = list.todos.filter(todo => todo.id !== todoId);
        localStorage.setItem(
          'multiTodos',
          JSON.stringify({ ...JSON.parse(localStorage.getItem('multiTodos') || '{}'), [state.username]: state.todoLists })
        );
      }
    },
    toggleComplete: (state, action) => {
      const { listId, todoId } = action.payload;
      const list = state.todoLists.find(list => list.id === listId);
      const todo = list?.todos.find(todo => todo.id === todoId);
      if (todo) {
        todo.completed = !todo.completed;
        localStorage.setItem(
          'multiTodos',
          JSON.stringify({ ...JSON.parse(localStorage.getItem('multiTodos') || '{}'), [state.username]: state.todoLists })
        );
      }
    },
    editTodo: (state, action) => {
      const { listId, todoId } = action.payload;
      const list = state.todoLists.find(list => list.id === listId);
      const todo = list?.todos.find(todo => todo.id === todoId);
      if (todo) {
        state.editingListId = listId;
        state.editingTodoId = todoId;
        state.title = todo.title;
        state.description = todo.description;
        state.goal = todo.goal;
        state.endDate = todo.endDate;
      }
    },
    updateTodo: (state, action) => {
      const { listId, todoId, updated } = action.payload;
      const list = state.todoLists.find(list => list.id === listId);
      const todo = list?.todos.find(todo => todo.id === todoId);
      if (todo) {
        todo.title = updated.title;
        todo.description = updated.description;
        todo.goal = updated.goal;
        todo.endDate = updated.endDate;
        state.editingTodoId = null;
        state.editingListId = null;
        state.title = '';
        state.description = '';
        state.goal = '';
        state.endDate = '';
        localStorage.setItem(
          'multiTodos',
          JSON.stringify({ ...JSON.parse(localStorage.getItem('multiTodos') || '{}'), [state.username]: state.todoLists })
        );
      }
    },
    cancelEditing: (state) => {
      state.editingTodoId = null;
      state.editingListId = null;
      state.title = '';
      state.description = '';
      state.goal = '';
      state.endDate = '';
    }
  },
});

export const {
  setField,
  loadTodos,
  addTodoList,
  deleteList,
  updateListTitle,
  addTodoToList,
  deleteTodo,
  toggleComplete,
  editTodo,
  updateTodo,
  cancelEditing,
} = todosSlice.actions;

export default todosSlice.reducer;
