import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const [pwd, setPwd] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg("");
      const response = await axios.post("http://localhost:8080/api/auth/login", credentials);

      const token = response.data.accessToken;
      const roles = response.data.roles;
      const name = response.data.name;
      const club = response.data.club;
      const userId = response.data.id;
      const email = response.data.email;
      console.log("access token is "+token)
      if (token && roles) {
        localStorage.setItem("roles", JSON.stringify(roles));
        localStorage.setItem("authToken", token);
        localStorage.setItem("name", name);
        localStorage.setItem("email",email);
        localStorage.setItem("club", club);
        localStorage.setItem("userId", userId);

        setLoading(false);
        setErrorMsg("");
        setTimeout(() => navigate("/"), 1000);
      }
    } catch (error) {
      console.error("Login failed:", error);
      setLoading(false);
      setErrorMsg("Login unsuccessful, please try again.");
    }
  };

  return (
    <div className="pt-[12rem] -mt-[5.25rem] flex items-center justify-center min-h-screen w-full">
      <div className="container relative w-full max-w-screen-lg flex justify-center items-center">
        <div className="relative z-1 text-center">
          <form
            className="block relative p-0.5 w-full max-w-[50rem]"
            style={{
              backgroundImage: `url("your_background_image_url")`,
              display: "flex",
              flexDirection: "column",
              padding: "1rem",
              boxSizing: "border-box",
              borderRadius: "8px",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat"
            }}
            onSubmit={handleSubmit}
          >
            <h2 className="text-white text-xl font-bold mb-5">Login</h2>

            <input
              type="email"
              required
              placeholder="Email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              className="w-full p-3 rounded mb-5 bg-transparent border border-white text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            />

            <div className="relative w-full mb-5">
              <input
                type={pwd ? "password" : "text"}
                required
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full p-3 rounded bg-transparent border border-white text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-white"
                onClick={() => setPwd(!pwd)}
              >
                {pwd ? "🙈" : "👁️"}
              </button>
            </div>

            {errorMsg && <p className="text-red-500 mb-3">{errorMsg}</p>}

            <button
              type="submit"
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="register-link mt-5 text-white">
              Don't have an account? <Link to="/register" className="text-blue-300 underline">Register</Link>
            </div>
            <div className="register-link text-white">
              <Link to="/forgotPassword" className="text-blue-300 underline">Forgot Password?</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
