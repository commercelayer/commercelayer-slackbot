import * as dotenv from "dotenv";
dotenv.config();

import { App, LogLevel } from "@slack/bolt";
import { getOrderById, getLastOrder, getTodaysOrder } from "./src/orders/getOrders";
import { getReturnById, getLastReturn, getTodaysReturn } from "./src/returns/getReturns";
import { database } from "./src/database/supabaseClient";
import { customError } from "./src/utils/customError";
import { formatTimestamp } from "./src/utils/parseDate";
import { initConfig } from "./src/utils/config";

const app = new App({
  logLevel: LogLevel.DEBUG,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: [
    "channels:history",
    "chat:write",
    "chat:write.public",
    "commands",
    "groups:history",
    "im:history",
    "im:write",
    "incoming-webhook",
    "mpim:history",
    "mpim:write",
    "users:read"
  ],
  installationStore: {
    storeInstallation: async (installation, logger) => {
      logger.info("STORING SLACK INSTALLATION.....");
      if (installation.isEnterpriseInstall && installation.enterprise !== undefined) {
        const { data, error } = await database.from("users").insert({
          slack_id: installation.enterprise.id,
          slack_installation_store: installation,
          is_enterprise: installation.isEnterpriseInstall
        });
        if (error) throw error;
        return data;
      }
      if (installation.team !== undefined) {
        const { data, error } = await database.from("users").insert({
          slack_id: installation.team.id,
          slack_installation_store: installation,
          is_enterprise: installation.isEnterpriseInstall
        });
        if (error) throw error;
        return data;
      }
      throw new Error("Failed saving installation data to installationStore.");
    },
    fetchInstallation: async (installQuery, logger) => {
      logger.info("FETCHING SLACK INSTALLATION.....");
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        const { data, error } = await database
          .from("users")
          .select("slack_installation_store")
          .eq("slack_id", installQuery.enterpriseId);
        if (error) throw error;
        return data[0].slack_installation_store;
      }
      if (installQuery.teamId !== undefined) {
        const { data, error } = await database
          .from("users")
          .select("slack_installation_store")
          .eq("slack_id", installQuery.teamId);
        if (error) throw error;
        return data[0].slack_installation_store;
      }
      throw new Error("Failed fetching installation.");
    },
    deleteInstallation: async (installQuery, logger) => {
      logger.info("DELETING SLACK INSTALLATION.....");
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        const { data, error } = await database
          .from("users")
          .delete()
          .eq("slack_id", installQuery.enterpriseId);
        if (error) throw error;
        return data;
      }
      if (installQuery.teamId !== undefined) {
        const { data, error } = await database
          .from("users")
          .delete()
          .eq("slack_id", installQuery.teamId);
        if (error) throw error;
        return data;
      }
      throw new Error("Failed to delete installation.");
    }
  },
  installerOptions: {
    directInstall: true,
    callbackOptions: {
      failure: (error, _installation, _req, res) => {
        if (error.code === "23505") {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          const html = `<html>
          <head>
          <style>
          body {
            padding: 10px 15px;
            font-family: verdana;
            text-align: center;
          }
          </style>
          </head>
          <body>
          <h2>Oops, Something Went Wrong!</h2>
          <p>Commerce Layer Bot 🤖 is already installed in this Slack workspace.</p>
          <p>You can go ahead and start using the existing installation.</p>
          <br />
          <p>Please try again or contact the app owner (reason: ${error.code})</p>
          </body>
          </html>`;
          res.end(html);
        }
      }
    }
  }
});

// Listen to the app_uninstalled and tokens_revoked events.
// Temporal delete implementation until Bolt supports this natively.
// See: https://github.com/slackapi/bolt-js/issues/1203.
app.event("app_uninstalled" || "tokens_revoked", async ({ logger, context }) => {
  logger.info("DELETING SLACK INSTALLATION.....");
  const { data, error } = await database
    .from("users")
    .delete()
    .eq("slack_id", context.teamId || context.enterpriseId);
  if (error) logger.error("Failed to delete installation.", error);
  return data;
});

