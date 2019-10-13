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
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.inten = 'salam'"
      );

      if (user.length > 0) {
        let respon = result[0].respon.replace("$user_name", user[0].nama);
        respon = respon.replace("$message", message.text);

        agent.add(respon);
        agent.add(
          new Card({
            title: "-",
            buttonText: "Menu",
            buttonUrl: "menu"
          })
        );
      } else {
        const respon = result[1].respon.replace("$message", message.text);
        agent.add(respon);
        agent.add(
          new Card({
            title: "-",
            buttonText: "Registrasi",
            buttonUrl: "registrasi"
          })
        );
      }
    } catch (error) {
      agent.add("Mohon maaf, terjadi kesalahan. Silahkan ulangi kembali");
    }
  };

  const registrasi = async agent => {
    try {
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.inten = 'Registrasi'"
      );
      agent.add(result[0].respon);
    } catch (error) {
      agent.add("Mohon maaf, terjadi kesalahan. Silahkan ulangi kembali");
    }
  };

  const registrasiUser = async agent => {
    try {
      const {
        message,
        sender
      } = request.body.originalDetectIntentRequest.payload.data;
      const [insert, metadata] = await sequelize.query(
        `INSERT INTO tb_user VALUES ('${sender.id}', '${message.text}')`
      );
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.inten = 'Registrasi - Nama User'"
      );

      if (metadata > 0) {
        agent.add(result[0].respon);
        agent.add(
          new Card({
            title: "-",
            buttonText: "Menu",
            buttonUrl: "menu"
          })
        );
      } else {
        agent.add(result[1].respon);
      }
    } catch (error) {
      agent.add("Mohon maaf, terjadi kesalahan. Silahkan ulangi kembali");
    }
  };

  const booking = async agent => {
    try {
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.inten = 'Booking'"
      );
      agent.add(result[0].respon);
    } catch (error) {
      agent.add("Mohon maaf, terjadi kesalahan. Silahkan ulangi kembali");
    }
  };

  const bookingJmlOrang = async agent => {
    try {
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.inten = 'Booking - Orang'"
      );
      agent.add(result[0].respon);
    } catch (error) {
      agent.add("Mohon maaf, terjadi kesalahan. Silahkan ulangi kembali");
    }
  };

  const bookingTgl = async agent => {
    try {
      const {
        id
      } = request.body.originalDetectIntentRequest.payload.data.sender;
      const {
        jml_orang,
        tgl
      } = request.body.queryResult.outputContexts[0].parameters;
      const [insert, metadata] = await sequelize.query(
        `INSERT INTO tb_booking VALUES (NULL, ${jml_orang}, '${tgl}', '${id}')`
      );
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.inten = 'Booking - Orang - Tanggal'"
      );

      if (metadata > 0) {
        agent.add(result[0].respon);
      } else {
        agent.add(result[1].respon);
      }
    } catch (error) {
      console.log(error);
      agent.add("Mohon maaf, terjadi kesalahan. Silahkan ulangi kembali");
    }
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
            buttonUrl: `${data.id}`
          })
        )
      );
    } catch (error) {
      console.log(error);
      agent.add("Mohon maaf, terjadi kesalahan. Silahkan ulangi kembali");
    }
  };

  const pilihMenu = async agent => {
    try {
      console.log(JSON.stringify(request.body));
      const {
        postback,
        sender
      } = request.body.originalDetectIntentRequest.payload.data;

      const [insert, metadata] = await sequelize.query(
        `INSERT INTO tb_pesanan VALUES (NULL, '${postback.payload}', '${sender.id}')`
      );
      const [menu] = await sequelize.query(
        `SELECT * FROM tb_menu WHERE tb_menu.id = '${postback.payload}'`
      );
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.inten = 'Pesan Makanan - Pilih Menu'"
      );

      if (metadata > 0) {
        const respon = result[0].respon.replace(
          "$nama_makanan",
          menu[0].nama_makanan
        );
        agent.add(respon);
      } else {
        agent.add(result[0].respon);
      }
    } catch (error) {
      agent.add("Mohon maaf, terjadi kesalahan. Silahkan ulangi kembali");
    }
  };

  const kritik = async agent => {
    try {
      const {
        message,
        sender
      } = request.body.originalDetectIntentRequest.payload.data;

      const [user] = await sequelize.query(
        `SELECT * FROM tb_user WHERE tb_user.id_user = ${sender.id}`
      );

      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.inten = 'Kritik'"
      );

      let respon = result[0].respon.replace("$user_name", user[0].nama);
      agent.add(respon);

      // agent.add(result[0].respon);
    } catch (error) {
      agent.add("Mohon maaf, terjadi kesalahan. Silahkan ulangi kembali");
    }
  };

  const fallback = async agent => {
    try {
      // const text = request.body.queryResult.queryText;
      // const intent = text.split("-")[0];
      // const id = text.split("-")[1];
      const [result] = await sequelize.query(
        "SELECT tb_respon.respon FROM tb_respon WHERE tb_respon.inten = 'Default Fallback Intent'"
      );
      agent.add(result[0].respon);
    } catch (error) {
      agent.add("Mohon maaf, terjadi kesalahan. Silahkan ulangi kembali");
    }
  };

  intent.set("salam", salam);
  intent.set("Registrasi", registrasi);
  intent.set("Registrasi - Nama User", registrasiUser);
  intent.set("Booking", booking);
  intent.set("Booking - Orang", bookingJmlOrang);
  intent.set("Booking - Orang - Tanggal", bookingTgl);
  intent.set("Pesan Makanan", pesan);
  intent.set("Pesan Makanan - Pilih Menu", pilihMenu);
  intent.set("Kritik", kritik);
  intent.set("Default Fallback Intent", fallback);

  agent.handleRequest(intent);
});

app.listen(port, () => {
  console.log(`server start at ${port}`);
});
