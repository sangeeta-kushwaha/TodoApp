import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const LogoutBtn = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("AppAuthtoken");

  const handleLogout = () => {
    localStorage.clear(token);
    toast.success("Logout successful");
    navigate("/login");
  };

  return (
    <>
      <button
        className=" bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition duration-300 "
        onClick={handleLogout}
      >
        Logout
      </button>
    </>
  );
};

export default LogoutBtn;
