const axios = require('axios');
async function run() {
    let count = 0;
    for (let i=0; i < 15; i++) {
        try {
            const res = await axios.post(`http://localhost:3000/api/auth/login`, { email: 't@t.com', password: 'p' }, { validateStatus: () => true });
            count++;
            console.log(`Request ${i+1}: ${res.status}`);
            if (res.status === 429) break;
        } catch(e) { console.log(`Req ${i+1} Error`); }
    }
}
run();