// Listen to the app_home_opened event (App Home Tab).
app.event("app_home_opened", async ({ client, logger, context, payload }) => {
  const userId = payload.user;
  const { data, error } = await database
    .from("users")
    .select("slack_installation_store")
    .eq("slack_id", context.teamId || context.enterpriseId);
  if (error) throw error;
  const adminUserId = data[0].slack_installation_store.user.id;

  try {
    await client.views.publish({
      user_id: userId,
      view: {
        type: "home",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Welcome, <@${userId}>! :wave:*`
            }
          },
          {
            type: "image",
            image_url: "https://data.commercelayer.app/assets/images/banners/violet-half.jpg",
            alt_text: "Commerce Layer banner image."
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "The *Commerce Layer App* lets you get orders and returns summaries and checkout `pending` orders from all markets in your organization. You can see all the features and available slash commands in the <https://github.com/commercelayer/commercelayer-slackbot#bot-features|public documentation>."
            }
          },
          {
            type: "divider"
          },
          userId === adminUserId
            ? {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "To get started, we need you to connect your organization by providing some credentials."
                },
                accessory: {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Connect organization",
                    emoji: true
                  },
                  style: "primary",
                  value: "cl_org",
                  action_id: "action_connect_cl_org"
                }
              }
            : {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `To get started, ask the workspace admin to configure this app if they haven't yet :wink:.`
                }
              }
        ]
      }
    });
  } catch (error) {
    logger.error(error);
  }
});

// Listen to the trigger button (Configuration Form Modal).
app.action(
  { action_id: "action_connect_cl_org", type: "block_actions" },
  async ({ ack, body, client, logger }) => {
    await ack();

    try {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: "modal",
          callback_id: "callback_cl_modal_view",
          title: {
            type: "plain_text",
            text: "Configure CL Slackbot"
          },
          submit: {
            type: "plain_text",
            text: "Submit",
            emoji: true
          },
          close: {
            type: "plain_text",
            text: "Cancel",
            emoji: true
          },
          blocks: [
            {
              type: "input",
              block_id: "block_cl_slug",
              element: {
                type: "plain_text_input",
                action_id: "action_cl_slug"
              },
              label: {
                type: "plain_text",
                text: "Organization Slug"
              },
              hint: {
                type: "plain_text",
                text: "E.g., cake-store"
              }
            },
            {
              type: "input",
              block_id: "block_cl_mode",
              element: {
                type: "static_select",
                options: [
                  {
                    text: {
                      type: "plain_text",
                      text: "Test",
                      emoji: true
                    },
                    value: "test"
                  },
                  {
                    text: {
                      type: "plain_text",
                      text: "Live",
                      emoji: true
                    },
                    value: "live"
                  }
                ],
                action_id: "action_cl_mode"
              },
              label: {
                type: "plain_text",
                text: "Organization Mode"
              }
            },
            {
              type: "input",
              block_id: "block_cl_client_id",
              element: {
                type: "plain_text_input",
                action_id: "action_cl_client_id"
              },
              label: {
                type: "plain_text",
                text: "Integration Client ID"
              },
              hint: {
                type: "plain_text",
                text: "This is needed for API requests."
              }
            },
            {
              type: "input",
              block_id: "block_cl_client_secret",
              element: {
                type: "plain_text_input",
                action_id: "action_cl_client_secret"
              },
              label: {
                type: "plain_text",
                text: "Integration Client Secret"
              }
            },
            {
              type: "input",
              block_id: "block_cl_sales_client_id",
              element: {
                type: "plain_text_input",
                action_id: "action_cl_sales_client_id"
              },
              label: {
                type: "plain_text",
                text: "Sales Channel Client ID"
              },
              hint: {
                type: "plain_text",
                text: "This is needed for hosted-checkout."
              }
            }
          ]
        }
      });
    } catch (error) {
      logger.error(error);
    }
  }
);

// Handle the view_submission request (Configuration Form Data).
app.view("callback_cl_modal_view", async ({ ack, body, view, client, logger }) => {
  await ack();

  const user = body.user.id;
  const slackId = body.team.id || body.enterprise.id;
  const formValuesObject = {
    slug: view["state"]["values"]["block_cl_slug"]["action_cl_slug"].value,
    mode: view["state"]["values"]["block_cl_mode"]["action_cl_mode"].selected_option.value,
    salesClientId: view["state"]["values"]["block_cl_client_id"]["action_cl_client_id"].value,
    salesClientSecret:
      view["state"]["values"]["block_cl_client_secret"]["action_cl_client_secret"].value,
    integrationClientId:
      view["state"]["values"]["block_cl_sales_client_id"]["action_cl_sales_client_id"].value
  };

  const credentialsData = await database
    .from("users")
    .update({
      cl_app_credentials: formValuesObject
    })
    .eq("slack_id", slackId);

  try {
    await client.chat.postMessage({
      channel: user,
      blocks:
        credentialsData.status === 204
          ? [
              {
                type: "section",
                text: {
                  type: "plain_text",
                  text: ":white_check_mark: Your organization credentials was submitted successfully."
                }
              },
              {
                type: "image",
                image_url: "https://media2.giphy.com/media/Gjoz5izVy7gSA/giphy.gif",
                alt_text: "GIF of a man dancing happily"
              }
            ]
          : [
              {
                type: "section",
                text: {
                  type: "plain_text",
                  text: ":warning: There was an error with your organization credentials submission. Please try again."
                }
              },
              {
                type: "image",
                image_url: "https://media3.giphy.com/media/snEeOh54kCFxe/giphy.gif§§",
                alt_text: "GIF of two sad men"
              }
            ]
    });
  } catch (error) {
    logger.error(error);
  }
});

