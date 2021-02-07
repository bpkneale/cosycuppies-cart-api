const { mockSgMail, handler } = require("./index");
const { expect } = require("chai");

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

        const event = {
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
        }

        const resp = await handler(event)

        console.info({resp})

        expect(resp.statusCode).to.eq(200);

        const msgs = mock.messages;
        expect(msgs.length).to.eq(2);

    })
})