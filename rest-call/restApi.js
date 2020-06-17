const axios = require("axios");

// const endpoint = "http://pizzabot.southeastasia.cloudapp.azure.com:8080/";

const endpoint = "http://localhost:8080/";

class RestAPI {
  static async postCall(url, jsonObject) {
    return await axios
      .post(endpoint + `${url}`, jsonObject)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  static async getCall(url) {
    return await axios
      .get(endpoint + `${url}`)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  static async putCall(url, jsonObject) {
    return await axios
      .put(endpoint + `${url}`, jsonObject)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  static async deleteCall(url) {
    return await axios
      .delete(endpoint + `${url}`)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        throw new Error(error);
      });
  }
}

module.exports.RestAPI = RestAPI;
