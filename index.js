const sgMail = require('@sendgrid/mail');

// constants
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const renderEmail = (requestBody) => {
    return JSON.stringify(requestBody, null, 2);
}

const response = (code, jsonBody) => {
    return {
        statusCode: code,
        body: JSON.stringify(jsonBody)
    }
}

// lambda function call
exports.handler = async function(event) {

    if(event.httpMethod === "POST") {
        const msg = {
            to: 'stephanie@cosycuppies.com.au',
            from: 'api@cosycuppies.com.au',
            subject: 'Cart submitted',
            html: renderEmail(JSON.parse(event.body))
        };

        try {
            await sgMail.send(msg);
            return response(200, {success: true, status: "Sent successfully"});
        }
        catch (err) {
            return response(500, {success: false, status: "Failed to submit cart", extra: err});
        }

    }

    return response(405, {success: false, status: "Failed to submit cart", extra: `Method ${event.httpMethod} not supported`});
};
