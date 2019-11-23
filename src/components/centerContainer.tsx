import * as React from "react";

export const CenterContainer: React.FC = ({ children }) => (
  <div style={{
      marginLeft: "auto",
      marginRight: "auto",
      marginTop: 15,
      width: 1024
    }}>
    {children}
  </div>
)
