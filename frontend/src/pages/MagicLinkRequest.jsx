import { useState } from "react";
import axios from "axios";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Particles from "./../assets/Particles"; // Assuming Particles is needed here as well

function MagicLinkRequest() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const sendLink = async () => {
    try {
      await axios.post("http://localhost:8080/api/auth/send-magic-link", {
        email: email,
        name: name, // assuming you have a `name` state variable
      });
      setSnackbar({
        open: true,
        message: "Magic link sent to your email. Check your inbox!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error sending magic link:", error);
      setSnackbar({
        open: true,
        message: "Failed to send magic link. Please try again.",
        severity: "error",
      });
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
        <div className="w-100 max-w-3xl bg-[#111827] rounded-2xl shadow-xl p-10">
          <h2 className="text-white text-3xl font-extrabold text-center mb-8">
            Login with Magic Link
          </h2>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-md bg-transparent border border-gray-500 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <input
            type="text" // Changed from "input" to "text" for consistency
            placeholder="Enter your name "
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 rounded-md bg-transparent border border-gray-500 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
          />

          <button
            onClick={sendLink}
            className="w-full bg-blue-600 cursor-pointer text-white font-semibold py-3 px-6 rounded-md hover:bg-blue-700 transition duration-300"
          >
            Send Magic Link
          </button>
        </div>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default MagicLinkRequest;