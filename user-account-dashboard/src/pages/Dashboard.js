import React from 'react'
import { Container, Button } from 'react-bootstrap'


function Dashboard(){
const logout = () => {
localStorage.removeItem('token')
window.location.href = '/'
}


return (
<Container className="mt-5">
<h2>Dashboard</h2>
<p>Welcome! You are logged in.</p>
<Button onClick={logout}>Logout</Button>
</Container>
)
}


export default Dashboard