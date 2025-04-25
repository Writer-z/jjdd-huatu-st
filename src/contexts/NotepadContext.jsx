import React, { createContext, useReducer, useContext, useEffect } from 'react';

// 初始状态
const initialState = {
  entries: [],
  isLoading: false,
  error: null,
};

// 动作类型
const actionTypes = {
  ADD_ENTRY: 'ADD_ENTRY',
  UPDATE_ENTRY: 'UPDATE_ENTRY',
  REMOVE_ENTRY: 'REMOVE_ENTRY',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  LOAD_ENTRIES: 'LOAD_ENTRIES',
};

// Reducer 函数
function notepadReducer(state, action) {
  switch (action.type) {
    case actionTypes.ADD_ENTRY:
      return {
        ...state,
        entries: [...state.entries, {
          id: Date.now().toString(),
          category: '',
          value: '',
          trigger: '',
          ...action.entry,
        }],
      };
    case actionTypes.UPDATE_ENTRY:
      return {
        ...state,
        entries: state.entries.map(entry =>
          entry.id === action.id ? { ...entry, ...action.updates } : entry
        ),
      };
    case actionTypes.REMOVE_ENTRY:
      return {
        ...state,
        entries: state.entries.filter(entry => entry.id !== action.id),
      };
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.value,
      };
    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.error,
      };
    case actionTypes.LOAD_ENTRIES:
      return {
        ...state,
        entries: action.entries || [],
      };
    default:
      return state;
  }
}

// 创建 Context
const NotepadContext = createContext();

// Provider 组件
export function NotepadProvider({ children }) {
  const [state, dispatch] = useReducer(notepadReducer, initialState);

  // 从 localStorage 加载记事本
  useEffect(() => {
    const loadNotepad = () => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, value: true });
        const savedEntries = localStorage.getItem('jjddHuatuNotepad');
        if (savedEntries) {
          const entries = JSON.parse(savedEntries);
          dispatch({ type: actionTypes.LOAD_ENTRIES, entries });
        } else {
          // 如果没有保存的记事本，创建默认的三个空条目
          const defaultEntries = Array(3).fill(null).map((_, index) => ({
            id: `default-${index + 1}`,
            category: '类别/说明',
            value: '',
            trigger: '',
          }));
          dispatch({ type: actionTypes.LOAD_ENTRIES, entries: defaultEntries });
        }
      } catch (error) {
        console.error('Error loading notepad:', error);
        dispatch({ type: actionTypes.SET_ERROR, error: error.message });
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, value: false });
      }
    };

    loadNotepad();
  }, []);

  // 保存记事本到 localStorage
  useEffect(() => {
    const saveNotepad = () => {
      try {
        localStorage.setItem('jjddHuatuNotepad', JSON.stringify(state.entries));
      } catch (error) {
        console.error('Error saving notepad:', error);
        dispatch({ type: actionTypes.SET_ERROR, error: error.message });
      }
    };

    // 当记事本内容改变时保存
    if (state.entries.length > 0) {
      const timeoutId = setTimeout(saveNotepad, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [state.entries]);

  // 添加记事本项
  const addEntry = (entry = {}) => {
    dispatch({ type: actionTypes.ADD_ENTRY, entry });
  };

  // 更新记事本项
  const updateEntry = (id, updates) => {
    dispatch({ type: actionTypes.UPDATE_ENTRY, id, updates });
  };

  // 删除记事本项
  const removeEntry = (id) => {
    dispatch({ type: actionTypes.REMOVE_ENTRY, id });
  };

  return (
    <NotepadContext.Provider value={{
      ...state,
      addEntry,
      updateEntry,
      removeEntry,
    }}>
      {children}
    </NotepadContext.Provider>
  );
}

// 自定义 Hook 方便使用 Context
export function useNotepad() {
  const context = useContext(NotepadContext);
  if (!context) {
    throw new Error('useNotepad must be used within a NotepadProvider');
  }
  return context;
} 