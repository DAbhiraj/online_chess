import { useState } from "react";
import axios from "axios";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Particles from "./../assets/Particles";

function MagicLinkRequest() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}api/auth`;
  const isFormValid = email.trim() !== "" && name.trim() !== "";

  const sendLink = async () => {
    if (!isFormValid || loading) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/send-magic-link`, {
        email,
        name,
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-black font-sans text-center">
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

      <div className="flex items-center justify-center min-h-screen bg-black px-4 z-10 opacity-80">
        <div className="w-full max-w-3xl bg-[#111827] rounded-2xl shadow-xl p-10">
          <div className="text-white text-center mb-6">
            <Typography variant="h5" gutterBottom>
              Login with Magic Link
            </Typography>
            <Typography variant="body2" color="primary">
              Enter your email address to receive a one-time login link.
            </Typography>
          </div>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-md bg-transparent border border-gray-500 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-4 rounded-md bg-transparent border border-gray-500 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
          />

          <button
            onClick={sendLink}
            disabled={!isFormValid || loading}
            className={`w-full flex justify-center items-center bg-blue-600 text-white font-semibold py-3 px-6 rounded-md transition duration-300 ${
              !isFormValid || loading
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <CircularProgress size={24} style={{ color: "white" }} />
            ) : (
              "Send Magic Link"
            )}
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
