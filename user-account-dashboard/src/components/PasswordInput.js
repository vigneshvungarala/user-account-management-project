import React, { useState } from "react";
import { Form, InputGroup } from "react-bootstrap";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function PasswordInput({ label, name, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);

  return (
    <Form.Group className="mb-2">
      <Form.Label>{label}</Form.Label>
      <InputGroup>
        <Form.Control
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
        />
        <InputGroup.Text
          style={{ cursor: "pointer" }}
          onClick={() => setShow(!show)}
        >
          {show ? <FaEyeSlash /> : <FaEye />}
        </InputGroup.Text>
      </InputGroup>
    </Form.Group>
  );
}

export default PasswordInput;
