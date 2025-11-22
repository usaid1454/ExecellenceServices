// Health check Lambda function

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    const method = event.requestContext?.http?.method || event.httpMethod || event.requestContext?.httpMethod;
    if (method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: headers,
            body: ''
        };
    }

    return {
        statusCode: 200,
        headers: headers,
        body: JSON.stringify({
            status: 'ok',
            message: 'Email service is running'
        })
    };
};

