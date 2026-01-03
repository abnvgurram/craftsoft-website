exports.handler = async (event) => {
    return {
        statusCode: 503,
        body: JSON.stringify({ error: "Payment service is temporarily paused." })
    };
};
