import React, { createContext, useContext } from "react";
import { message } from "antd";
const FeedbackContext = createContext(null);
export function FeedbackProvider({ children }) {
  const [api, holder] = message.useMessage();
  return (
    <FeedbackContext.Provider value={api}>
      <div className="feedback-app">
        {holder}
        {children}
      </div>
    </FeedbackContext.Provider>
  );
}
export function useFeedback() {
  return useContext(FeedbackContext);
}
