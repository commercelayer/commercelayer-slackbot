# Commerce Layer Slackbot

The official Commerce Layer Slackbot for orders and returns summaries.

![A preview of the Commerce Layer Slackbot about page.](./static/app-details.png)

## What is Commerce Layer?

[Commerce Layer](https://commercelayer.io) is a multi-market commerce API and order management system that lets you add global shopping capabilities to any website, mobile app, chatbot, wearable, voice, or IoT device, with ease. Compose your stack with the best-of-breed tools you already mastered and love. Make any experience shoppable, anywhere, through a blazing-fast, enterprise-grade, and secure API.

## Table of Contents

- [Bot Features](#bot-features)
- [Getting Started](#getting-started)
- [Configuration Guide](#configuration-guide)
- [Commands Available](#commands-available)
- [Installation Guide](#installation-guide)
- [Contributors Guide](#contributors-guide)
- [Need Help?](#need-help)
- [License](#license)

---

## Bot Features

- [x] Commands to fetch the details of a particular `order` resource, a link to view the full resource in the dashboard, and the ability to checkout the order.
- [x] Commands to fetch the details of a particular `return` resource and a link to view the full resource in the dashboard.
- [x] Command to fetch the current total number and revenue of orders per day.
- [x] Command to fetch the current total number of returns per day.
- [ ] Automatic alerts for the total revenue of orders at the end of the day/week/month.
- [ ] Automatic alerts for the total number of returns at the end of the day/week/month.
- [ ] Your idea, [tell us](https://github.com/commercelayer/commercelayer-slackbot/issues/1) :).

|                                           |                                |
| ----------------------------------------- | ------------------------------ |
| ![A preview of the Commerce Layer Slackbot.](./static/fetch-order-w.png)   | ![A preview of the Commerce Layer Slackbot.](./static/fetch-return-b.png)    |

## Getting Started

The quickest way to get up and running is to use the "Add to Slack" button below to install the Slack bot into your Slack workspace (coming soon!). Alternatively you can [install from the Slack app directory](#) (coming soon!). After a successful installation, you will configure the bot by providing some required Commerce Layer application credentials.

<div align="center">
    <a href="#" target="_blank" rel="noopener noreferrer">
        <img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" />
    </a>
</div>

## Configuration Guide

Before you start using the Commerce Layer Slackbot, you need to provide some Commerce Layer [application credentials](https://docs.commercelayer.io/core/applications). Kindly follow the steps below to configure the app:

1. Find the app (Commerce Layer Bot) in the "Apps" section of your Slack workspace (most often at the bottom section).

2. You will see the home tab with some welcome information and a "Connect organization" button.

3. Click on that button and provide all the required credentials as seen in the image below.

![A preview of the Commerce Layer Slackbot configuration page.](./static/configure.png)

## Commands Available

The Commerce Layer Slackbot allows you to request certain resources by ID and other conditions (more to come). The returned response would be a summary of the requested resource with a link to view the resource(s) and checkout `pending` orders (for the `order` resource). The section below explains the available command and what they do.

### Fetch an order resource

Here are the available commands:

- `/cl order [order ID]` (fetch an order by ID)
- `/cl orders:last` and `/cl orders:p last` (fetch the last `placed` order)
- `/cl orders:a last` (fetch the last `approved` order)

These commands will return the following [Order](https://docs.commercelayer.io/core/v/api-reference/orders) and [Customer](https://docs.commercelayer.io/core/v/api-reference/customers) attributes: `id`, `placed_at`, `formatted_subtotal_amount`, `number`, `status`, `payment_status`, `fulfillment_status`, `shipping_address`, `billing_address`, `payment_method`, `shipment_number`, and `customer_email`.

### Fetch a return resource

Here are the available commands:

- `/cl return [return ID]` (fetch a return by ID)
- `/cl returns:last` and `/cl returns:r last` (fetch the last `requested` return)
- `/cl returns:a last` (fetch the last `approved` return)

These commands will return the following [Return](https://docs.commercelayer.io/core/v/api-reference/returns) and [Customer](https://docs.commercelayer.io/core/v/api-reference/customers) attributes: `id`, `created_at`, `number`, `status`, `origin_address`, `destination_address`, `stock_location`, and `skus_count`.

### Fetch the current total orders per day

The `/cl orders:today [currency code]` command will return:

- The total number of `placed` orders from all markets.
- The total number of placed orders from a market (based on the provided currency code).
- The total revenue for all orders.

> **Note**
>
> We ask for the currency code so we can return accurate aggregated reveneue per market due to differences in each market's currency.
>
> The aggregated report data are from between 00:00 o'clock till the time when the request is made.

### Fetch current returns per day

The `/cl returns:today` command will return the total number of `requested` returns from all markets.

## Installation Guide

If for any reason you want to set up your own server (most likely because you want to contribute to this project), kindly follow the steps below.

1. Create a [Commerce Layer account](https://dashboard.commercelayer.io/sign_up), set up your organization, and create the required commerce data resources for your market. You can follow the [onboarding tutorial](https://docs.commercelayer.io/developers/welcome/onboarding-tutorial) or [manual configuration guide](https://docs.commercelayer.io/developers/welcome/manual-configuration) to achieve this.

2. Create a demo Slack workspace and create a [new Slack app](https://api.slack.com/apps/new) (you can [read this Slack guide](https://slack.dev/bolt-js/tutorial/getting-started) to learn the basics of Slack applications).

3. Create a [Supabase account](https://app.supabase.com) and setup a new database project.

4. Clone this repository ([learn how to do this](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository)).

5. Rename the `/.env.example` file to `.env` and add the following credentials:

| **Variable**                      | **Description**                        |
| --------------------------------- | -------------------------------------  |
| `APPLICATION_MODE`                | This indicates if the instance of the project is in `development` or `production`. In production the credentials used are unique for all users sourced from a database while development using the local `.env` file.                                                       |
| `SLACK_BOT_TOKEN`                 | This is a [Slack bot token](https://api.slack.com/authentication/token-types#bot) that represents a bot associated with the app installed in a workspace.                                       |
| `SLACK_SIGNING_SECRET`            | This is the unique string key Slack generates for an app and is used to [verify requests](https://api.slack.com/authentication/verifying-requests-from-slack#about) from Slack with confidence by verifying signatures using the signing secret.                            |
| `SLACK_CLIENT_ID`                 | This is required along with the client secret to make Slack `oauth.v2.access` requests.                             |
| `SLACK_CLIENT_SECRET`             | This is required along with the client ID to make Slack `oauth.v2.access` requests.                                 |
| `SLACK_STATE_SECRET`              | This is used to avoid forgery attacks by passing in a unique value to the user being authenticated and checking it when a Slack `oauth.v2.access` requests completes.                                |
| `SLACK_APP_TOKEN`                 | This is a [Slack app-level token](https://api.slack.com/authentication/token-types#app) that represents an app across organizations, including installations by all individual users on all workspaces in a given organization.                                          |
| `CL_ORGANIZATION_SLUG`            | Your Commerce Layer organization slug. |
| `CL_ORGANIZATION_MODE`            | A string value that indicates the mode of your Commerce Layer account (the Developer plan is `test` and the [Growth and Enterprise plan](https://commercelayer.io/pricing) is `live`). This is used for external link routing to the dashboard.                             |
| `CL_CLIENT_ID`                    | Your Commerce Layer integration application client ID.                                                       |
| `CL_CLIENT_ID_CHECKOUT`           | Your Commerce Layer sales channel application client ID.                                                       |
| `CL_CLIENT_SECRET`                | Your Commerce Layer integration application client secret.                                                   |
| `SUPABASE_URL`                    | The API URL for your Supabase project (`https://your-project-id.supabase.co`).                                     |
| `SUPABASE_ANON_KEY`               | The anon key used when a user is not logged in for "anonymous access" during Supabase PostgREST API requests.                                                                    |

> **Note**
>
> For all Commerce Layer credentials, see: <https://docs.commercelayer.io/core/applications>.
>
> For all Slack credentials, see: <https://api.slack.com/authentication>.
>
> For all Supabase credentials, see: <https://supabase.com/docs/guides/database>.

6. Run the command below to install the required dependencies:

```bash
npm install
```

7. Run the command below to automatically compile all TypeScript files into the `/build` folder with the same file structure:

```bash
npm run build
```

8. Run the command below to start the Nodejs server:

```bash
npm run start
```

9. Run the command below to start a [Ngrok](https://ngrok.com/download) server on port 3000; this will generate a URL (like `https://f09d-2a09-bac5.eu.ngrok.io`) proxied to `http://localhost:3000`.

```bash
npm run dev
```

10. Update your Slack app accordingly with the generated URL above or use these [manifest (JSON or YAML)](./manifests/) files as a template to easily [configure your Slack app](https://api.slack.com/reference/manifests).

<br />

Now you can proceed to do your thing!

## Contributors Guide

1. Fork [this repository](https://github.com/commercelayer/commercelayer-slackbot) (learn how to do this [here](https://help.github.com/articles/fork-a-repo)).

2. Clone the forked repository like so:

```bash
git clone https://github.com/<your username>/commercelayer-slackbot.git && cd commercelayer-slackbot
```

3. Make your changes and create a pull request ([learn how to do this](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request)).

4. Someone will attend to your pull request and provide some feedback.

## Need Help?

1. Join [Commerce Layer's Slack community](https://slack.commercelayer.app).

2. Create an [issue](https://github.com/commercelayer/sanity-template-commercelayer/issues) in this repository.

3. Ping us [on Twitter](https://twitter.com/commercelayer).

## License

This repository is published under the [MIT](LICENSE) license.

---

Want to learn more about how we built this project and how you can build yours? Then you should read [this article first](https://commercelayer.io/blog/how-we-built-the-commerce-layer-slackbot-with-node-js-and-slack-api) and [this next](#) on our blog.
