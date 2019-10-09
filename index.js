require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = process.env.PORT;
const { WebHookClient } = require("dialogflow-fulfillment")

mongoose.connect(mongodb_uri, { useNewUrlParser: true})

app.use(express.json());

app.post("/", (request, response, next) => {
    const agent = new WebHookClient({ request, response });
    return response.status(200).json(request.body)
})

app.listen(port, ()=> {
    console.log(`server start at ${port}`);
});