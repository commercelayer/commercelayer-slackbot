import * as dotenv from "dotenv";
dotenv.config();

import slackPkg from "@slack/bolt";
import { getOrderById, getLastOrder, getTodaysOrder } from "./src/orders/getOrders.js";
import { getReturnById, getLastReturn } from "./src/returns/getReturns.js";
import { customError } from "./src/utils/customError.js";
import { formatDate } from "./src/utils/parseDate.js";

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
  } else if (command.text === "order:p last" || command.text === "order:last") {
    const resourceType = getLastOrder("placed");
    getOrderResource(resourceType, command, client, say);
  } else if (command.text === "order:a last") {
    const resourceType = getLastOrder("approved");
    getOrderResource(resourceType, command, client, say);
  }

  if (command.text.startsWith("return ")) {
    const resourceType = getReturnById(command.text.replace("return ", ""));
    getReturnResource(resourceType, command, client, say);
  } else if (command.text === "return:r last" || command.text === "return:last") {
    const resourceType = getLastReturn("requested");
    getReturnResource(resourceType, command, client, say);
  } else if (command.text === "return:a last") {
    const resourceType = getLastReturn("approved");
    getReturnResource(resourceType, command, client, say);
  }

  if (command.text.startsWith("orders:today")) {
    const resourceType = getTodaysOrder();
    countOrders(resourceType, command, client, say);
  }

  // Respond with 200 OK since all Slack buttons dispatch a request.
  app.action("view_customer", ({ ack }) => ack());
  app.action("check_order", ({ ack }) => ack());
  app.action("view_return", ({ ack }) => ack());
});

