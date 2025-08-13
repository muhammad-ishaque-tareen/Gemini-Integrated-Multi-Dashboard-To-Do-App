// features/users/usersSlice.js
import { createSlice, nanoid } from '@reduxjs/toolkit';

const usersSlice = createSlice({
  name: 'users',
  initialState: [],
  reducers: {
    registerUser: {
      reducer(state, action) {
        state.push(action.payload);
      },
      prepare({ username, email, password }) {
        return {
          payload: {
            id: nanoid(),
            username,
            email,
            password,
          },
        };
      },
    },
  },
});

export const { registerUser } = usersSlice.actions;
export default usersSlice.reducer;
