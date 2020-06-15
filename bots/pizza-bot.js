const { ActivityHandler, CardFactory } = require("botbuilder");

const welcomeCard = require("../resources/welcomeCard.json");

class PizzaBot extends ActivityHandler {
  constructor(conversationState, userState, dialog) {
    super();

    if (!conversationState)
      throw new Error("[PizzaBot] Conversation State not given");

    if (!userState) throw new Error("[PizzaBot] User State not given ");

    if (!dialog) throw new Error("[PizzaBot] Dialog Not given");

    this.conversationState = conversationState;

    this.userState = userState;

    this.dialog = dialog;

    this.dialogState = this.conversationState.createProperty("DialogState");

    this.onMembersAdded(async (turnContext, next) => {
      const membersAdded = turnContext.activity.membersAdded;

      for (let cnt in membersAdded) {
        if (membersAdded[cnt].id !== turnContext.activity.recipient.id) {
          const welcomeCardInBot = CardFactory.adaptiveCard(welcomeCard);

          await turnContext.sendActivity({ attachments: [welcomeCardInBot] });
        }
      }

      await next();
    });

    this.onMessage(async (context, next) => {
      console.log("Main Dialog");
      await this.dialog.run(context, this.dialogState);
      await next();
    });
  }

  async run(context) {
    await super.run(context);

    await this.conversationState.saveChanges(context, false);
    await this.userState.saveChanges(context, false);
  }
}

module.exports.PizzaBot = PizzaBot;
