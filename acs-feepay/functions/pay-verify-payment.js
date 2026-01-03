// Pay Subdomain - Verify Razorpay Payment
// Netlify Serverless Function
// POST /.netlify/functions/pay-verify-payment

const https = require('https');
const crypto = require('crypto');

exports.handler = async (event) => {
    // CORS Headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle Preflight OPTIONS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers
        };
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            student_id,
            course_id
        } = JSON.parse(event.body);

        // Razorpay credentials
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        // Supabase config
        const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
        const SUPABASE_URL = 'https://afocbygdakyqtmmrjvmy.supabase.co';

        // Validate required fields
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing payment details' })
            };
        }

        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid payment signature' })
            };
        }

        // Fetch payment details from Razorpay
        const paymentDetails = await fetchPaymentDetails(keyId, keySecret, razorpay_payment_id);
        const amountPaid = paymentDetails.amount / 100; // Convert paise to rupees

        // Record payment in Supabase
        const receiptId = `RCP-${Date.now()}`;

        if (SUPABASE_SERVICE_KEY) {
            await recordPayment(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
                student_id,
                course_id,
                amount_paid: amountPaid,
                payment_method: 'UPI',
                razorpay_payment_id,
                razorpay_order_id,
                receipt_id: receiptId,
                status: 'completed'
            });
        }

        return {
            statusCode: 200,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                receipt_id: receiptId,
                amount_paid: amountPaid,
                payment_id: razorpay_payment_id
            })
        };

    } catch (error) {
        console.error('Verify payment error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Payment verification failed' })
        };
    }
};

// Fetch payment details from Razorpay
function fetchPaymentDetails(keyId, keySecret, paymentId) {
    return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

        const options = {
            hostname: 'api.razorpay.com',
            port: 443,
            path: `/v1/payments/${paymentId}`,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(parsed.error?.description || 'Failed to fetch payment'));
                    }
                } catch (e) {
                    reject(new Error('Invalid response from Razorpay'));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Record payment in Supabase
async function recordPayment(baseUrl, serviceKey, paymentData) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(paymentData);
        const url = new URL(baseUrl);

        const options = {
            hostname: url.hostname,
            port: 443,
            path: '/rest/v1/payments',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
                'Prefer': 'return=minimal'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve();
                } else {
                    console.error('Supabase error:', data);
                    resolve();
                }
            });
        });

        req.on('error', (err) => {
            console.error('Supabase request error:', err);
            resolve();
        });

        req.write(postData);
        req.end();
    });
}
