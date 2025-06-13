import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function MagicLoginHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      fetch(`http://localhost:8080/api/auth/verify?token=${token}`)
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