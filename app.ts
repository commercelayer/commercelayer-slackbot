import * as dotenv from "dotenv";
dotenv.config();

import slackPkg from "@slack/bolt";
import { getOrder } from "./src/orders/getOrders.js";
import { formatDate } from "./src/utils/formatDate.js";

const { App } = slackPkg;
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// Acknowledge and respond to all requests to the /cl slash command.
app.command("/cl", async ({ command, client, ack, say }) => {
  await ack();

  getOrderByID(command, client, say);
});

// Respond with 200 OK to Slack API since all buttons dispatch a request.
app.action("view_order", ({ ack }) => ack());
app.action("view_customer", ({ ack }) => ack());

const getOrderByID = async (userInput, client, say) => {
  if (userInput.text.startsWith("order")) {
    const triggerUser = await client.users.info({
      user: userInput.user_id
    });
    await getOrder(userInput.text.replace("order ", ""))
      .then(async (order) => {
        await say({
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `:shopping_trolley: Order ${"`"}${order.id}${"`"} from the *${
                  order.market.name
                }* market has a total amount of *${order.formatted_subtotal_amount}* and was placed on *${formatDate(
                  order.placed_at
                )}*. Here's a quick summary of the order:`
              }
            },
            {
              type: "divider"
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Customer email:*\n${order.customer.email}`
                },
                {
                  type: "mrkdwn",
                  text: `*Customer ID:*\n<https://${process.env.CL_ORGANIZATION_SLUG}.commercelayer.io/admin/customers/${order.customer.id}/edit|${order.customer.id}>`
                }
              ]
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Order number:*\n${"`"}${order.number}${"`"}`
                },
                {
                  type: "mrkdwn",
                  text: `*Order status:*\n${"`"}${order.status}${"`"}`
                }
              ]
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Shipping address:*\n${order.shipping_address.full_name}, ${order.shipping_address.full_address}.`
                },
                {
                  type: "mrkdwn",
                  text: `*Billing address:*\n${order.billing_address.full_name}, ${order.billing_address.full_address}.`
                }
              ]
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Payment method:*\n${order.payment_method.name}.`
                },
                {
                  type: "mrkdwn",
                  text: `*Shipment number(s):*\n${order.shipments.map((shipment) => {
                    // todo: remove , from last element in the array
                    if (order.shipments.length > 1) {
                      return `<https://${process.env.CL_ORGANIZATION_SLUG}.commercelayer.io/admin/shipments/${shipment.id}/edit|${shipment.number}>, `;
                    } else {
                      return `<https://${process.env.CL_ORGANIZATION_SLUG}.commercelayer.io/admin/shipments/${shipment.id}/edit|${shipment.number}>`;
                    }
                  })}.`
                }
              ]
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "View Order",
                    emoji: true
                  },
                  style: "primary",
                  value: "view_order",
                  url: `https://${process.env.CL_ORGANIZATION_SLUG}.commercelayer.io/admin/orders/${order.id}/edit`,
                  action_id: "view_order"
                },
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "View Customer",
                    emoji: true
                  },
                  value: "view_customer",
                  url: `https://${process.env.CL_ORGANIZATION_SLUG}.commercelayer.io/admin/customers/${order.customer.id}/edit`,
                  action_id: "view_customer"
                }
              ]
            },
            {
              type: "divider"
            },
            {
              type: "context",
              elements: [
                {
                  type: "image",
                  image_url: `${triggerUser.user.profile.image_72}`,
                  alt_text: `${triggerUser.user.profile.display_name || triggerUser.user.profile.real_name}'s avatar`
                },
                {
                  type: "mrkdwn",
                  text: `${
                    triggerUser.user.profile.display_name || triggerUser.user.profile.real_name
                  } has triggered this request.`
                }
              ]
            }
          ],
          text: `:shopping_trolley: Order ${"`"}${order.id}${"`"} from the *${
            order.market.name
          }* market has a total amount of *${order.formatted_subtotal_amount}* and was placed on *${formatDate(
            order.placed_at
          )}*.`
        });
      })
      .catch(async (error) => {
        await say({
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `> :warning: Command ${"`"}${userInput.command} ${
                  userInput.text
                }${"`"} failed with error: ${"```"}${JSON.stringify(error, null, 2)}${"```"}`
              }
            }
          ],
          text: error
        });
      });
  }
};

(async () => {
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