// Acknowledge and respond to all requests to the /cl slash command.
app.command("/cl", async ({ command, client, ack, say }) => {
  await ack();

  const slackId = command.team_id || command.enterprise_id;
  const config = await initConfig(slackId);

  if (command.text.startsWith("order ")) {
    const resourceType = getOrderById(command.text.replace("order ", ""), config);
    getOrderResource(resourceType, command, client, say);
  } else if (command.text === "orders:p last" || command.text === "orders:last") {
    const resourceType = getLastOrder("placed", config);
    getOrderResource(resourceType, command, client, say);
  } else if (command.text === "orders:a last") {
    const resourceType = getLastOrder("approved", config);
    getOrderResource(resourceType, command, client, say);
  }

  if (command.text.startsWith("return ")) {
    const resourceType = getReturnById(command.text.replace("return ", ""), config);
    getReturnResource(resourceType, command, client, say);
  } else if (command.text === "returns:r last" || command.text === "returns:last") {
    const resourceType = getLastReturn("requested", config);
    getReturnResource(resourceType, command, client, say);
  } else if (command.text === "returns:a last") {
    const resourceType = getLastReturn("approved", config);
    getReturnResource(resourceType, command, client, say);
  }

  if (command.text.startsWith("orders:today ")) {
    const resourceType = getTodaysOrder(command.text.replace("orders:today ", ""), config);
    countOrders(resourceType, command, client, say);
  }

  if (command.text.startsWith("returns:today")) {
    const resourceType = getTodaysReturn(config);
    countReturns(resourceType, command, client, say);
  }
});

// Respond with 200 OK since all Slack buttons dispatch a request.
app.action("view_customer", ({ ack }) => ack());
app.action("check_order", ({ ack }) => ack());
app.action("view_return", ({ ack }) => ack());

// Fetch all orders summary requests.
const getOrderResource = async (resourceType, userInput, client, say) => {
  const triggerUser = await client.users.info({
    user: userInput.user_id
  });
  const resource = await resourceType;

  if (!resource.orders) {
    await say({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `> :warning: Command ${"`"}${userInput.command} ${
              userInput.text
            }${"`"} failed with error: ${"```"}${JSON.stringify(
              customError("Order"),
              null,
              2
            )}${"```"}`
          }
        }
      ],
      text: customError("Order")
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
            }* market has a total amount of *${
              resource.orders.formatted_subtotal_amount
            }* and was ${
              resource.orders.placed_at !== null ? "placed" : "created"
            } on <!date^${formatTimestamp(
              resource.orders.placed_at !== null
                ? resource.orders.placed_at
                : resource.orders.created_at
            )}^{date_long} at {time}|${
              resource.orders.placed_at !== null
                ? resource.orders.placed_at
                : resource.orders.created_at
            }>. Here's a quick summary of the resource:`
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
                  ? resource.orders.billing_address.full_name +
                    ", " +
                    resource.orders.billing_address.full_address
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
                resource.orders.payment_method !== null
                  ? resource.orders.payment_method.name
                  : "null"
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
                        }/${resource.organizationSlug}/resources/shipments/${shipment.id}|${
                          shipment.number
                        }>, `;
                      } else {
                        return `<https://dashboard.commercelayer.io/${
                          resource.organizationMode === "live" ? "live" : "test"
                        }/${resource.organizationSlug}/resources/shipments/${shipment.id}|${
                          shipment.number
                        }>`;
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
            resource.orders.status === "pending"
              ? {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Checkout Order",
                    emoji: true
                  },
                  style: "primary",
                  value: "checkout_order",
                  url: `https://${resource.organizationSlug}.checkout.commercelayer.app/${resource.orders.id}?accessToken=${resource.checkoutAccessToken}`,
                  action_id: "check_order"
                }
              : {
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
                },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View Customer",
                emoji: true
              },
              value: "view_customer",
              url: `https://dashboard.commercelayer.io/${
                resource.organizationMode === "live" ? "live" : "test"
              }/${resource.organizationSlug}/resources/customers/${
                resource.orders.customer !== null ? resource.orders.customer.id : "null"
              }`,
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
              alt_text: `${
                triggerUser.user.profile.display_name || triggerUser.user.profile.real_name
              }'s avatar`
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
      text: `:shopping_trolley: Order ${"`"}${resource.orders.id}${"`"} from the *${
        resource.orders.market.name
      }* market has a total amount of *${resource.orders.formatted_subtotal_amount}* and was ${
        resource.orders.placed_at !== null ? "placed" : "created"
      } on <!date^${formatTimestamp(
        resource.orders.placed_at !== null ? resource.orders.placed_at : resource.orders.created_at
      )}^{date_long} at {time}|${
        resource.orders.placed_at !== null ? resource.orders.placed_at : resource.orders.created_at
      }>.`
    });
  }
};

