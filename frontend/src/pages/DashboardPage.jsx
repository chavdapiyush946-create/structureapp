import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";

const DashboardPage = () => {
  const { name, email, role } = useSelector((s) => s.auth);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

    </div>
  );
};

export default DashboardPage;


