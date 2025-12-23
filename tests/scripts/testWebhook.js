import axios from 'axios';
import data from '../mocks/add_contact.json' with { type: 'json' };

const url = 'http://localhost:3000';

axios.post(url, data)
    .then(response => {
        console.log(response.data);
    })
    .catch(error => {
        console.error(error);
    });
