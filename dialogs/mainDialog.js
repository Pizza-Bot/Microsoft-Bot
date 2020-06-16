const {
  ComponentDialog,
  TextPrompt,
  ChoicePrompt,
  NumberPrompt,
  ConfirmPrompt,
  DialogSet,
  WaterfallDialog,
  ChoiceFactory,
  DialogTurnStatus,
  ActivityPrompt,
} = require("botbuilder-dialogs");
const { MessageFactory, CardFactory, ActivityTypes } = require("botbuilder");

const choosePizzaCard = require("../resources/choosePizza.json");

const toppingsChoiceCard = require("../resources/toppingsChoice.json");

const userDetails = require("../resources/userDetails.json");

const billForm = require("../resources/generateBill.json");
const {
  ModifyAdaptiveCard,
} = require("../modifyAdaptiveCards/modifyAdaptiveCard");

const CONV_PROFILE = "CONV_PROFILE";
const TEXT_PROMPT = "TEXT_PROMPT";
const CHOICE_PROMPT = "CHOICE_PROMPT";
const NUMBER_PROMPT = "NUMBER_PROMPT";
const CONFIRM_PROMPT = "CONFIRM_PROMPT";
const PIZZA_PROMPT = "PIZZA_PROMPT";
const USER_PROMPT = "USER_PROMPT";
const TOPPINGS_PROMPT = "TOPPINGS_PROMPT";
const WATERFALL_DIALOG = "WATERFALL_DIALOG";

