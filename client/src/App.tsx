import { useEffect } from "react";
import apiClient from "./services/api-client";

function App() {
  useEffect(() => {
    apiClient
      .get("/health")
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.error("API request failed:", error);
      });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">
        Employee Management SaaS
      </h1>
    </div>
  );
}

export default App;