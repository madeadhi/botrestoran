require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT;
const { WebhookClient } = require("dialogflow-fulfillment")

app.use(express.json());

app.post("/", (request, response, next) => {
    const agent = new WebhookClient({ request, response });
    let intent = new Map();

    const booking = (agent) => {
        agent.add(`Booking memek?`)
    }

    intent.set('booking', booking);

    agent.handleRequest(intent)

    return response.status(200).json(request.body)
})

app.listen(port, ()=> {
    console.log(`server start at ${port}`);
});