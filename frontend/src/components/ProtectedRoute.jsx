import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";


const ProtectedRoute = ({ children, role }) => {
const { token, role: userRole } = useSelector((s) => s.auth);


if (!token) return <Navigate to="/login" />;
if (role && role !== userRole) return <Navigate to="/" />;
return children;
};


export default ProtectedRoute;

