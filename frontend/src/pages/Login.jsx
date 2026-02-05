import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../features/auth/authSlice";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";


const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((s) => s.auth);



  const handleLogin = async (e) => {
    e.preventDefault();

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    const result = await dispatch(loginUser({ email, password }));

    if (loginUser.fulfilled.match(result)) {
      toast.success("Login successful 🎉");
      result.payload.role === "admin"
        ? navigate("/admin")
        : navigate("/user");
    } else {
      toast.error(result.payload);
    }
  };

  return (
    <div
      className="flex justify-content-center align-items-center min-h-screen"
      style={{
        background: "linear-gradient(135deg, #f3f4f6, #e9f1f9)"
      }}
    >
      <Card className="w-full md:w-25rem shadow-4 border-round-xl">
        <h2 className="text-center mb-4">Login Here</h2>

        <form onSubmit={handleLogin} className="flex flex-column gap-4">

          {/* Email */}
          <span className="p-float-label">
            <InputText
              id="email"
              name="email"
              className="w-full"
            />
            <label htmlFor="email">Email</label>
          </span>

          {/* Password */}
          <span className="p-float-label">
            <Password
              id="password"
              name="password"
              toggleMask
              feedback={false}
              inputClassName="w-full"
              className="w-full"
            />
            <label htmlFor="password">Password</label>
          </span>

          <Button
            label={loading ? "Logging in..." : "Login"}
            icon="pi pi-sign-in"
            loading={loading}
            className="w-full"
          />
          <p className="text-center text-sm mt-2">
            Don’t have an account?{" "}
            <Link to="/register" className="text-primary font-medium">
              Register
            </Link>            
          </p>
        </form>
      </Card>
    </div>
  );
};

export default Login;
