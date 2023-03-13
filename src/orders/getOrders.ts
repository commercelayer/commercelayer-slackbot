import CommerceLayerPkg from "@commercelayer/sdk";
import { getToken, getCheckoutToken } from "../utils/getToken.js";
import { generateDate } from "../utils/parseDate.js";

const organizationSlug = process.env.CL_ORGANIZATION_SLUG;
const organizationMode = process.env.CL_ORGANIZATION_MODE;

const token = await getToken();
const CommerceLayer = CommerceLayerPkg.default;
const cl = CommerceLayer({
  organization: organizationSlug,
  accessToken: token
});

const getOrderById = async (id: string) => {
  const orders = await cl.orders.retrieve(id, {
    include: ["customer", "market", "shipments", "shipping_address", "billing_address", "payment_method"]
  });

  const checkoutAccessToken = await getCheckoutToken(orders.market.number);

  return { orders, organizationSlug, organizationMode, checkoutAccessToken };
};

const getLastOrder = async (status: string) => {
  const orders = (
    await cl.orders.list({
      include: ["customer", "market", "shipments", "shipping_address", "billing_address", "payment_method"],
      filters: { status_eq: `${status}` },
      sort: status === "placed" ? { placed_at: "desc" } : { approved_at: "desc" }
    })
  ).first();

  return { orders, organizationSlug, organizationMode };
};

const getTodaysOrder = async (currency: string) => {
  const currencyName = currency.toUpperCase();

  const allOrders = await cl.orders.list({
    filters: {
      status_eq: "placed",
      placed_at_gteq: `${generateDate("today")}}`,
      placed_at_lt: `${generateDate("next")}}`
    }
  });
  const allOrdersCount = allOrders.meta.recordCount;

  const allOrdersByMarket = await cl.orders.list({
    filters: {
      currency_code_eq: `${currencyName}`,
      status_eq: "placed",
      placed_at_gteq: `${generateDate("today")}}`,
      placed_at_lt: `${generateDate("next")}}`
    }
  });
  const allOrdersByMarketCount = allOrdersByMarket.meta.recordCount;

  const revenue = allOrdersByMarket.reduce((acc, order) => {
    return acc + order.total_amount_cents;
  }, 0);

  let revenueCount;
  allOrdersByMarketCount !== 0
    ? (revenueCount = (revenue / 100).toLocaleString(
        `${allOrdersByMarket[0].language_code}-${allOrdersByMarket[0].country_code}`,
        {
          style: "currency",
          currency: `${allOrdersByMarket[0].currency_code}`
        }
      ))
    : (revenueCount = 0);

  return {
    allOrdersCount,
    allOrdersByMarketCount,
    revenueCount,
    currencyName,
    organizationSlug
  };
};

export { getOrderById, getLastOrder, getTodaysOrder };
