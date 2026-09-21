const base = 'http://localhost:3000';

async function login() {
  const r = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@center.sa',
      password: 'admin123'
    })
  });

  const cookie = r.headers.get('set-cookie');

  console.log('LOGIN:', r.status);

  if (!cookie) {
    console.log(await r.text());
    process.exit(1);
  }

  return cookie.split(';')[0];
}

async function getInvoices(cookie) {
  const r = await fetch(`${base}/api/invoices`, {
    headers: {
      Cookie: cookie
    }
  });

  const data = await r.json();

  console.log('\nGET /api/invoices:', r.status);

  return data;
}

const cookie = await login();

const data = await getInvoices(cookie);

const invoices =
  data?.invoices ||
  data?.data ||
  data;

if (!Array.isArray(invoices)) {
  console.log('Unexpected invoice response:', data);
  process.exit(1);
}

const invoice = invoices.find(
  x => x.id === '22709d41-e357-4857-ba1e-348ef6d5a053'
);

if (!invoice) {
  console.log('TEST INVOICE NOT FOUND');
  process.exit(1);
}

const amount = Number(invoice.amount);
const paid = Number(invoice.paid);

console.log('\n=== PAYMENT VERIFICATION ===');
console.log('Invoice:', invoice.number);
console.log('Total:', amount);
console.log('Paid:', paid);
console.log('Remaining:', amount - paid);
console.log('Status:', invoice.status);

if (paid === 10 && amount - paid === 90) {
  console.log('\nRESULT: PASS');
} else {
  console.log('\nRESULT: CHECK REQUIRED');
}