class MainDialog extends ComponentDialog {
  constructor(conversationState) {
    super("pizzaOrderingDialog");

    if (!conversationState)
      throw new Error("[MainDialog] Main Dialog not given");

    this.conversationState = conversationState.createProperty(CONV_PROFILE);

    this.addDialog(new TextPrompt(TEXT_PROMPT));
    this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
    this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));
    this.addDialog(
      new NumberPrompt(NUMBER_PROMPT, this.quantityPromptValidator)
    );
    this.addDialog(new ActivityPrompt(PIZZA_PROMPT, this.pizzaFormValidator));
    this.addDialog(
      new ActivityPrompt(TOPPINGS_PROMPT, this.toppingsFormValidator)
    );
    this.addDialog(
      new ActivityPrompt(USER_PROMPT, this.userDetailsFormValidator)
    );

    this.addDialog(
      new WaterfallDialog(WATERFALL_DIALOG, [
        this.choosePizzaStep.bind(this),
        this.chooseSizeStep.bind(this),
        this.chooseToppingsStep.bind(this),
        this.quantityStep.bind(this),
        this.confirmAbovePizzaOrder.bind(this),
        this.giveUserDetailsStep.bind(this),
        this.populateBillAndAskForPaymentOption.bind(this),
        this.summary.bind(this),
      ])
    );
    this.initialDialogId = WATERFALL_DIALOG;
  }

  async choosePizzaStep(step) {
    step.context.sendActivity("Now Choose the choice you want");

    let choosePizzaCard = await ModifyAdaptiveCard.modifyChoosePizzaCard();

    const pizzaForm = MessageFactory.attachment(
      CardFactory.adaptiveCard(choosePizzaCard)
    );

    return await step.prompt(PIZZA_PROMPT, {
      prompt: pizzaForm,
    });
  }

  async pizzaFormValidator(prompt) {
    const activity = prompt.recognized.value;

    if (activity.type == ActivityTypes.Message) {
      if (activity.value) {
        prompt.recognized.value = activity.value;
        return true;
      } else {
        await prompt.context.sendActivity(`Please fill the form and submit`);
      }
    }
  }

  async chooseSizeStep(step) {
    step.values.pizza = step.result.pizzachoice;

    let sizesArray = await ModifyAdaptiveCard.getSizesArray();

    return await step.prompt(CHOICE_PROMPT, {
      prompt: "Please Enter your Pizza Size",
      choices: ChoiceFactory.toChoices(sizesArray),
    });
  }

  async chooseToppingsStep(step) {
    step.values.size = step.result.value;

    await step.context.sendActivity(`You've selected ${step.values.size}`);

    const toppingsForm = MessageFactory.attachment(
      CardFactory.adaptiveCard(toppingsChoiceCard)
    );

    return await step.prompt(TOPPINGS_PROMPT, {
      prompt: toppingsForm,
    });
  }

  async toppingsFormValidator(prompt) {
    const activity = prompt.recognized.value;

    if (activity.type == ActivityTypes.Message) {
      if (activity.value) {
        prompt.recognized.value = activity.value;
        return true;
      } else {
        await prompt.context.sendActivity(`Please fill the form and submit`);
      }
    }
  }

  async quantityStep(step) {
    step.values.toppings = step.result.toppingsChoice;

    let message = `You've choosen ${step.result.toppingsChoice}. Now give the number of pizza quantity`;

    await step.context.sendActivity(message);

    const promptOptions = {
      prompt: "Quantity Required",
      retryPrompt: "Value must be greater than 0 and less than 150",
    };

    return step.prompt(NUMBER_PROMPT, promptOptions);
  }

  async quantityPromptValidator(promptContext) {
    // This condition is our validation rule. You can also change the value at this point.
    return (
      promptContext.recognized.succeeded &&
      promptContext.recognized.value > 0 &&
      promptContext.recognized.value < 150
    );
  }

  async confirmAbovePizzaOrder(step) {
    step.values.quantity = step.result;

    let message = `You've Ordered ${step.values.quantity} ${step.values.size} ${step.values.pizza} with ${step.values.toppings} toppings. Would you like to confirm it? `;

    return await step.prompt(CONFIRM_PROMPT, { prompt: message });
  }

  async giveUserDetailsStep(step) {
    if (step.result) {
      let message = `Now please provide your details down below`;

      await step.context.sendActivity(message);

      const userForm = MessageFactory.attachment(
        CardFactory.adaptiveCard(userDetails)
      );

      return await step.prompt(USER_PROMPT, { prompt: userForm });
    } else {
      await step.context.sendActivity("Okay, we have cancelled the order");
    }

    return await step.endDialog();
  }

  async userDetailsFormValidator(prompt) {
    const activity = prompt.recognized.value;

    if (activity.type == ActivityTypes.Message) {
      if (activity.value) {
        prompt.recognized.value = activity.value;
        return true;
      } else {
        await prompt.context.sendActivity(`Please fill the form and submit`);

        await prompt.context.sendActivity(`Type anything to order again`);
      }
    }
  }

  async populateBillAndAskForPaymentOption(step) {
    step.values.userDetails = step.result;

    const userForm = MessageFactory.attachment(
      CardFactory.adaptiveCard(billForm)
    );

    await step.context.sendActivity(userForm);

    return await step.prompt(CHOICE_PROMPT, {
      prompt: "Please Enter your Choice of Payment",
      choices: ChoiceFactory.toChoices([
        "COD",
        "Credit/Debit Card",
        "UPI Payment",
      ]),
    });
  }

  // async BillFormValidator(prompt) {
  //   const activity = prompt.recognized.value;

  //   if (activity.type == ActivityTypes.Message) {
  //     if (activity.value) {
  //       prompt.recognized.value = activity.value;
  //       return true;
  //     } else {
  //       await prompt.context.sendActivity(`Please fill the form and submit`);
  //     }
  //   }
  // }

  async summary(step) {
    step.values.paymentMethod = step.result;

    console.log(step.result);

    let message = `Congratulations!, you've ordered ${step.values.quantity} ${step.values.size} ${step.values.pizza} with ${step.values.toppings} toppings `;

    await step.context.sendActivity(message);

    return await step.endDialog();
  }

  async run(turnContext, accessor) {
    const dialogSet = new DialogSet(accessor);

    dialogSet.add(this);

    const dialogContext = await dialogSet.createContext(turnContext);
    const results = await dialogContext.continueDialog();
    if (results.status == DialogTurnStatus.empty) {
      await dialogContext.beginDialog(this.id);
    }
  }
}

module.exports.MainDialog = MainDialog;
