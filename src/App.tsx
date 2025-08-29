import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import Signup from './Auth/Signup';
import Signin from './Auth/Signin';
import './App.css';
import DashboardLayout from "./User/DashboardLayout";
import Home from "./User/Posts";
import Profile from "./Pages/Profile";
import { AuthContextProvider } from "./context/AuthContext";
import PostDetails from "./Component/Moredetails";
import BookRequests from "./Pages/BookRequests";
import BookRequestedByMe from "./Pages/BookRequestedByMe";

// REMOVED Toaster import and <Toaster /> from here

function App() {
  return (
    <AuthContextProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Home />} />
            <Route path="posts/:id" element={<PostDetails />} />
            <Route path="profile" element={<Profile />} />
            <Route path="RequestBook" element={<BookRequests />} />
            <Route path="BookRequestedByMe" element={<BookRequestedByMe />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContextProvider>
  );
}

export default App;