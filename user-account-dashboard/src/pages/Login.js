import React, { useState } from 'react'
import { Container, Form, Button } from 'react-bootstrap'
import API from '../services/api'


function Login() {
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')


const handleLogin = async (e) => {
e.preventDefault()
try {
const res = await API.post('/login', { email, password })
localStorage.setItem('token', res.data.token)
window.location.href = '/dashboard'
} catch {
alert('Invalid credentials')
}
}


return (
<Container className="mt-5">
<h2>Login</h2>
<Form onSubmit={handleLogin}>
<Form.Control placeholder="Email" onChange={e => setEmail(e.target.value)} />
<Form.Control type="password" placeholder="Password" className="mt-2" onChange={e => setPassword(e.target.value)} />
<Button className="mt-3" type="submit">Login</Button>
</Form>
<p className="mt-3">No account? <a href="/signup">Sign Up</a></p>
</Container>
)
}


export default Login