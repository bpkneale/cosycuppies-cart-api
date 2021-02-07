let sgMail = require('@sendgrid/mail');

// constants
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FromAddress = 'no-reply@cosycuppies.com.au';
const ToCosyAddress = process.env.COSY_CUPPIES_ADDR;

exports.mockSgMail = (mock) => {
    sgMail = mock;
}

const renderEmail = (enquiry) => {
    return JSON.stringify(enquiry, null, 2);
}

const renderEnquirerReply = (enquiry) => {
    return JSON.stringify({
        header: "Thankyou for your cart enquiry",
        title: "Your cart enquiry has been submitted",
        misc: "We will be in contact to confirm your order."
    }, null, 2)
}

const response = (code, jsonBody) => {
    return {
        statusCode: code,
        body: JSON.stringify(jsonBody)
    }
}

// lambda function call
exports.handler = async function(event) {

    if(!(event.httpMethod === undefined || event.httpMethod === "POST")) {
        return response(405, {success: false, status: "Unexpected method", extra: event.httpMethod})
    }

    let parsed = null;
    try {
        parsed = JSON.parse(event.body);
    }
    catch(err) {
        return response(400, {success: false, status: "Unable to parse request into JSON", extra: err})
    }

    if(parsed && parsed.enquiry && typeof(parsed.enquiry.email) === "string") {

        const enquirer = parsed.enquiry.email;

        const toCosy = {
            to: ToCosyAddress,
            from: FromAddress,
            subject: `Cart submitted from ${enquirer}`,
            html: renderEmail(parsed.enquiry)
        };

        const toEnquirer = {
            to: enquirer,
            from: FromAddress,
            subject: `Cart enquiry for Cosy Cuppies`,
            html: renderEnquirerReply(parsed.enquiry)
        }

        try {
            await sgMail.send(toEnquirer);
        } catch(err) {
            return response(500, {success: false, status: "Failed to submit cart", extra: err});
        }
    
        try {
            await sgMail.send(toCosy);
            return response(200, {success: true, status: "Sent successfully"});
        }
        catch (err) {
            return response(500, {success: false, status: "Failed to submit cart", extra: err});
        }

    } else {
        return response(400, "Unable to parse enquiry or find enquirer email address")
    }
};
