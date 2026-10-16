import { configureStore, createSlice } from '@reduxjs/toolkit';

// UI state: mobile menu and the sticky "Order on app" bar.
const uiSlice = createSlice({
  name: 'ui',
  initialState: { menuOpen: false, stickyBarVisible: true },
  reducers: {
    toggleMenu: (s) => {
      s.menuOpen = !s.menuOpen;
    },
    closeMenu: (s) => {
      s.menuOpen = false;
    },
    hideStickyBar: (s) => {
      s.stickyBarVisible = false;
    },
  },
});

// Delete-account request form. Nothing is sent to a server: on submit the
// page opens the visitor's email app with a pre-filled request (see
// DeleteAccount.jsx), so `status` only tracks the form flow.
const deletionSlice = createSlice({
  name: 'deletion',
  initialState: { name: '', phone: '', email: '', reason: '', confirmed: false, status: 'idle' },
  reducers: {
    setField: (s, { payload }) => {
      s[payload.field] = payload.value;
    },
    markPrepared: (s) => {
      s.status = 'prepared';
    },
    resetDeletion: () => deletionSlice.getInitialState(),
  },
});

// Landing page FAQ accordion.
const faqSlice = createSlice({
  name: 'faq',
  initialState: { openIndex: 0 },
  reducers: {
    toggleFaq: (s, { payload }) => {
      s.openIndex = s.openIndex === payload ? -1 : payload;
    },
  },
});

export const { toggleMenu, closeMenu, hideStickyBar } = uiSlice.actions;
export const { setField, markPrepared, resetDeletion } = deletionSlice.actions;
export const { toggleFaq } = faqSlice.actions;

export const store = configureStore({
  reducer: { ui: uiSlice.reducer, deletion: deletionSlice.reducer, faq: faqSlice.reducer },
});
