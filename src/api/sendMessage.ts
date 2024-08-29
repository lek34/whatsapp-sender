"use server"

import axios from 'axios'

type sendMessageProps = {
    recipient: string
    message: string
}

export async function sendMessage(data: sendMessageProps) {
    const response = await axios.post('http://localhost:8080/api/v1/sendmessage', data, {
        headers: {
            'API-KEY': '124421412414141', 
        }
    })
    return await response.data
}