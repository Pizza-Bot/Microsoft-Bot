const choosePizza = require("../resources/choosePizza.json");

const toppingsCard = require("../resources/toppingsChoice.json");

const generateBill = require("../resources/generateBill.json");

const { RestAPI } = require("../rest-call/restApi");

class ModifyAdaptiveCard {
  static realPizzasList = [];

  static sizesList = [];

  static toppingsList = [];

  static pizzaOrder;

  static totalOrder;

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

    this.sizesList = [...sizes];

    let sizesArray = [];

    sizes.map((value) => {
      sizesArray.push(value.sizeName);
    });

    return sizesArray;
  }

  static async getToppingsCard() {
    let toppingsCardJson = JSON.parse(JSON.stringify(toppingsCard));

    // let toppingsCardJson = toppingsCard;

    toppingsCardJson.body.give = "value";

    const toppingsList = await ModifyAdaptiveCard.printingToppingsArray(
      "toppings",
      "toppingsName"
    );

    delete toppingsCardJson.body[0].items[1].columns[0].items[0]["choices"];

    toppingsCardJson.body[0].items[1].columns[0].items[0]["choices"] = [
      ...toppingsList,
    ];

    return toppingsCardJson;
  }

  static findPizzaIdByName(pizzaName) {
    let pizzaList = this.realPizzasList;

    let pizzaJson;

    pizzaList.map((value) => {
      if (pizzaName === value.realPizzaName) {
        pizzaJson = value;
      }
    });

    return pizzaJson;
  }

  static findSizeIdByName(pizzaName) {
    let sizes = this.sizesList;

    let sizeJson;

    sizes.map((value) => {
      if (pizzaName === value.sizeName) {
        sizeJson = value;
      }
    });

    return sizeJson;
  }

  static getToppingsIdByName(toppingsName) {
    let toppings = this.toppingsList;

    let toppingsJson = [];

    toppingsName.map((toppingsName) => {
      toppings.map((value) => {
        if (toppingsName === value.toppingsName) {
          toppingsJson.push(value);
        }
      });
    });

    let toppingsId = [];

    toppingsJson.map((value) => {
      toppingsId.push(value.toppingsId);
    });

    return toppingsId;
  }

  static async postingPizzaOrder(pizzaName, sizeName, quantity, toppingsName) {
    let postJson = {
      realPizzaId: 0,
      quantity: 0,
      toppings: [0],
      sizeId: 0,
    };

    let realPizzaJson = this.findPizzaIdByName(pizzaName);

    postJson.realPizzaId = realPizzaJson.realPizzaId;

    let sizeJson = this.findSizeIdByName(sizeName);

    postJson.sizeId = sizeJson.sizeId;

    postJson.quantity = parseInt(quantity);

    let toppingsJson = this.getToppingsIdByName(toppingsName);

    // console.log(toppingsJson);

    postJson.toppings = toppingsJson;

    let pizzaOrderResponse = await RestAPI.postCall("pizza-order", postJson);

    // console.log(pizzaOrderResponse);

    this.pizzaOrder = pizzaOrderResponse;
  }

  static async postingTotalOrder() {
    let postJson = {
      pizzaOrders: [this.pizzaOrder.pizzaOrderId],
      discountId: 1,
    };

    let totalOrderResponse = await RestAPI.postCall("totalorder", postJson);

    this.totalOrder = JSON.parse(JSON.stringify(totalOrderResponse));

    return totalOrderResponse;
  }

  static async generateUserDetailsForBill(userDetails) {
    let facts = [];

    Object.keys(userDetails).forEach(function (key) {
      var jsonValue = userDetails[key];
      facts.push({ title: key, value: jsonValue });
    });

    return facts;
  }

  static async generatePizzaBill() {
    let pizzaBill = [];

    let totalOrderJson = this.totalOrder;

    const capitalize = (s) => {
      if (typeof s !== "string") return "";
      return s.charAt(0).toUpperCase() + s.slice(1);
    };

    pizzaBill.push({
      title: `${capitalize(
        totalOrderJson.pizzaOrders[0].realPizza.realPizzaName
      )}`,
      value: `${totalOrderJson.pizzaOrders[0].realPizza.basePizzaPrice}`,
    });

    pizzaBill.push({
      title: `${capitalize(totalOrderJson.pizzaOrders[0].sizes.sizeName)}`,
      value: `${totalOrderJson.pizzaOrders[0].sizes.sizePrice}`,
    });

    totalOrderJson.pizzaOrders[0].toppings.map((value) => {
      pizzaBill.push({
        title: `${capitalize(value.toppingsName)}`,
        value: `${value.toppingsPrice}`,
      });
    });

    pizzaBill.push({
      title: `Price per Pizza`,
      value: `${Math.floor(
        totalOrderJson.pizzaOrders[0].pizzaCalculatedPrice /
          totalOrderJson.pizzaOrders[0].quantity
      )}`,
    });

    pizzaBill.push({
      title: `Quantity`,
      value: `${totalOrderJson.pizzaOrders[0].quantity}`,
    });

    return pizzaBill;
  }

  static async generateDiscountBill() {
    let discountBill = [];

    let totalOrderJson = this.totalOrder;

    discountBill.push({
      title: "Total Price",
      value: `${totalOrderJson.rawTotal}`,
    });

    discountBill.push({
      title: "Discounted Price",
      value: `${totalOrderJson.discountedPrice}`,
    });

    return discountBill;
  }

  static async modifyingBillCard(userDetails) {
    let generateBillJson = JSON.parse(JSON.stringify(generateBill));

    let userArrayDetails = await this.generateUserDetailsForBill(userDetails);

    let pizzaArrayDetails = await this.generatePizzaBill();

    let discountArrayDetails = await this.generateDiscountBill();

    // await this.generatePizzaBill();

    generateBillJson.body[1]["facts"] = [...userArrayDetails];

    generateBillJson.body[3]["facts"] = [...pizzaArrayDetails];

    generateBillJson.body[5]["facts"] = [...discountArrayDetails];

    return generateBillJson;
  }

  static async postingUserDetails(userDetails, paymentMethod) {
    let postJson = {
      orderId: this.totalOrder.totalOrderId,
      userName: userDetails.name,
      userPhone: userDetails.phonenumber,
      userAddress: userDetails.address,
      paymentMethod: paymentMethod,
    };

    let response = await RestAPI.postCall("userinfo", postJson);

    return response;
  }
}

// class Modification {
//   static realPizzasList = [];
// }

module.exports.ModifyAdaptiveCard = ModifyAdaptiveCard;
