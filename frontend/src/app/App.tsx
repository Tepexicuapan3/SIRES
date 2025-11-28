import { RouterProvider } from "react-router-dom";
import { router } from "@/routes/Router";
import { AppProviders } from "../providers/AppProviders";

function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

export default App;
