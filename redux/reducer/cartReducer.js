const { createSlice } = require("@reduxjs/toolkit");

const initialState = {
  books: [],
  count: 0,
};

export const cartReducer = createSlice({
  name: "cartStore",
  initialState,
  reducers: {

    addToCart: (state, action) => {
      const payload = action.payload;

      if (!payload?.bookId || !payload?.qty) return;

      const existingProduct = state.books.findIndex(
        (p) => p.bookId === payload.bookId
      );

      if (existingProduct === -1) {
        state.books.push(payload);
      } else {
        state.books[existingProduct].qty += payload.qty;
      }

      state.count = state.books.length;
    },

    increaseQuantity: (state, action) => {
      const payload = action.payload;


    },
    decreaseQuantity: (state, action) => {
      const payload = action.payload;

    },

    removeFromCart: (state, action) => {
      const bookId = action.payload;

      state.books = state.books.filter(
        (book) => book.bookId !== bookId
      );

      state.count = state.books.reduce(
        (total, item) => total + item.qty,
        0
      );
    },

    clearCart: (state, action) => {
      ((state.books = []), (state.count = 0));
    },
  },
});

export const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
} = cartReducer.actions;
export default cartReducer.reducer;
