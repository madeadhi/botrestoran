require("dotenv").config();
const express = require("express");
const Sequelize = require("sequelize");
const { WebhookClient, Card } = require("dialogflow-fulfillment");
const app = express();
const port = process.env.PORT;

const sequelize = new Sequelize("db_restoran", "madeadhi", "madeadhi12", {
  host: "db4free.net",
  dialect: "mysql"
});

app.use(express.json());

app.post("/", (request, response, next) => {
  const agent = new WebhookClient({ request, response });
  let intent = new Map();

  const booking = agent => {
    agent.add(`Booking memek?`);
  };

  const pesan = async agent => {
    try {
      const [result] = await sequelize.query("SELECT * FROM tb_menu");
      result.map(data =>
        agent.add(
          new Card({
            title: data.nama_makanan,
            imageUrl: data.gambar,
            text: `${data.keterangan}\nHarga: Rp${Number(
              data.harga
            ).toLocaleString("ID")}`,
            buttonText: "Pesan",
            buttonUrl: "hallo"
          })
        )
      );
    } catch (error) {
      agent.add("Mohon maaf, terjadi kesalahan. Silahkan ulangi kembali");
    }
  };

  const fallback = async agent => {
    try {
      const text = request.body.queryResult.queryText;
      agent.add(`Kakak mengirimkan pesan ${text}`);
    } catch (error) {
      agent.add("Mohon maaf, terjadi kesalahan. Silahkan ulangi kembali");
    }
  };

  intent.set("booking", booking);
  intent.set("pesan_mknmin", pesan);
  intent.set("Default Fallback Intent", fallback);

  agent.handleRequest(intent);
});

app.listen(port, () => {
  console.log(`server start at ${port}`);
});
