"use server"

import axios from 'axios';

export async function sendImage(formData: FormData) {
    const response = await axios.post('http://localhost:8080/api/v1/sendphoto', formData, {
        headers: {
            'API-KEY': '124421412414141',
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
}
