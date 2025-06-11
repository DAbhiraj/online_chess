import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Particles from "../assets/Particles";

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

      if (token && roles) {
        localStorage.setItem("roles", JSON.stringify(roles));
        localStorage.setItem("authToken", token);
        localStorage.setItem("name", name);
        localStorage.setItem("email", email);
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
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-black font-sans text-black-800 text-center">
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>
    <div className="flex items-center justify-center min-h-screen bg-black px-4 z-100 opacity-80">
      <div className="w-100  max-w-3xl bg-[#111827] rounded-2xl shadow-xl p-10">
        <h2 className="text-white text-3xl font-extrabold text-center mb-8">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <input
            type="email"
            required
            placeholder="Email"
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            className="w-full p-4 rounded-md bg-transparent border border-gray-500 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="relative">
            <input
              type={pwd ? "password" : "text"}
              required
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full p-4 rounded-md bg-transparent border border-gray-500 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              className="absolute right-4 top-3 text-xl text-gray-300"
              onClick={() => setPwd(!pwd)}
            >
              {pwd ? "🙈" : "👁️"}
            </button>
          </div>

          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

          <button
            type="submit"
            className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition duration-300"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="text-center text-gray-400 text-sm mt-4">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-400 underline">
              Register
            </Link>
          </div>

          <div className="text-center text-gray-400 text-sm">
            <Link to="/forgotPassword" className="text-blue-400 underline">
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
};

export default Login;