// Fetch all returns summary requests.
const getReturnResource = async (resourceType, userInput, client, say) => {
  const triggerUser = await client.users.info({
    user: userInput.user_id
  });
  const resource = await resourceType;

  if (!resource.returns) {
    await say({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `> :warning: Command ${"`"}${userInput.command} ${
              userInput.text
            }${"`"} failed with error: ${"```"}${JSON.stringify(
              customError("Return"),
              null,
              2
            )}${"```"}`
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
            }* market includes *${
              resource.returns.skus_count
            }* line items, is to be shipped to the *${
              resource.returns.stock_location.name
            }*, and was created on <!date^${formatTimestamp(
              resource.returns.created_at
            )}^{date_long} at {time}|${
              resource.returns.created_at
            }>. Here's a quick summary of the resource:`
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
                  ? resource.returns.origin_address.full_name +
                    ", " +
                    resource.returns.origin_address.full_address
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
              url: `https://dashboard.commercelayer.io/${
                resource.organizationMode === "live" ? "live" : "test"
              }/${resource.organizationSlug}/resources/returns/${resource.returns.id}`,
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
              url: `https://dashboard.commercelayer.io/${
                resource.organizationMode === "live" ? "live" : "test"
              }/${resource.organizationSlug}/resources/customers/${
                resource.returns.customer !== null ? resource.returns.customer.id : "null"
              }`,
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
              alt_text: `${
                triggerUser.user.profile.display_name || triggerUser.user.profile.real_name
              }'s avatar`
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
      }* market includes *${resource.returns.skus_count}* line items, is to be shipped to the *${
        resource.returns.stock_location.name
      }*, and was created on <!date^${formatTimestamp(
        resource.returns.created_at
      )}^{date_long} at {time}|${resource.returns.created_at}>.`
    });
  }
};

// Fetch all orders count requests.
const countOrders = async (resourceType, userInput, client, say) => {
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
              text: `Here's the progress in *<https://dashboard.commercelayer.io/organizations/${resource.organizationSlug}/settings/information|${resource.organizationSlug}>* for today 🤭:`
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Total number of placed orders (all markets):*\n${resource.allOrdersCount}`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Total number of placed orders (${resource.currencyName}):*\n${resource.allOrdersByMarketCount}`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Total revenue:*\n${resource.revenueCount}`
            }
          },
          {
            type: "context",
            elements: [
              {
                type: "image",
                image_url: `${triggerUser.user.profile.image_72}`,
                alt_text: `${
                  triggerUser.user.profile.display_name || triggerUser.user.profile.real_name
                }'s avatar`
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
        text: `Here's the progress in *<https://dashboard.commercelayer.io/organizations/${resource.organizationSlug}/settings/information|${resource.organizationSlug}>* for today 🤭:\n *Total number of placed orders (all markets):*\n${resource.recordCount} \n *Total number of placed orders (${resource.currencyName}):*\n${resource.allOrdersByMarketCount} \n *Total revenue:*\n${resource.recordCount}`
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

// Fetch all returns count requests.
const countReturns = async (resourceType, userInput, client, say) => {
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
                text: `*Total number of requested returns:*\n${resource.recordCount}`
              }
            ]
          },
          {
            type: "context",
            elements: [
              {
                type: "image",
                image_url: `${triggerUser.user.profile.image_72}`,
                alt_text: `${
                  triggerUser.user.profile.display_name || triggerUser.user.profile.real_name
                }'s avatar`
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
        text: `Here's the progress in *<https://dashboard.commercelayer.io/organizations/${resource.organizationSlug}/settings/information|${resource.organizationSlug}>* for today 🤭:\n *Total number of requested returns:*\n${resource.recordCount}`
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
