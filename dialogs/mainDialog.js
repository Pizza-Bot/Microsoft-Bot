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

const CONV_PROFILE = "CONV_PROFILE";
const TEXT_PROMPT = "TEXT_PROMPT";
const CHOICE_PROMPT = "CHOICE_PROMPT";
const NUMBER_PROMPT = "NUMBER_PROMPT";
const CONFIRM_PROMPT = "CONFIRM_PROMPT";
const PIZZA_PROMPT = "PIZZA_PROMPT";
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
    this.addDialog(new NumberPrompt(NUMBER_PROMPT));
    this.addDialog(new ActivityPrompt(PIZZA_PROMPT, this.pizzaFormValidator));

    this.addDialog(
      new WaterfallDialog(WATERFALL_DIALOG, [
        this.choosePizzaStep.bind(this),
        this.chooseSizeStep.bind(this),
        this.summary.bind(this),
      ])
    );
    this.initialDialogId = WATERFALL_DIALOG;
  }

  async choosePizzaStep(step) {
    step.context.sendActivity("Now Choose the choice you want");

    const pizzaForm = MessageFactory.attachment(
      CardFactory.adaptiveCard(choosePizzaCard)
    );

    return await step.prompt(PIZZA_PROMPT, {
      prompt: pizzaForm,
    });

    // return await step.prompt(CHOICE_PROMPT, {
    //   prompt: "Please Enter your Pizza Choice",
    //   choices: ChoiceFactory.toChoices([
    //     "Paneer Pizza",
    //     "Veg Pizza",
    //     "Egg Pizza",
    //   ]),
    // });
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

    return await step.prompt(CHOICE_PROMPT, {
      prompt: "Please Enter your Pizza Size",
      choices: ChoiceFactory.toChoices(["small", "medium", "large"]),
    });
  }

  async summary(step) {
    step.values.size = step.result.value;

    let message = `Congratulations!, you've ordered a ${step.values.size} ${step.values.pizza} `;

    await step.context.sendActivity(message);

    return await step.endDialog();
  }

  async run(turnContext, accessor) {
    const dialogSet = new DialogSet(accessor);

    dialogSet.add(this);

    const dialogContext = await dialogSet.createContext(turnContext);
    const results = await dialogContext.continueDialog();
    if (results.status == DialogTurnStatus.empty) {
      console.log("Inside run");
      await dialogContext.beginDialog(this.id);
    }
  }
}

module.exports.MainDialog = MainDialog;
