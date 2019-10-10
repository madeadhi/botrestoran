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

  const salam = async agent => {
    try {
      const {
        message,
        sender
      } = request.body.originalDetectIntentRequest.payload.data;

      const [user] = await sequelize.query(
        `SELECT * FROM tb_user WHERE tb_user.id_user = ${sender.id}`
      );

      if (user.length > 0) {
        const [result] = await sequelize.query(
          "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.inten = 'salam'"
        );

        console.log(result);

        agent.add(`Halo kak ${user[0].nama}`);
      } else {
        const [result] = await sequelize.query(
          "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.inten = 'salam'"
        );

        console.log(result);

        agent.add(`${message.text} kak, kakak belum punya akun nih`);
      }
    } catch (error) {
      agent.add("Mohon maaf, terjadi kesalahan. Silahkan ulangi kembali");
    }
  };

  const booking = agent => {
    agent.add(`Booking memek?`);
  };

  const pesan = async agent => {
    try {
      const {
        message,
        sender
      } = request.body.originalDetectIntentRequest.payload.data;
      console.log(message.text);
      console.log(sender.id);
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
            buttonUrl: `pesan-${data.id}`
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
      const intent = text.split("-")[0];
      const id = text.split("-")[1];
    } catch (error) {
      agent.add("Mohon maaf, terjadi kesalahan. Silahkan ulangi kembali");
    }
  };

  intent.set("salam", salam);
  intent.set("booking", booking);
  intent.set("Pesan Makanan - Pilih Menu", pesan);
  intent.set("Default Fallback Intent", fallback);

  agent.handleRequest(intent);
});

app.listen(port, () => {
  console.log(`server start at ${port}`);
});
