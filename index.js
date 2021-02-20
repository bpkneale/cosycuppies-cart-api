let sgMail = require('@sendgrid/mail');
const fs = require('fs');

// constants
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FromAddress = 'Cosy Cuppies <no-reply@cosycuppies.com.au>';
const ToCosyAddress = process.env.COSY_CUPPIES_ADDR;
let globalEvent;

exports.mockSgMail = (mock) => {
    sgMail = mock;
}

const renderObjectIntoHtml = (obj) => {
    let body = "\n<ul>"
    for (const [key, value] of Object.entries(obj)) {
        if(typeof value !== "object") {
            body += `\n<li><b>${key}</b>: ${value}</li>`
        }
    }
    for (const [key, value] of Object.entries(obj)) {
        if(typeof value === "object") {
            body += `\n<li><b>${key}</b>:`
            body += renderObjectIntoHtml(value)
        }
    }
    body += "\n</ul>"
    return body;
}

const renderEmail = (enquiry) => {
    let body = `<!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Cart submitted from ${enquiry.email}</title>
      </head>
      <body>
      <h3>Website enquiry:</h3>
      `
    body += renderObjectIntoHtml(enquiry);
    body += `</br><h3>Raw enquiry:</h3>`
    body += `<pre>${JSON.stringify(enquiry, null, 2)}</pre>`
    body += "</body></html>"
    return body;
}

const renderEnquirerReply = async (enquiry) => {
    return new Promise((resolve, reject) => {
        fs.readFile("./thankyou.html", "utf8", (err, data) => {
            if(err) {
                reject(err)
            } else {
                resolve(data)
            }
        });
    })
}

const response = (code, jsonBody) => {
    if(code !== 200) {
        console.error({globalEvent})
    }
    return {
        statusCode: code,
        body: jsonBody
    }
}

// lambda function call
exports.handler = async function(event) {
    
    globalEvent = event;

    if(!(event.httpMethod === undefined || event.httpMethod === "POST")) {
        return response(405, {success: false, status: "Unexpected method", extra: event.httpMethod})
    }

    let parsed = null;
    try {
        if(typeof event.body === "string") {
            parsed = JSON.parse(event.body);
        } else if(typeof event.enquiry === "object") {
            parsed = event;
        } else {
            throw new Error("Unable to decode request");
        }
    }
    catch(err) {
        return response(400, {success: false, status: "Unable to parse request into JSON", extra: err.message})
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
            html: await renderEnquirerReply(parsed.enquiry)
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
