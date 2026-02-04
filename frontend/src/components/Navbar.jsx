import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { Menubar } from "primereact/menubar";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { logout } from "../features/auth/authSlice";
import { toast } from "react-toastify";
import "../styles/navbar.css";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, role, name } = useSelector((s) => s.auth);

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const items = [
    {
      label: role === "admin" ? "Admin Dashboard" : "Dashboard",
      icon: "pi pi-home",
      className: isActive(role === "admin" ? "/admin" : "/user") ? "p-menuitem-active" : "",
      command: () => navigate(role === "admin" ? "/admin" : "/user")
    },
    {
      label: "Todos",
      icon: "pi pi-check-square",
      className: isActive("/todo") ? "p-menuitem-active" : "",
      command: () => navigate("/todo")
    },
    {
      label: "Expenses",
      icon: "pi pi-dollar",
      className: isActive("/expense") ? "p-menuitem-active" : "",
      command: () => navigate("/expense")
    },
    {
      label: "Structure",
      icon: "pi pi-folder",
      className: isActive("/structure") ? "p-menuitem-active" : "",
      command: () => navigate("/structure")
    }
  ];

  const start = (
    <div className="flex align-items-center">
      <i className="pi pi-chart-bar text-2xl text-white mr-2"></i>
      <span className="text-white font-bold text-xl mr-2">TaskManager</span>
    </div>
  );

  const end = (
    <div className="flex align-items-center gap-2">
      {/* User Info */}
      <div className="flex align-items-center">
        <Avatar
          label={name?.charAt(0)}
          className="mr-2"
          style={{ backgroundColor: role === 'admin' ? '#8B5CF6' : '#3B82F6', color: '#ffffff' }}
        />
        <div className="hidden md:block">
          <div className="text-white font-medium">{name}</div>
          <div className="text-gray-300 text-sm">{role}</div>
        </div>
      </div>

      {/* Logout Button */}
      <Button
        label="Logout"
        icon="pi pi-sign-out"
        className="p-button-text p-button-sm ml-3"
        style={{ color: 'white' }}
        onClick={handleLogout}
      />
    </div>
  );

  if (!token) return null;

  return (
    <div className="card">
      <Menubar
        model={items}
        start={start}
        end={end}
        className="dark-navbar"
      />
    </div>
  );
};

export default Navbar;