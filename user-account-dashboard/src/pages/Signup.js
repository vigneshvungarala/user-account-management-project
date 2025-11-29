import React, { useState } from 'react'
import { Container, Form, Button } from 'react-bootstrap'
import API from '../services/api'


function Signup() {
const [data, setData] = useState({ email:'', password:'', confirm:'' })


const handleSubmit = async (e) => {
e.preventDefault()
if(data.password !== data.confirm) return alert('Passwords do not match')


try {
await API.post('/signup', { email: data.email, password: data.password })
alert('Signup successful')
window.location.href = '/'
} catch {
alert('Error creating account')
}
}


return (
<Container className="mt-5">
<h2>Signup</h2>
<Form onSubmit={handleSubmit}>
<Form.Control placeholder="Email" onChange={e => setData({...data,email:e.target.value})} />
<Form.Control type="password" placeholder="Password" className="mt-2" onChange={e => setData({...data,password:e.target.value})} />
<Form.Control type="password" placeholder="Confirm Password" className="mt-2" onChange={e => setData({...data,confirm:e.target.value})} />
<Button className="mt-3" type="submit">Signup</Button>
</Form>
</Container>
)
}


export default Signup