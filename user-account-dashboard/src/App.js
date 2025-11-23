// src/App.js
import React, { useState } from "react";
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
import axios from "axios";

const API_BASE = "https://owf5o8rlm8.execute-api.ap-south-1.amazonaws.com/dev";

// ---------- Sidebar ----------
function Sidebar({ activePage, setActivePage }) {
  return (
    <Nav
      className="flex-column py-3"
      variant="pills"
      activeKey={activePage}
      style={{ minHeight: "100vh" }}
    >
      <h5 className="px-3 mb-3">Account Dashboard</h5>

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
    </Nav>
  );
}

// ---------- User Profile Page (connected to your API) ----------
function UserProfile() {
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
  });
  const [status, setStatus] = useState(null); // {type: 'success' | 'danger', message: string}
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/users`, formData);
      setStatus({
        type: "success",
        message: res.data.message || "User created successfully",
      });
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

  const handleFetch = async () => {
    if (!formData.email) {
      setStatus({ type: "danger", message: "Please enter an email" });
      return;
    }
    setStatus(null);
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/users/${formData.email}`);
      setFormData((prev) => ({
        ...prev,
        first_name: res.data.first_name || "",
        last_name: res.data.last_name || "",
        password: "",
      }));
      setStatus({ type: "success", message: "User details loaded" });
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

  const handleUpdate = async () => {
    if (!formData.email) {
      setStatus({ type: "danger", message: "Please enter an email" });
      return;
    }
    setStatus(null);
    setLoading(true);
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
      };
      if (formData.password) {
        payload.password = formData.password;
      }
      const res = await axios.put(
        `${API_BASE}/users/${formData.email}`,
        payload
      );
      setStatus({
        type: "success",
        message: res.data.message || "User updated successfully",
      });
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

  const handleDelete = async () => {
    if (!formData.email) {
      setStatus({ type: "danger", message: "Please enter an email" });
      return;
    }
    setStatus(null);
    setLoading(true);
    try {
      const res = await axios.delete(`${API_BASE}/users/${formData.email}`);
      setStatus({
        type: "success",
        message: res.data.message || "User deleted successfully",
      });
      // Clear fields on delete
      setFormData({
        email: "",
        first_name: "",
        last_name: "",
        password: "",
      });
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
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>User Profile</Card.Title>
        <Card.Subtitle className="mb-3 text-muted">
          Manage user account details (CRUD on your Lambda API)
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

        <Form onSubmit={handleCreate}>
          <Form.Group className="mb-3" controlId="email">
            <Form.Label>Email (unique ID)</Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="test@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="first_name">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              type="text"
              name="first_name"
              placeholder="John"
              value={formData.first_name}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="last_name">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              name="last_name"
              placeholder="Doe"
              value={formData.last_name}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              name="password"
              placeholder="Enter a password"
              value={formData.password}
              onChange={handleChange}
            />
            <Form.Text className="text-muted">
              Leave blank when updating if you don&apos;t want to change it.
            </Form.Text>
          </Form.Group>

          <div className="d-flex flex-wrap gap-2 mt-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Please wait..." : "Create User"}
            </Button>
            <Button
              variant="secondary"
              type="button"
              disabled={loading}
              onClick={handleFetch}
            >
              Fetch User
            </Button>
            <Button
              variant="warning"
              type="button"
              disabled={loading}
              onClick={handleUpdate}
            >
              Update User
            </Button>
            <Button
              variant="danger"
              type="button"
              disabled={loading}
              onClick={handleDelete}
            >
              Delete User
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}

// ---------- Notifications Page ----------
function Notifications() {
  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>Notifications</Card.Title>
        <Card.Subtitle className="mb-3 text-muted">
          Configure email / SMS / in-app notifications.
        </Card.Subtitle>
        <Form>
          <Form.Group className="mb-3" controlId="notif_email">
            <Form.Check type="switch" label="Email notifications" defaultChecked />
          </Form.Group>
          <Form.Group className="mb-3" controlId="notif_sms">
            <Form.Check type="switch" label="SMS notifications" />
          </Form.Group>
          <Form.Group className="mb-3" controlId="notif_push">
            <Form.Check type="switch" label="Push notifications" />
          </Form.Group>
          <Button variant="primary">Save Settings</Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

// ---------- Billing & Invoices Page ----------
function Billing() {
  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>Billing &amp; Invoices</Card.Title>
        <Card.Subtitle className="mb-3 text-muted">
          Manage billing information and invoice preferences.
        </Card.Subtitle>
        <Form>
          <Form.Group className="mb-3" controlId="card_name">
            <Form.Label>Cardholder Name</Form.Label>
            <Form.Control type="text" placeholder="Name on card" />
          </Form.Group>
          <Form.Group className="mb-3" controlId="card_number">
            <Form.Label>Card Number</Form.Label>
            <Form.Control type="text" placeholder="**** **** **** 1234" />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="expiry">
                <Form.Label>Expiry</Form.Label>
                <Form.Control type="text" placeholder="MM/YY" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="cvv">
                <Form.Label>CVV</Form.Label>
                <Form.Control type="password" placeholder="***" />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3" controlId="invoice_email">
            <Form.Label>Invoice Email</Form.Label>
            <Form.Control type="email" placeholder="billing@example.com" />
          </Form.Group>
          <Button variant="primary">Save Billing Info</Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

// ---------- Plans & Add-ons Page ----------
function Plans() {
  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title>Plans &amp; Add-ons</Card.Title>
        <Card.Subtitle className="mb-3 text-muted">
          Choose your base plan and optional add-ons.
        </Card.Subtitle>

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Current Plan</Form.Label>
            <Form.Select defaultValue="basic">
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Add-ons</Form.Label>
            <Form.Check type="checkbox" label="Extra storage" />
            <Form.Check type="checkbox" label="Priority support" />
            <Form.Check type="checkbox" label="Analytics pack" />
          </Form.Group>

          <Button variant="primary">Update Plan</Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

// ---------- Main App Component ----------
function App() {
  const [activePage, setActivePage] = useState("profile");

  const renderContent = () => {
    switch (activePage) {
      case "profile":
        return <UserProfile />;
      case "notifications":
        return <Notifications />;
      case "billing":
        return <Billing />;
      case "plans":
        return <Plans />;
      default:
        return <UserProfile />;
    }
  };

  return (
    <Container fluid>
      <Row>
        <Col
          xs={12}
          md={3}
          lg={2}
          className="bg-light border-end"
          style={{ minHeight: "100vh" }}
        >
          <Sidebar activePage={activePage} setActivePage={setActivePage} />
        </Col>
        <Col xs={12} md={9} lg={10} className="p-3">
          {renderContent()}
        </Col>
      </Row>
    </Container>
  );
}

export default App;

