import CommerceLayerPkg from "@commercelayer/sdk";
import getToken from "../utils/getToken.js";

const token = await getToken();

const CommerceLayer = CommerceLayerPkg.default;
const cl = CommerceLayer({
  organization: process.env.CL_ORGANIZATION_SLUG,
  accessToken: token
});

const getOrder = async (orderID) => {
  return await cl.orders.retrieve(orderID, {
    include: ["customer", "market", "shipments", "shipping_address", "billing_address", "payment_method"]
  });
};

const getLastOrder = async () => {
  return (await cl.orders.list({})).last();
};

// fetch current total orders (count and revenue) for the current day

// fetch current total orders (count and revenue) for the week

// fetch current total orders (count and revenue) for the month

// fetch current total orders (count and revenue) for the year

// fetch current total orders (count and revenue) all time

export { getOrder, getLastOrder };
