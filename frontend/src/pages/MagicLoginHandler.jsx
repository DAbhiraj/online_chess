import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function MagicLoginHandler() {
  const navigate = useNavigate();
  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}api/auth`;
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      fetch(`${API_BASE_URL}/verify?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.accessToken) {
            localStorage.setItem("authToken", data.accessToken);
            localStorage.setItem("email", data.email);
            localStorage.setItem("name", data.name);
            console.log(data);
            navigate("/");
          } else {
            alert("Invalid link.");
          }
        });
    }
  }, []);

  return <div>Logging you in...</div>;
}

export default MagicLoginHandler;