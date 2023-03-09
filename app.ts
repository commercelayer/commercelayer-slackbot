import * as dotenv from "dotenv";
dotenv.config();

import slackPkg from "@slack/bolt";
import { getOrderById, getLastOrder } from "./src/orders/getOrders.js";
import { getReturnById, getLastReturn } from "./src/returns/getReturns.js";
import { formatDate } from "./src/utils/formatDate.js";

const { App } = slackPkg;
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// Acknowledge and respond to all requests to the /cl slash command.
app.command("/cl", async ({ command, client, ack, say }) => {
  await ack();

  if (command.text.startsWith("order ")) {
    const resourceType = getOrderById(command.text.replace("order ", ""));
    getOrderResource(resourceType, command, client, say);
  }
  if (command.text === "order:p last" || command.text === "order:last") {
    const resourceType = getLastOrder("placed");
    getOrderResource(resourceType, command, client, say);
  } else if (command.text === "order:a last") {
    const resourceType = getLastOrder("approved");
    getOrderResource(resourceType, command, client, say);
  }

  if (command.text.startsWith("return ")) {
    const resourceType = getReturnById(command.text.replace("return ", ""));
    getReturnResource(resourceType, command, client, say);
  }
  if (command.text === "return:r last" || command.text === "return:last") {
    const resourceType = getLastReturn("requested");
    getReturnResource(resourceType, command, client, say);
  } else if (command.text === "return:a last") {
    const resourceType = getLastReturn("approved");
    getReturnResource(resourceType, command, client, say);
  }

  // Respond with 200 OK since all Slack buttons dispatch a request.
  app.action("view_customer", ({ ack }) => ack());
  app.action("view_order", ({ ack }) => ack());
  app.action("view_return", ({ ack }) => ack());
});

const getOrderResource = async (resourceType, userInput, client, say) => {
  const triggerUser = await client.users.info({
    user: userInput.user_id
  });
  await resourceType
    .then(async (resource) => {
      await say({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `:shopping_trolley: Order ${"`"}${resource.id}${"`"} from the *${
                resource.market.name
              }* market has a total amount of *${resource.formatted_subtotal_amount}* and was ${
                resource.placed_at !== null ? "placed" : "created"
              } on *${formatDate(
                resource.placed_at !== null ? resource.placed_at : resource.created_at
              )}*. Here's a quick summary of the resource:`
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
                text: `*Customer email:*\n${resource.customer !== null ? resource.customer.email : "null"}`
              },
              {
                type: "mrkdwn",
                text: `*Customer ID:*\n<https://${process.env.CL_ORGANIZATION_SLUG}.commercelayer.io/admin/customers/${
                  resource.customer !== null ? resource.customer.id : "null"
                }/edit|${resource.customer !== null ? resource.customer.id : "null"}>`
              }
            ]
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*resource number:*\n${"`"}${resource.number}${"`"}`
              },
              {
                type: "mrkdwn",
                text: `*resource status:*\n${"`"}${resource.status}${"`"}`
              }
            ]
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Shipping address:*\n${
                  resource.shipping_address !== null
                    ? resource.shipping_address.full_name + ", " + resource.shipping_address.full_address
                    : "null"
                }.`
              },
              {
                type: "mrkdwn",
                text: `*Billing address:*\n${
                  resource.billing_address !== null
                    ? resource.billing_address.full_name + ", " + resource.billing_address.full_address
                    : "null"
                }.`
              }
            ]
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Payment method:*\n${resource.payment_method !== null ? resource.payment_method.name : "null"}`
              },
              {
                type: "mrkdwn",
                text: `*Shipment number(s):*\n${
                  resource.shipments.length > 0
                    ? resource.shipments.map((shipment) => {
                        // todo: remove , from last element in the array
                        if (resource.shipments.length > 1) {
                          return `<https://${process.env.CL_ORGANIZATION_SLUG}.commercelayer.io/admin/shipments/${shipment.id}/edit|${shipment.number}>, `;
                        } else {
                          return `<https://${process.env.CL_ORGANIZATION_SLUG}.commercelayer.io/admin/shipments/${shipment.id}/edit|${shipment.number}>`;
                        }
                      })
                    : "null"
                }`
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
                url: `https://${process.env.CL_ORGANIZATION_SLUG}.commercelayer.io/admin/orders/${resource.id}/edit`,
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
                url: `https://${process.env.CL_ORGANIZATION_SLUG}.commercelayer.io/admin/customers/${
                  resource.customer !== null ? resource.customer.id : "null"
                }/edit`,
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
        text: `:shopping_trolley: resource ${"`"}${resource.id}${"`"} from the *${
          resource.market.name
        }* market has a total amount of *${resource.formatted_subtotal_amount}* and was placed on *${formatDate(
          resource.placed_at !== null ? resource.placed_at : resource.created_at
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
};

const getReturnResource = async (resourceType, userInput, client, say) => {
  const triggerUser = await client.users.info({
    user: userInput.user_id
  });
  await resourceType
    .then(async (resource) => {
      await say({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `:shopping_trolley: Return ${"`"}${resource.id}${"`"} from the *${
                resource.order.country_code
              }* market includes *${resource.skus_count}* line items, is to be shipped to the *${
                resource.stock_location.name
              }*, and was created on *${formatDate(resource.created_at)}*. Here's a quick summary of the resource:`
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
                text: `*Customer email:*\n${resource.customer !== null ? resource.customer.email : "null"}`
              },
              {
                type: "mrkdwn",
                text: `*Customer ID:*\n<https://${process.env.CL_ORGANIZATION_SLUG}.commercelayer.io/admin/customers/${
                  resource.customer !== null ? resource.customer.id : "null"
                }/edit|${resource.customer !== null ? resource.customer.id : "null"}>`
              }
            ]
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Return number:*\n${"`"}${resource.number}${"`"}`
              },
              {
                type: "mrkdwn",
                text: `*Return status:*\n${"`"}${resource.status}${"`"}`
              }
            ]
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Origin address:*\n${
                  resource.origin_address !== null
                    ? resource.origin_address.full_name + ", " + resource.origin_address.full_address
                    : "null"
                }.`
              },
              {
                type: "mrkdwn",
                text: `*Destination address:*\n${
                  resource.destination_address !== null
                    ? resource.destination_address.full_name + ", " + resource.destination_address.full_address
                    : "null"
                }.`
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
                  text: "View Return",
                  emoji: true
                },
                style: "primary",
                value: "view_return",
                url: `https://${process.env.CL_ORGANIZATION_SLUG}.commercelayer.io/admin/returns/${resource.id}/edit`,
                action_id: "view_return"
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "View Customer",
                  emoji: true
                },
                value: "view_customer",
                url: `https://${process.env.CL_ORGANIZATION_SLUG}.commercelayer.io/admin/customers/${
                  resource.customer !== null ? resource.customer.id : "null"
                }/edit`,
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
        text: `:shopping_trolley: Return ${"`"}${resource.id}${"`"} from the *${
          resource.order.country_code
        }* market includes *${resource.skus_count}* line items, is to be shipped to the *${
          resource.stock_location.name
        }*, and was created on *${formatDate(resource.created_at)}*. Here's a quick summary of the resource:`
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
};

(async () => {
  await app.start(process.env.PORT || 3000);

  console.log("⚡️ Bolt app is running!");
})();
