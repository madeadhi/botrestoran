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

  const outbox = async (inbox_id, message) => {
    try {
      const [result, metadata] = await sequelize.query(
        `INSERT INTO tb_outbox (id_in, isipesan) VALUES (${inbox_id}, '${message}')`
      );

      if (metadata > 0) {
        await sequelize.query(
          `UPDATE tb_inbox SET tb_inbox.status = '1' WHERE tb_inbox.id_in = ${inbox_id}`
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  const inbox = async (type = null) => {
    try {
      const message_id = type
        ? request.body.responseId
        : request.body.originalDetectIntentRequest.payload.data.message.mid;
      const { queryText } = request.body.queryResult;
      const date = new Date();
      const {
        id
      } = request.body.originalDetectIntentRequest.payload.data.sender;

      const [result, metadata] = await sequelize.query(
        `INSERT INTO tb_inbox (idchat, tgl, id_user, isipesan, status) VALUES ('${message_id}', '${date.getFullYear()}-${date.getMonth() +
          1}-${date.getDate()}', '${id}', '${queryText}', '0')`,
        { type: sequelize.QueryTypes.INSERT }
      );

      return metadata > 0 ? result : null;
    } catch (error) {
      console.log(error);
    }
  };

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

        const id_inbox = await inbox();
        agent.add(respon);
        agent.add(
          new Card({
            title: "-",
            buttonText: "Menu",
            buttonUrl: "menu"
          })
        );
        if (id_inbox) await outbox(id_inbox, respon);
        if (id_inbox) await outbox(id_inbox, "menu");
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
      const id_inbox = await inbox("button");
      agent.add(result[0].respon);
      if (id_inbox) await outbox(id_inbox, result[0].respon);
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
      console.log(JSON.stringify(request.body));
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

  intent.set("Salam", salam);
  intent.set("Registrasi", registrasi);
  intent.set("Registrasi - Nama User", registrasiUser);
  intent.set("Booking", booking);
  intent.set("Booking - Orang", bookingJmlOrang);
  intent.set("Booking - Orang - Tgl", bookingTgl);
  intent.set("Pesan Makanan", pesan);
  intent.set("Pesan Makanan - Pilih Menu", pilihMenu);
  intent.set("Kritik", kritik);
  intent.set("Default Fallback Intent", fallback);

  agent.handleRequest(intent);
});

app.listen(port, () => {
  console.log(`server start at ${port}`);
});

const a = {
  responseId: "03da80d0-a417-4559-9874-fd7e5b860ad4-f6406966",
  queryResult: {
    queryText: "Siang",
    parameters: { slm_sapa: "Siang" },
    allRequiredParamsPresent: true,
    fulfillmentMessages: [
      { text: { text: [""] }, platform: "FACEBOOK" },
      { text: { text: [""] } }
    ],
    outputContexts: [
      {
        name:
          "projects/botrestoran-jaqrfp/agent/sessions/110a3746-1f9c-4084-a9b6-fa5b96301186/contexts/generic",
        lifespanCount: 4,
        parameters: {
          facebook_sender_id: "2618576828163310",
          slm_sapa: "Siang",
          "slm_sapa.original": ""
        }
      }
    ],
    intent: {
      name:
        "projects/botrestoran-jaqrfp/agent/intents/90ae9a3c-4e37-43ad-92ea-144fd74ea657",
      displayName: "Salam"
    },
    intentDetectionConfidence: 1,
    languageCode: "en"
  },
  originalDetectIntentRequest: {
    source: "facebook",
    payload: {
      data: {
        timestamp: 1571206697017,
        sender: { id: "2618576828163310" },
        recipient: { id: "112970710107566" },
        message: {
          text: "Siang",
          mid:
            "hAXkBWn5RphJYfEOXP2dvBOdaA4A7f4mjDsPj1qPwqpthHYfKG6Jd-e3EhaGDbpM6_x4m4yg29y4wAXmKNtVTg"
        }
      },
      source: "facebook"
    }
  },
  session:
    "projects/botrestoran-jaqrfp/agent/sessions/110a3746-1f9c-4084-a9b6-fa5b96301186"
};

const f = {
  responseId: "2da8c548-260a-4c1a-aa33-76fab9066ce8-f6406966",
  queryResult: {
    queryText: "Buat pesanan",
    parameters: {},
    allRequiredParamsPresent: true,
    fulfillmentMessages: [{ text: { text: [""] } }],
    outputContexts: [
      {
        name:
          "projects/botrestoran-jaqrfp/agent/sessions/d750df34-a56f-4cb3-a6eb-5a3eff97cb57/contexts/pesanmakanan-followup",
        lifespanCount: 1
      },
      {
        name:
          "projects/botrestoran-jaqrfp/agent/sessions/d750df34-a56f-4cb3-a6eb-5a3eff97cb57/contexts/generic",
        lifespanCount: 4,
        parameters: {
          facebook_sender_id: "2618576828163310",
          slm_sapa: "Pagi",
          "slm_sapa.original": "",
          menu: "Menu",
          "menu.original": "menu"
        }
      },
      {
        name:
          "projects/botrestoran-jaqrfp/agent/sessions/d750df34-a56f-4cb3-a6eb-5a3eff97cb57/contexts/booking-followup"
      }
    ],
    intent: {
      name:
        "projects/botrestoran-jaqrfp/agent/intents/5663fbd8-246d-4e6b-a70c-eab142a6a2c7",
      displayName: "Pesan Makanan"
    },
    intentDetectionConfidence: 1,
    languageCode: "en"
  },
  originalDetectIntentRequest: {
    source: "facebook",
    payload: {
      data: {
        timestamp: 1571217920754,
        sender: { id: "2618576828163310" },
        postback: { payload: "Buat pesanan", title: "Pesan Makanan" },
        recipient: { id: "112970710107566" }
      },
      source: "facebook"
    }
  },
  session:
    "projects/botrestoran-jaqrfp/agent/sessions/d750df34-a56f-4cb3-a6eb-5a3eff97cb57"
};
