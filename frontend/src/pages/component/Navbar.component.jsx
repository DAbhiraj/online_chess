import { useNavigate, useLocation } from "react-router-dom";
import GooeyNav from "../../assets/GoevyNav";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { label: "Home", href: "/" },
    { label: "Lobby", href: "/lobby" },
    { label: "Profile", href: "/profile" },
  ];

  const activeIndex = items.findIndex((item) => item.href === location.pathname);

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <>
      <div className="absolute items-center top-5 z-20">
        <GooeyNav
          items={items}
          particleCount={15}
          particleDistances={[90, 10]}
          particleR={100}
          initialActiveIndex={activeIndex === -1 ? 0 : activeIndex}
          animationTime={600}
          timeVariance={300}
          colors={[1, 2, 3, 1, 2, 3, 1, 4]}
        />
      </div>

      <div className="absolute items-center top-2 right-2 z-20">
        {localStorage.getItem("authToken") ? (
          <button
            onClick={handleLogout}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 ease-in-out"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={handleLoginRedirect}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 ease-in-out"
          >
            Login
          </button>
        )}
      </div>
    </>
  );
}

export default Navbar;
