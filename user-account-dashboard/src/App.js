import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import PasswordInput from "./components/PasswordInput";
import {
  Container,
  Row,
  Col,
  Nav,
  Form,
  Button,
  Card,
  Alert,
} from "react-bootstrap";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import axios from "axios";

const API_BASE = "https://owf5o8rlm8.execute-api.ap-south-1.amazonaws.com/dev";

// ---------- Helpers ----------
const PLAN_PRICING = {
  basic: 0,
  pro: 499, // ₹/month
  enterprise: 1499, // ₹/month
};

const ADDON_PRICING = {
  extra_storage: 199,
  priority_support: 299,
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePassword(password) {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password))
    return "Password must contain at least one uppercase letter";
  if (!/[0-9]/.test(password))
    return "Password must contain at least one digit";
  return "";
}

// ---------- Protected Route ----------
const ProtectedRoute = ({ token, children }) => {
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// ---------- AUTH PAGES ----------
function LoginPage({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (!emailRegex.test(form.email)) {
      setStatus({ type: "danger", message: "Invalid email format" });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, form);
      const token = res.data.token;
      if (token) {
        onAuthSuccess(token, res.data.user);
        navigate("/dashboard", { replace: true });
        return;
      }
      setStatus({ type: "success", message: res.data.message });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message;
      setStatus({ type: "danger", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col xs={12} md={6} lg={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="mb-3 text-center">
                Login to your account
              </Card.Title>
              {status && (
                <Alert
                  variant={status.type === "success" ? "success" : "danger"}
                  onClose={() => setStatus(null)}
                  dismissible
                >
                  {status.message}
                </Alert>
              )}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <PasswordInput
                  label="Password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                />
                <Button
                  type="submit"
                  className="w-100"
                  disabled={loading}
                  variant="primary"
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </Form>
              <div className="mt-3 text-center">
                <small>
                  Don’t have an account? <Link to="/signup">Create one</Link>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

function SignupPage({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (!emailRegex.test(form.email)) {
      setStatus({ type: "danger", message: "Invalid email format" });
      return;
    }
    const pwError = validatePassword(form.password);
    if (pwError) {
      setStatus({ type: "danger", message: pwError });
      return;
    }
    if (form.password !== form.confirm_password) {
      setStatus({
        type: "danger",
        message: "Password and Confirm Password do not match",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/signup`, form);
      const token = res.data.token;
      if (token) {
        // Auto-login after signup - provide better UX
        onAuthSuccess(token, res.data.user);
        navigate("/dashboard", { replace: true });
        return;
      }
      setStatus({ type: "success", message: res.data.message });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message;
      setStatus({ type: "danger", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col xs={12} md={6} lg={5}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="mb-3 text-center">
                Create your account
              </Card.Title>
              {status && (
                <Alert
                  variant={status.type === "success" ? "success" : "danger"}
                  onClose={() => setStatus(null)}
                  dismissible
                >
                  {status.message}
                </Alert>
              )}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-2">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <PasswordInput
                  label="Password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create strong password"
                />

                <PasswordInput
                  label="Confirm Password"
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                />

                <Form.Text className="text-muted">
                  At least 8 chars, 1 uppercase, 1 number.
                </Form.Text>

                <div className="mt-3" />

                <Button
                  type="submit"
                  className="w-100"
                  disabled={loading}
                  variant="primary"
                >
                  {loading ? "Signing up..." : "Sign Up"}
                </Button>
              </Form>
              <div className="mt-3 text-center">
                <small>
                  Already have an account? <Link to="/login">Login</Link>
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

// ---------- DASHBOARD PARTS ----------
function Sidebar({ activePage, setActivePage, onLogout, user }) {
  return (
    <Nav
      className="flex-column py-3"
      variant="pills"
      activeKey={activePage}
      style={{ minHeight: "100vh" }}
    >
      <div className="px-3 mb-3">
        <h5>Account Dashboard</h5>
        {user && (
          <small className="text-muted">
            {user.first_name} {user.last_name}
            <br />
            {user.email}
          </small>
        )}
      </div>
      <Nav.Link eventKey="overview" onClick={() => setActivePage("overview")}>
        Overview
      </Nav.Link>
      <Nav.Link eventKey="profile" onClick={() => setActivePage("profile")}>
        User Profile
      </Nav.Link>
      <Nav.Link
        eventKey="notifications"
        onClick={() => setActivePage("notifications")}
      >
        Notifications
      </Nav.Link>
      <Nav.Link eventKey="billing" onClick={() => setActivePage("billing")}>
        Billing &amp; Invoices
      </Nav.Link>
      <Nav.Link eventKey="plans" onClick={() => setActivePage("plans")}>
        Plans &amp; Add-ons
      </Nav.Link>
      {/* Logout navigates to /login and clears auth by calling onLogout */}
      <Nav.Link
        as={Link}
        to="/login"
        className="mt-auto text-danger"
        onClick={() => {
          if (onLogout) onLogout();
        }}
      >
        Logout
      </Nav.Link>
    </Nav>
  );
}

function Overview({ user }) {
  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>Welcome back{user ? `, ${user.first_name}` : ""} 👋</Card.Title>
        <Card.Subtitle className="mb-3 text-muted">
          This is your account.
        </Card.Subtitle>
        {user && (
          <ul>
            <li>Email: {user.email}</li>
            <li>
              Name: {user.first_name} {user.last_name}
            </li>
          </ul>
        )}
      </Card.Body>
    </Card>
  );
}

function UserProfile({ token, user, setUser, onLogout }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    email: user?.email || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
  });

  const [mode, setMode] = useState("view"); // view | editName | changePassword | deleteAccount
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const [nameForm, setNameForm] = useState({
    first_name: "",
    last_name: "",
    current_password: "",
  });

  const [passForm, setPassForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [deletePassword, setDeletePassword] = useState("");

  const authHeader = { Authorization: `Bearer ${token}` };

  const fetchProfile = async () => {
    setStatus(null);
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/auth/me`, {
        headers: authHeader,
      });
      setProfile({
        email: res.data.email,
        first_name: res.data.first_name || "",
        last_name: res.data.last_name || "",
      });
      setUser(res.data);
      setStatus({ type: "success", message: "Profile loaded" });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message;
      setStatus({ type: "danger", message: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setProfile({
        email: user.email,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
      });
    } else {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEditName = () => {
    setStatus(null);
    setNameForm({
      first_name: profile.first_name,
      last_name: profile.last_name,
      current_password: "",
    });
    setMode("editName");
  };

  const openChangePassword = () => {
    setStatus(null);
    setPassForm({
      old_password: "",
      new_password: "",
      confirm_password: "",
    });
    setMode("changePassword");
  };

  const cancelMode = () => {
    setStatus(null);
    setMode("view");
  };

  const handleNameChange = (e) =>
    setNameForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePassChange = (e) =>
    setPassForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submitNameChange = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (
      !nameForm.first_name ||
      !nameForm.last_name ||
      !nameForm.current_password
    ) {
      setStatus({
        type: "danger",
        message: "All fields are required",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(`${API_BASE}/auth/profile`, nameForm, {
        headers: authHeader,
      });
      setStatus({ type: "success", message: res.data.message });
      setProfile((prev) => ({
        ...prev,
        first_name: nameForm.first_name,
        last_name: nameForm.last_name,
      }));
      setUser((prev) => ({ ...prev, first_name: nameForm.first_name, last_name: nameForm.last_name }));
      setMode("view");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message;
      setStatus({ type: "danger", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    setStatus(null);

    const pwError = validatePassword(passForm.new_password);
    if (pwError) {
      setStatus({ type: "danger", message: pwError });
      return;
    }
    if (passForm.new_password !== passForm.confirm_password) {
      setStatus({
        type: "danger",
        message: "New password and confirm password do not match",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/auth/change-password`,
        passForm,
        { headers: authHeader }
      );
      setStatus({ type: "success", message: res.data.message });
      setPassForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
      setMode("view");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message;
      setStatus({ type: "danger", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (!deletePassword) {
      setStatus({ type: "danger", message: "Password required" });
      return;
    }

    try {
      await axios.delete(`${API_BASE}/auth/delete-account`, {
        headers: authHeader,
        data: { password: deletePassword },
      });

      // Clear local auth + redirect to login
      if (onLogout) onLogout();
      alert("Account deleted successfully");
      navigate("/login", { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message;
      setStatus({ type: "danger", message: msg });
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>Profile</Card.Title>
        <Card.Subtitle className="mb-3 text-muted">
          View your details and manage profile.
        </Card.Subtitle>

        {status && (
          <Alert
            variant={status.type === "success" ? "success" : "danger"}
            onClose={() => setStatus(null)}
            dismissible
          >
            {status.message}
          </Alert>
        )}

        {mode === "view" && (
          <>
            <Row className="mb-3">
              <Col md={6}>
                <p className="mb-1 text-muted">Full Name</p>
                <h5>
                  {profile.first_name} {profile.last_name}
                </h5>
              </Col>
              <Col md={6}>
                <p className="mb-1 text-muted">Email</p>
                <h6>{profile.email}</h6>
              </Col>
            </Row>

            <div className="d-flex flex-wrap gap-2">
              <Button variant="primary" onClick={openEditName}>
                Edit Profile
              </Button>
              <Button variant="outline-primary" onClick={openChangePassword}>
                Change Password
              </Button>
              <Button
                variant="outline-danger"
                onClick={() => setMode("deleteAccount")}
              >
                Delete Account
              </Button>
              <Button
                variant="secondary"
                onClick={fetchProfile}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </>
        )}

        {mode === "editName" && (
          <Form onSubmit={submitNameChange} className="mt-3">
            <Form.Group className="mb-2">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                name="first_name"
                value={nameForm.first_name}
                onChange={handleNameChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                name="last_name"
                value={nameForm.last_name}
                onChange={handleNameChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <PasswordInput
                label="Current Password"
                name="current_password"
                value={nameForm.current_password}
                onChange={handleNameChange}
              />

              <Form.Text className="text-muted">
                For security, we need your current password to confirm this
                change.
              </Form.Text>
            </Form.Group>
            <div className="d-flex flex-wrap gap-2">
              <Button type="submit" disabled={loading} variant="primary">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={cancelMode}
              >
                Cancel
              </Button>
            </div>
          </Form>
        )}

        {mode === "changePassword" && (
          <Form onSubmit={submitPasswordChange} className="mt-3">
            <Form.Group className="mb-2">
              <PasswordInput
                label="Current Password"
                name="old_password"
                value={passForm.old_password}
                onChange={handlePassChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <PasswordInput
                label="New Password"
                name="new_password"
                value={passForm.new_password}
                onChange={handlePassChange}
              />
              <Form.Text className="text-muted">
                At least 8 chars, 1 uppercase, 1 number.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <PasswordInput
                label="Confirm New Password"
                name="confirm_password"
                value={passForm.confirm_password}
                onChange={handlePassChange}
              />
            </Form.Group>
            <div className="d-flex flex-wrap gap-2">
              <Button type="submit" disabled={loading} variant="primary">
                {loading ? "Updating..." : "Change Password"}
              </Button>
              <Button
                type="button"
                variant="outline-secondary"
                onClick={cancelMode}
              >
                Cancel
              </Button>
            </div>
          </Form>
        )}

        {mode === "deleteAccount" && (
          <Form onSubmit={handleDeleteAccount} className="mt-3">
            <Alert variant="danger">This will permanently delete your account.</Alert>
            <Form.Group className="mb-3">
              <Form.Label>Enter Your Password</Form.Label>
              <Form.Control
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
              />
            </Form.Group>
            <div className="d-flex gap-2">
              <Button type="submit" variant="danger">
                Delete My Account
              </Button>
              <Button variant="secondary" onClick={cancelMode}>
                Cancel
              </Button>
            </div>
          </Form>
        )}
      </Card.Body>
    </Card>
  );
}

/* Notifications, Billing, Plans components unchanged (kept as you provided) */
/* For brevity I'll reuse your existing implementations below — ensure they remain unchanged in your file  */
/* ... copy Notifications, Billing, Plans components from your current file here ... */

function Notifications({ token }) {
  // (use your existing Notifications implementation)
  const [form, setForm] = useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const authHeader = { Authorization: `Bearer ${token}` };

  const loadSettings = async () => {
    setStatus(null);
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/settings/notifications`, {
        headers: authHeader,
      });
      setForm(res.data);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message;
      setStatus({ type: "danger", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setStatus(null);
    setLoading(true);
    try {
      const res = await axios.put(
        `${API_BASE}/settings/notifications`,
        form,
        { headers: authHeader }
      );
      setStatus({ type: "success", message: res.data.message });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message;
      setStatus({ type: "danger", message: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>Notifications</Card.Title>
        <Card.Subtitle className="mb-3 text-muted">Configure how you want to receive alerts.</Card.Subtitle>

        {status && (
          <Alert variant={status.type === "success" ? "success" : "danger"} onClose={() => setStatus(null)} dismissible>
            {status.message}
          </Alert>
        )}

        <Form>
          <Form.Check type="switch" id="notif-email" className="mb-2" label="Email notifications" checked={form.email_notifications} onChange={(e) => setForm((prev) => ({ ...prev, email_notifications: e.target.checked }))} />
          <Form.Check type="switch" id="notif-sms" className="mb-2" label="SMS notifications" checked={form.sms_notifications} onChange={(e) => setForm((prev) => ({ ...prev, sms_notifications: e.target.checked }))} />
          <Form.Check type="switch" id="notif-push" className="mb-3" label="Push notifications" checked={form.push_notifications} onChange={(e) => setForm((prev) => ({ ...prev, push_notifications: e.target.checked }))} />

          <Button disabled={loading} onClick={saveSettings}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

function Billing({ token }) {
  // (use your existing Billing implementation)
  const [form, setForm] = useState({
    cardholder_name: "",
    card_number: "",
    expiry_month: "",
    expiry_year: "",
    cvv: "",
    invoice_email: "",
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);

  const authHeader = { Authorization: `Bearer ${token}` };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validateBilling = () => {
    // Basic email validation
    if (form.invoice_email && !emailRegex.test(form.invoice_email)) {
      return "Invalid invoice email address";
    }

    const digitsOnly = form.card_number.replace(/\D/g, "");
    if (form.card_number) {
      if (digitsOnly.length !== 16) {
        return "Card number must be 16 digits";
      }
    }

    if (form.card_number || form.expiry_month || form.expiry_year || form.cvv) {
      if (!form.cardholder_name) {
        return "Cardholder name is required";
      }

      if (!form.expiry_month || !form.expiry_year) {
        return "Expiry month and year are required";
      }

      const month = parseInt(form.expiry_month, 10);
      const year = parseInt(form.expiry_year, 10);
      if (isNaN(month) || month < 1 || month > 12) {
        return "Expiry month must be between 1 and 12";
      }
      if (isNaN(year) || year < new Date().getFullYear()) {
        return "Expiry year must be current year or later";
      }

      const cvvDigits = form.cvv.replace(/\D/g, "");
      if (cvvDigits.length < 3 || cvvDigits.length > 4) {
        return "CVV must be 3 or 4 digits";
      }
    }

    return "";
  };

  const loadBilling = async () => {
    setStatus(null);
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/settings/billing`, {
        headers: authHeader,
      });

      const data = res.data || {};
      setForm((prev) => ({
        ...prev,
        cardholder_name: data.cardholder_name || "",
        card_number: data.card_last4 ? `**** **** **** ${data.card_last4}` : "",
        expiry_month: "",
        expiry_year: "",
        cvv: "",
        invoice_email: data.invoice_email || "",
      }));
      setHasPaymentMethod(!!data.card_last4);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message;
      setStatus({ type: "danger", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const saveBilling = async () => {
    setStatus(null);

    const validationError = validateBilling();
    if (validationError) {
      setStatus({ type: "danger", message: validationError });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(
        `${API_BASE}/settings/billing`,
        {
          cardholder_name: form.cardholder_name,
          card_number: form.card_number.replace(/\D/g, ""), // send digits only
          expiry_month: form.expiry_month,
          expiry_year: form.expiry_year,
          cvv: form.cvv,
          invoice_email: form.invoice_email,
        },
        { headers: authHeader }
      );
      setStatus({ type: "success", message: res.data.message });
      // Reload to refresh masked card + hasPaymentMethod flag
      await loadBilling();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message;
      setStatus({ type: "danger", message: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBilling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>Billing &amp; Invoices</Card.Title>
        <Card.Subtitle className="mb-3 text-muted">
          Manage your payment method and invoice email. (Mock payment – card is
          not actually charged.)
        </Card.Subtitle>

        {status && (
          <Alert
            variant={status.type === "success" ? "success" : "danger"}
            onClose={() => setStatus(null)}
            dismissible
          >
            {status.message}
          </Alert>
        )}

        {hasPaymentMethod && (
          <Alert variant="info">
            Payment method on file: {form.card_number || "**** **** **** ****"}
          </Alert>
        )}

        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Cardholder Name</Form.Label>
            <Form.Control
              type="text"
              name="cardholder_name"
              value={form.cardholder_name}
              onChange={handleChange}
              placeholder="Name on card"
            />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Card Number</Form.Label>
            <Form.Control
              type="text"
              name="card_number"
              value={form.card_number}
              onChange={handleChange}
              placeholder="1111 2222 3333 4444"
            />
          </Form.Group>
          <Row>
            <Col xs={6}>
              <Form.Group className="mb-2">
                <Form.Label>Expiry Month</Form.Label>
                <Form.Control
                  type="number"
                  name="expiry_month"
                  value={form.expiry_month}
                  onChange={handleChange}
                  placeholder="MM"
                  min="1"
                  max="12"
                />
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group className="mb-2">
                <Form.Label>Expiry Year</Form.Label>
                <Form.Control
                  type="number"
                  name="expiry_year"
                  value={form.expiry_year}
                  onChange={handleChange}
                  placeholder="YYYY"
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-2">
            <Form.Label>CVV</Form.Label>
            <Form.Control
              type="password"
              name="cvv"
              value={form.cvv}
              onChange={handleChange}
              placeholder="3 or 4 digits"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Invoice Email</Form.Label>
            <Form.Control
              type="email"
              name="invoice_email"
              value={form.invoice_email}
              onChange={handleChange}
              placeholder="Where invoices should be sent"
            />
          </Form.Group>
          <Button disabled={loading} onClick={saveBilling}>
            {loading ? "Saving..." : "Save Billing Info"}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

function Plans({ token }) {
  // (use your existing Plans implementation)
  const [form, setForm] = useState({
    plan: "basic",
    extra_storage: false,
    priority_support: false,
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);

  const authHeader = { Authorization: `Bearer ${token}` };

  const loadPlans = async () => {
    setStatus(null);
    setLoading(true);
    try {
      const [plansRes, billingRes] = await Promise.all([
        axios.get(`${API_BASE}/settings/plans`, { headers: authHeader }),
        axios.get(`${API_BASE}/settings/billing`, { headers: authHeader }),
      ]);

      const plansData = plansRes.data || {};
      setForm({
        plan: plansData.plan || "basic",
        extra_storage: !!plansData.extra_storage,
        priority_support: !!plansData.priority_support,
      });

      const billingData = billingRes.data || {};
      setHasPaymentMethod(!!billingData.card_last4);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message;
      setStatus({ type: "danger", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const savePlans = async () => {
    setStatus(null);

    const basePrice = PLAN_PRICING[form.plan] || 0;
    const addons =
      (form.extra_storage ? ADDON_PRICING.extra_storage : 0) +
      (form.priority_support ? ADDON_PRICING.priority_support : 0);
    const total = basePrice + addons;

    if (total > 0 && !hasPaymentMethod) {
      setStatus({
        type: "danger",
        message:
          "Please add a billing method in Billing & Invoices before selecting a paid plan.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(
        `${API_BASE}/settings/plans`,
        {
          plan: form.plan,
          extra_storage: form.extra_storage,
          priority_support: form.priority_support,
          total_price: total,
          currency: "INR",
        },
        { headers: authHeader }
      );
      setStatus({ type: "success", message: res.data.message });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message;
      setStatus({ type: "danger", message: msg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const basePrice = PLAN_PRICING[form.plan] || 0;
  const addonsPrice =
    (form.extra_storage ? ADDON_PRICING.extra_storage : 0) +
    (form.priority_support ? ADDON_PRICING.priority_support : 0);
  const total = basePrice + addonsPrice;

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>Plans &amp; Add-ons</Card.Title>
        <Card.Subtitle className="mb-3 text-muted">
          Choose your subscription and extras. Billing is simulated (no real
          payment gateway).
        </Card.Subtitle>

        {status && (
          <Alert
            variant={status.type === "success" ? "success" : "danger"}
            onClose={() => setStatus(null)}
            dismissible
          >
            {status.message}
          </Alert>
        )}

        {!hasPaymentMethod && basePrice + addonsPrice > 0 && (
          <Alert variant="warning">
            To activate a paid plan, please add a card in{" "}
            <strong>Billing &amp; Invoices</strong>.
          </Alert>
        )}

        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Plan</Form.Label>
            <Form.Select
              value={form.plan}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, plan: e.target.value }))
              }
            >
              <option value="basic">Basic (Free)</option>
              <option value="pro">Pro (₹499 / month)</option>
              <option value="enterprise">Enterprise (₹1499 / month)</option>
            </Form.Select>
          </Form.Group>

          <Form.Check
            type="checkbox"
            className="mb-2"
            label={`Extra storage (+₹${ADDON_PRICING.extra_storage}/month)`}
            checked={form.extra_storage}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, extra_storage: e.target.checked }))
            }
          />
          <Form.Check
            type="checkbox"
            className="mb-3"
            label={`Priority support (+₹${ADDON_PRICING.priority_support}/month)`}
            checked={form.priority_support}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, priority_support: e.target.checked }))
            }
          />

          <div className="mb-3">
            <strong>Monthly total: ₹{total}</strong>{" "}
            {total === 0 && <span className="text-muted">(Free plan)</span>}
          </div>

          <Button disabled={loading} onClick={savePlans}>
            {loading ? "Saving..." : "Update Plan"}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}


// ---------- DASHBOARD WRAPPER ----------
function Dashboard({ token, user, setUser, onLogout }) {
  const [activePage, setActivePage] = useState("overview");
  const navigate = useNavigate();
  const renderContent = () => {
    switch (activePage) {
      case "overview":
        return <Overview user={user} />;
      case "profile":
        return <UserProfile token={token} user={user} setUser={setUser} onLogout={onLogout} />;
      case "notifications":
        return <Notifications token={token} />;
      case "billing":
        return <Billing token={token} />;
      case "plans":
        return <Plans token={token} />;
      default:
        return <Overview user={user} />;
    }
  };

  return (
    <Container fluid>
      <Row>
        <Col
          xs={12}
          md={3}
          lg={2}
          className="bg-light border-end d-flex flex-column"
          style={{ minHeight: "100vh" }}
        >
          <Sidebar
            activePage={activePage}
            setActivePage={setActivePage}
            onLogout={onLogout}
            user={user}
          />
        </Col>
        <Col xs={12} md={9} lg={10} className="p-3">
          {renderContent()}
        </Col>
      </Row>
    </Container>
  );
}

// ---------- ROOT APP ----------
function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  // Fetch current user when token exists but user data not loaded
  useEffect(() => {
    const loadMe = async () => {
      if (!token) return;
      if (user) return;
      try {
        const res = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        // Token invalid or expired — clear it
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      }
    };
    loadMe();
  }, [token, user]);

  const handleAuthSuccess = (newToken, userData) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={<LoginPage onAuthSuccess={handleAuthSuccess} />}
        />
        <Route
          path="/signup"
          element={<SignupPage onAuthSuccess={handleAuthSuccess} />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute token={token}>
              <Dashboard token={token} user={user} setUser={setUser} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