const getOrderResource = async (resourceType, userInput, client, say) => {
  const triggerUser = await client.users.info({
    user: userInput.user_id
  });
  await resourceType
    .then(async (resource) => {
      if (!resource.orders) {
        await say({
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `> :warning: Command ${"`"}${userInput.command} ${
                  userInput.text
                }${"`"} failed with error: ${"```"}${JSON.stringify(customError("Order"), null, 2)}${"```"}`
              }
            }
          ],
          text: customError("Return")
        });
      } else {
        await say({
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `:shopping_trolley: Order ${"`"}${resource.orders.id}${"`"} from the *${
                  resource.orders.market.name
                }* market has a total amount of *${resource.orders.formatted_subtotal_amount}* and was ${
                  resource.orders.placed_at !== null ? "placed" : "created"
                } on *${formatDate(
                  resource.orders.placed_at !== null ? resource.orders.placed_at : resource.orders.created_at
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
                  text: `*Customer email:*\n${
                    resource.orders.customer !== null ? resource.orders.customer.email : "null"
                  }`
                },
                {
                  type: "mrkdwn",
                  text: `*Customer ID:*\n<https://dashboard.commercelayer.io/${
                    resource.organizationMode === "live" ? "live" : "test"
                  }/${resource.organizationSlug}/resources/customers/${
                    resource.orders.customer !== null ? resource.orders.customer.id : "null"
                  }|${resource.orders.customer !== null ? resource.orders.customer.id : "null"}>`
                }
              ]
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Order number:*\n${"`"}${resource.orders.number}${"`"}`
                },
                {
                  type: "mrkdwn",
                  text: `*Order status:*\n${"`"}${resource.orders.status}${"`"}`
                }
              ]
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Payment status:*\n${"`"}${resource.orders.payment_status}${"`"}`
                },
                {
                  type: "mrkdwn",
                  text: `*Fulfillment status:*\n${"`"}${resource.orders.fulfillment_status}${"`"}`
                }
              ]
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Shipping address:*\n${
                    resource.orders.shipping_address !== null
                      ? resource.orders.shipping_address.full_name +
                        ", " +
                        resource.orders.shipping_address.full_address
                      : "null"
                  }.`
                },
                {
                  type: "mrkdwn",
                  text: `*Billing address:*\n${
                    resource.orders.billing_address !== null
                      ? resource.orders.billing_address.full_name + ", " + resource.orders.billing_address.full_address
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
                  text: `*Payment method:*\n${
                    resource.orders.payment_method !== null ? resource.orders.payment_method.name : "null"
                  }`
                },
                {
                  type: "mrkdwn",
                  text: `*Shipment number(s):*\n${
                    resource.orders.shipments.length > 0
                      ? resource.orders.shipments.map((shipment) => {
                          // todo: remove , from last element in the array
                          if (resource.orders.shipments.length > 1) {
                            return `<https://dashboard.commercelayer.io/${
                              resource.organizationMode === "live" ? "live" : "test"
                            }/${resource.organizationSlug}/resources/shipments/${shipment.id}|${shipment.number}>, `;
                          } else {
                            return `<https://dashboard.commercelayer.io/${
                              resource.organizationMode === "live" ? "live" : "test"
                            }/${resource.organizationSlug}/resources/shipments/${shipment.id}|${shipment.number}>`;
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
                resource.orders.cart_url === null ||
                resource.orders.status === "placed" ||
                resource.orders.status === "approved"
                  ? {
                      type: "button",
                      text: {
                        type: "plain_text",
                        text: "View Order",
                        emoji: true
                      },
                      style: "primary",
                      value: "view_order",
                      url: `https://dashboard.commercelayer.io/${
                        resource.organizationMode === "live" ? "live" : "test"
                      }/${resource.organizationSlug}/resources/orders/${resource.orders.id}`,
                      action_id: "check_order"
                    }
                  : {
                      type: "button",
                      text: {
                        type: "plain_text",
                        text: "Checkout Order",
                        emoji: true
                      },
                      style: "primary",
                      value: "checkout_order",
                      url: `${resource.orders.cart_url}`,
                      action_id: "check_order"
                    },
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "View Customer",
                    emoji: true
                  },
                  value: "view_customer",
                  url: `https://dashboard.commercelayer.io/${resource.organizationMode === "live" ? "live" : "test"}/${
                    resource.organizationSlug
                  }/resources/customers/${resource.orders.customer !== null ? resource.orders.customer.id : "null"}`,
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
          text: `:shopping_trolley: resource ${"`"}${resource.orders.id}${"`"} from the *${
            resource.orders.market.name
          }* market has a total amount of *${
            resource.orders.formatted_subtotal_amount
          }* and was placed on *${formatDate(
            resource.orders.placed_at !== null ? resource.orders.placed_at : resource.orders.created_at
          )}*.`
        });
      }
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
      if (!resource.returns) {
        await say({
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `> :warning: Command ${"`"}${userInput.command} ${
                  userInput.text
                }${"`"} failed with error: ${"```"}${JSON.stringify(customError("Return"), null, 2)}${"```"}`
              }
            }
          ],
          text: customError("Return")
        });
      } else {
        await say({
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `:shopping_trolley: Return ${"`"}${resource.returns.id}${"`"} from the *${
                  resource.returns.order.country_code
                }* market includes *${resource.returns.skus_count}* line items, is to be shipped to the *${
                  resource.returns.stock_location.name
                }*, and was created on *${formatDate(
                  resource.returns.created_at
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
                  text: `*Customer email:*\n${
                    resource.returns.customer !== null ? resource.returns.customer.email : "null"
                  }`
                },
                {
                  type: "mrkdwn",
                  text: `*Customer ID:*\n<https://dashboard.commercelayer.io/${
                    resource.organizationMode === "live" ? "live" : "test"
                  }/${resource.organizationSlug}/resources/customers${
                    resource.returns.customer !== null ? resource.returns.customer.id : "null"
                  }|${resource.returns.customer !== null ? resource.returns.customer.id : "null"}>`
                }
              ]
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Return number:*\n${"`"}${resource.returns.number}${"`"}`
                },
                {
                  type: "mrkdwn",
                  text: `*Return status:*\n${"`"}${resource.returns.status}${"`"}`
                }
              ]
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Origin address:*\n${
                    resource.returns.origin_address !== null
                      ? resource.returns.origin_address.full_name + ", " + resource.returns.origin_address.full_address
                      : "null"
                  }.`
                },
                {
                  type: "mrkdwn",
                  text: `*Destination address:*\n${
                    resource.returns.destination_address !== null
                      ? resource.returns.destination_address.full_name +
                        ", " +
                        resource.returns.destination_address.full_address
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
                  url: `https://dashboard.commercelayer.io/${resource.organizationMode === "live" ? "live" : "test"}/${
                    resource.organizationSlug
                  }/resources/returns/${resource.returns.id}`,
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
                  url: `https://dashboard.commercelayer.io/${resource.organizationMode === "live" ? "live" : "test"}/${
                    resource.organizationSlug
                  }/resources/customers/${resource.returns.customer !== null ? resource.returns.customer.id : "null"}`,
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
          text: `:shopping_trolley: Return ${"`"}${resource.returns.id}${"`"} from the *${
            resource.returns.order.country_code
          }* market includes *${resource.skus_count}* line items, is to be shipped to the *${
            resource.returns.stock_location.name
          }*, and was created on *${formatDate(resource.returns.created_at)}*. Here's a quick summary of the resource:`
        });
      }
    })
    .catch(async (error) => {
      console.log(error);
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

const countOrders = async (resourceType, userInput, client, say) => {
  const triggerUser = await client.users.info({
    user: userInput.user_id
  });
  await resourceType
    .then(async (resource) => {
      console.log(resource);
      await say({
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Here's the progress in *<https://dashboard.commercelayer.io/organizations/${resource.organizationSlug}/settings/information|${resource.organizationSlug}>* for today 🤭:`
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
                text: `*Total number of placed orders:*\n${resource.recordCount}`
              },
              {
                type: "mrkdwn",
                text: `*Total revenue:*\n${resource.recordCount}`
              }
            ]
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
        text: `Here's the progress in *<https://dashboard.commercelayer.io/organizations/${resource.organizationSlug}/settings/information|${resource.organizationSlug}>* for today 🤭:\n *Total number of placed orders:*\n${resource.recordCount} \n *Total revenue:*\n${resource.recordCount}`
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
