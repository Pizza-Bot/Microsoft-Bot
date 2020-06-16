const choosePizza = require("../resources/choosePizza.json");

const toppingsCard = require("../resources/toppingsChoice.json");

const { RestAPI } = require("../rest-call/restApi");

class ModifyAdaptiveCard {
  static realPizzasList = [];

  static sizesList = [];

  static toppingsList = [];

  static printingPizzaArray = async (url, key) => {
    const response = await RestAPI.getCall(url);
    // console.log(response);

    this.realPizzasList = [...response];

    let valuesArray = [];

    response.map((value) => {
      valuesArray.push({ title: value[key], value: value[key] });
    });

    return valuesArray;
  };

  static printingToppingsArray = async (url, key) => {
    const response = await RestAPI.getCall(url);
    // console.log(response);

    this.toppingsList = [...response];

    let valuesArray = [];

    response.map((value) => {
      valuesArray.push({ title: value[key], value: value[key] });
    });

    return valuesArray;
  };

  static async modifyChoosePizzaCard() {
    let choosePizzaJson = JSON.parse(JSON.stringify(choosePizza));

    const pizzaList = await ModifyAdaptiveCard.printingPizzaArray(
      "realpizza",
      "realPizzaName"
    );

    delete choosePizzaJson.body[1].columns[0].items[0]["choices"];

    choosePizzaJson.body[1].columns[0].items[0]["choices"] = [...pizzaList];

    // console.log(choosePizzaJson);

    return choosePizzaJson;
  }

  static async getSizesArray() {
    let sizes = await RestAPI.getCall("sizes");

    console.log(sizes);

    this.sizesList = [...sizes];

    let sizesArray = [];

    sizes.map((value) => {
      sizesArray.push(value.sizeName);
    });

    return sizesArray;
  }

  static async getToppingsCard() {
    let toppingsCardJson = JSON.parse(JSON.stringify(toppingsCard));

    const toppingsList = await ModifyAdaptiveCard.printingToppingsArray(
      "toppings",
      "toppingsName"
    );

    delete toppingsCardJson.body[1].columns[0].items[0]["choices"];

    toppingsCardJson.body[1].columns[0].items[0]["choices"] = [...toppingsList];

    return toppingsCardJson;
  }
}

// class Modification {
//   static realPizzasList = [];
// }

module.exports.ModifyAdaptiveCard = ModifyAdaptiveCard;
