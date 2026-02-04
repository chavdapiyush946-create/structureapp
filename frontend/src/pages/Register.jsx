import { useDispatch, useSelector } from "react-redux";
import { registerUser } from "../features/auth/authSlice";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.auth);

  const handleRegister = async (e) => {
    e.preventDefault();
    const form = e.target;

    const body = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value,
      age: Number(form.age.value),
      phone: form.phone.value.trim(),
      address: form.address.value.trim(),
    };

    const result = await dispatch(registerUser(body));

    if (registerUser.fulfilled.match(result)) {
      toast.success("Registration successful 🎉");
      navigate("/login");
    } else {
      toast.error(result.payload || "Registration failed");
    }
  };

  return (
    <div className="flex justify-content-center align-items-center  min-h-screen register-bg">
      <Card className="register-card w-600 md:w-25rem shadow-4 border-round-xl">
        <h2 className="text-center mb-4 text-xl font-semibold">
          Register Here
        </h2>

        <form onSubmit={handleRegister} className="flex flex-column gap-4">

          <span className="p-float-label">
            <InputText id="name" name="name" className="w-full input-height" placeholder=" " required />
            <label htmlFor="name">Full Name</label>
          </span>

          <span className="p-float-label">
            <InputText id="email" name="email" type="email" className="w-full input-height" placeholder=" " required />
            <label htmlFor="email">Email</label>
          </span>

          <span className="p-float-label">
            <InputText id="age" name="age" type="number" className="w-full input-height" placeholder=" " required />
            <label htmlFor="age">Age</label>
          </span>

          <span className="p-float-label">
            <InputText id="phone" name="phone" className="w-full input-height" placeholder=" " required />
            <label htmlFor="phone">Phone</label>
          </span>

          <span className="p-float-label">
            <InputText id="address" name="address" className="w-full input-height" placeholder=" " required />
            <label htmlFor="address">Address</label>
          </span>

          <span className="p-float-label w-full">
            <Password
              inputId="password"
              name="password"
              toggleMask
              feedback={false}
             className="w-full "
              inputClassName="w-full input-height"
              placeholder=" "
              required
            />
            <label htmlFor="password">Password</label>
          </span>

          <Button
            label={loading ? "Registering..." : "Register"}
            
            loading={loading}
            className="w-full p-button-rounded"
          />

          <p className="text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium">
              Login
            </Link>
          </p>

        </form>
      </Card>
    </div>
  );
};

export default Register;
