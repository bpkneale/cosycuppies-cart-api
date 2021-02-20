const { mockSgMail, handler } = require("./index");
const { expect } = require("chai");
const fs = require('fs');

class MockMail {
    constructor(throwError) {
        this.throwError = throwError;
        this.messages = [];
    }

    send(message) {
        this.messages.push(message);
        if(this.throwError) {
            return Promise.reject(this.throwError)
        } else {
            return Promise.resolve(true);
        }
    }
}

const testPayload = {
    "enquiry": {
        "email": "ben@example.com",
        "requiredBy": "2021-02-21T07:30:47.740+08:00",
        "delivery": true,
        "deliveryAddress": "1234 fake street, perth",
        "cart": [{
            "cupcake": {
                "id": "bouquet",
                "amount": 12,
                "cupcakeFlavour": {
                    "flavour": "Vanilla",
                    "id": "vanilla"
                },
                "frostingFlavour": {
                    "flavour": "Almond",
                    "id": "almond"
                },
                "box": false,
                "extraInformation": ""
            }
        }, {
            "cupcake": {
                "id": "enchanted-forest",
                "amount": 48,
                "cupcakeFlavour": {
                    "flavour": "Red velvet",
                    "id": "red-velvet"
                },
                "frostingFlavour": {
                    "flavour": "Bubble gum",
                    "id": "bubble-gum"
                },
                "box": true,
                "extraInformation": "i want the butterflies"
            }
        }]
    }
}

describe("Lambda tests", () => {

    it("Should handle well formed packet", async () => {

        const mock = new MockMail();

        mockSgMail(mock);

        const event = {
            httpMethod: "POST",
            body: JSON.stringify({
                enquiry: {
                    email: "test@example.com",
                    cart: [
                        {
                            "cuppie": 5
                        },
                        {
                            "duppie": 1
                        }
                    ]
                }
            })
        }

        const resp = await handler(event)

        console.info({resp})

        expect(resp.statusCode).to.eq(200);

        const msgs = mock.messages;
        expect(msgs.length).to.eq(2);

    })

    it("HTTP method should be optional", async () => {

        const mock = new MockMail();

        mockSgMail(mock);

        const event = {
            body: JSON.stringify({
                enquiry: {
                    email: "test@example.com",
                    cart: [
                        {
                            "cuppie": 5
                        },
                        {
                            "duppie": 1
                        }
                    ]
                }
            })
        }

        const resp = await handler(event)

        console.info({resp})

        expect(resp.statusCode).to.eq(200);

        const msgs = mock.messages;
        expect(msgs.length).to.eq(2);

    })

    it("Should require email address", async () => {

        const mock = new MockMail();

        mockSgMail(mock);

        const event = {
            httpMethod: "POST",
            body: JSON.stringify({
                enquiry: {
                    cart: [
                        {
                            "cuppie": 5
                        },
                        {
                            "duppie": 1
                        }
                    ]
                }
            })
        }

        const resp = await handler(event)

        console.info({resp})

        expect(resp.statusCode).to.eq(400);

        const msgs = mock.messages;
        expect(msgs.length).to.eq(0);

    })

    it("Can accept a JSON object", async () => {

        const mock = new MockMail();

        mockSgMail(mock);

        const event = {...testPayload}

        const resp = await handler(event)

        console.info({resp})

        expect(resp.statusCode).to.eq(200);

        const msgs = mock.messages;
        expect(msgs.length).to.eq(2);
        expect(msgs[0].html).to.contain("<html>")
        expect(msgs[0].html).to.contain("Cosy Cuppies, The Vines, Western Australia")
        expect(msgs[1].html).to.contain("<html>")

        fs.writeFileSync("./testoutput.html", msgs[1].html);

    })
})