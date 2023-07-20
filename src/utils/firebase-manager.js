// module imports
import admin from "firebase-admin";

// file imports
import serviceAccount from "../services/fir-app-9767a-firebase-adminsdk-mvz58-3b5412bc35.json" assert { type: "json" };

// variable initializations
const connection = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

class FirebaseManager {
  constructor() {
    this.connection = connection;
  }

  /**
   * @description Send firebase notification
   * @param {[String]} fcms firebase cloud messaging user tokens array
   * @param {String} title notification title
   * @param {String} body notification body
   * @param {Object} data notification data
   */
  async notify(params) {
    const { title, body } = params;
    let { data, fcms, fcm } = params;
    console.log(" params : ", params);
    data = data ?? {};
    fcms = fcms?.length > 0 ? fcms : fcm ? [fcm] : ["null"];
    const payload = {
      notification: {
        title,
        body,
        sound: "default",
      },
      data,
    };
    console.log("payload, : ", payload)
    connection
      .messaging()
      .sendToDevice(fcms, payload)
      .then((response) => {
        console.log("response", response);
        console.log("response.results", response.results);
      })
      .catch((error) => console.error(error));
  }
}

export default FirebaseManager;
