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

  const pesan = agent => {
    sequelize
      .query("SELECT * FROM tb_menu")
      .then(([result]) => {
        agent.add(
          "Berikut merupakan daftar makanan dan minuman di Warung Robert:"
        );
        result.map(data =>
          agent.add(
            new Card({
              title: data.nama_makanan,
              imageUrl: data.gambar,
              text: `${data.keterangan}\nHarga: ${Number(
                data.harga
              ).toLocaleString("ID", { style: "currency", currency: "IDR" })}`,
              buttonText: "Pesan"
            })
          )
        );
      })
      .catch(() =>
        agent.add("Mohon maaf, terjadi kesalahan. Silahkan ulangi kembali")
      );
  };

  intent.set("booking", booking);
  intent.set("pesan_mknmin", pesan);

  agent.handleRequest(intent);
});

app.listen(port, () => {
  console.log(`server start at ${port}`);
});
