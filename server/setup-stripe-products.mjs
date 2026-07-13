/**
 * Setup Stripe Products and Prices for EAS Platform
 * 
 * Creates the actual products and recurring prices in Stripe,
 * then outputs the price IDs to be stored as environment variables.
 */
import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("STRIPE_SECRET_KEY not found in environment");
  process.exit(1);
}

const stripe = new Stripe(secretKey, { apiVersion: "2024-12-18.acacia" });

async function setup() {
  console.log("Setting up Stripe products and prices...\n");

  // Check if products already exist
  const existingProducts = await stripe.products.list({ limit: 10 });
  const existingNames = existingProducts.data.map(p => p.name);
  
  // --- Pro Technician Product ---
  let proProduct;
  const existingPro = existingProducts.data.find(p => p.name === "EAS Pro Technician");
  if (existingPro) {
    proProduct = existingPro;
    console.log(`Pro product already exists: ${proProduct.id}`);
  } else {
    proProduct = await stripe.products.create({
      name: "EAS Pro Technician",
      description: "Full access to all courses, scenarios, and AI-generated custom faults for individual technicians.",
    });
    console.log(`Created Pro product: ${proProduct.id}`);
  }

  // Pro Monthly Price ($49/month)
  let proMonthlyPrice;
  const existingProPrices = await stripe.prices.list({ product: proProduct.id, active: true, limit: 10 });
  proMonthlyPrice = existingProPrices.data.find(p => p.recurring?.interval === "month" && p.unit_amount === 4900);
  if (!proMonthlyPrice) {
    proMonthlyPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 4900, // $49.00
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { plan: "pro" },
    });
    console.log(`Created Pro Monthly price: ${proMonthlyPrice.id} ($49/mo)`);
  } else {
    console.log(`Pro Monthly price already exists: ${proMonthlyPrice.id}`);
  }

  // Pro Annual Price ($468/year = $39/month equivalent)
  let proAnnualPrice;
  proAnnualPrice = existingProPrices.data.find(p => p.recurring?.interval === "year" && p.unit_amount === 46800);
  if (!proAnnualPrice) {
    proAnnualPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 46800, // $468.00
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { plan: "proAnnual" },
    });
    console.log(`Created Pro Annual price: ${proAnnualPrice.id} ($468/yr)`);
  } else {
    console.log(`Pro Annual price already exists: ${proAnnualPrice.id}`);
  }

  // --- Team Product ---
  let teamProduct;
  const existingTeam = existingProducts.data.find(p => p.name === "EAS Team / Company");
  if (existingTeam) {
    teamProduct = existingTeam;
    console.log(`Team product already exists: ${teamProduct.id}`);
  } else {
    teamProduct = await stripe.products.create({
      name: "EAS Team / Company",
      description: "Per-seat pricing for maintenance departments. Includes team admin dashboard, progress tracking, and reporting.",
    });
    console.log(`Created Team product: ${teamProduct.id}`);
  }

  // Team Monthly Price ($29/seat/month)
  let teamMonthlyPrice;
  const existingTeamPrices = await stripe.prices.list({ product: teamProduct.id, active: true, limit: 10 });
  teamMonthlyPrice = existingTeamPrices.data.find(p => p.recurring?.interval === "month" && p.unit_amount === 2900);
  if (!teamMonthlyPrice) {
    teamMonthlyPrice = await stripe.prices.create({
      product: teamProduct.id,
      unit_amount: 2900, // $29.00 per seat
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { plan: "team" },
    });
    console.log(`Created Team Monthly price: ${teamMonthlyPrice.id} ($29/seat/mo)`);
  } else {
    console.log(`Team Monthly price already exists: ${teamMonthlyPrice.id}`);
  }

  // Team Annual Price ($290/seat/year = $24.17/month equivalent)
  let teamAnnualPrice;
  teamAnnualPrice = existingTeamPrices.data.find(p => p.recurring?.interval === "year" && p.unit_amount === 29000);
  if (!teamAnnualPrice) {
    teamAnnualPrice = await stripe.prices.create({
      product: teamProduct.id,
      unit_amount: 29000, // $290.00 per seat
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { plan: "teamAnnual" },
    });
    console.log(`Created Team Annual price: ${teamAnnualPrice.id} ($290/seat/yr)`);
  } else {
    console.log(`Team Annual price already exists: ${teamAnnualPrice.id}`);
  }

  console.log("\n=== PRICE IDS (set these as environment variables) ===");
  console.log(`STRIPE_PRO_PRICE_ID=${proMonthlyPrice.id}`);
  console.log(`STRIPE_PRO_ANNUAL_PRICE_ID=${proAnnualPrice.id}`);
  console.log(`STRIPE_TEAM_PRICE_ID=${teamMonthlyPrice.id}`);
  console.log(`STRIPE_TEAM_ANNUAL_PRICE_ID=${teamAnnualPrice.id}`);
  console.log("=====================================================\n");

  return {
    proMonthly: proMonthlyPrice.id,
    proAnnual: proAnnualPrice.id,
    teamMonthly: teamMonthlyPrice.id,
    teamAnnual: teamAnnualPrice.id,
  };
}

setup().then(ids => {
  console.log("Setup complete!", ids);
}).catch(err => {
  console.error("Setup failed:", err);
  process.exit(1);
});
