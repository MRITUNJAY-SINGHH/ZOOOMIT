import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

const TabBarVisibilityContext = createContext({
  isTabBarVisible: true,
  setIsTabBarVisible: () => {},
  onScrollHandler: () => {},
  subscribe: () => () => {}
});

export const TabBarVisibilityProvider = ({ children }) => {
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const isVisibleRef = useRef(true);
  const lastOffsetY = useRef(0);
  const listenersRef = useRef(new Set());

  const subscribe = useCallback((listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const notify = useCallback((visible) => {
    listenersRef.current.forEach((fn) => {
      try {
        fn(visible);
      } catch (e) {}
    });
  }, []);

  const onScrollHandler = useCallback((e) => {
    const currentY = e.nativeEvent.contentOffset.y;
    const diff = currentY - lastOffsetY.current;

    if (currentY <= 30) {
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        notify(true);
        setIsTabBarVisible(true);
      }
    } else if (diff > 5) {
      if (isVisibleRef.current) {
        isVisibleRef.current = false;
        notify(false);
        setIsTabBarVisible(false);
      }
    } else if (diff < -3) {
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        notify(true);
        setIsTabBarVisible(true);
      }
    }

    lastOffsetY.current = currentY;
  }, [notify]);

  return (
    <TabBarVisibilityContext.Provider
      value={{
        isTabBarVisible,
        setIsTabBarVisible,
        onScrollHandler,
        subscribe
      }}
    >
      {children}
    </TabBarVisibilityContext.Provider>
  );
};

export const useTabBarVisibility = () => useContext(TabBarVisibilityContext);
