import axios from 'axios'


const API = axios.create({
baseURL: 'https://owf5o8rlm8.execute-api.ap-south-1.amazonaws.com/dev'
})


export default API