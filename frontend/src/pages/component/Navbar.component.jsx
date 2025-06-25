import { useNavigate, useLocation } from "react-router-dom";
import GooeyNav from "../../assets/GoevyNav";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const TOKEN = localStorage.getItem("authToken");

const items = [
  { label: "Home", href: "/" },
];

if (TOKEN !== null) {
  items.push(
    { label: "Lobby", href: "/lobby" },
    { label: "Profile", href: "/profile" }
  );
}


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
      {/* Container for GooeyNav - Adjust positioning for mobile */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 md:left-auto md:translate-x-0"> {/* Centered on mobile, then default on md and larger */}
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

      {/* Container for Login/Logout button - Adjust positioning for mobile */}
      <div className="absolute top-2 right-2 z-20">
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