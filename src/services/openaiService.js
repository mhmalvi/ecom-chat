const OpenAI = require("openai");
const { fetchAllProducts } = require("./productService");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getGPTResponse(userMessage, source = "woo") {
  const productData = await fetchAllProducts(source);

  const productString = productData
    .map(
      (p) =>
        `• ${p.name} - ${p.price} (${p.category}): ${p.description}`
    )
    .join("\n");

  const systemPrompt = `
You are a helpful eCommerce assistant. ONLY recommend products from the list below.

PRODUCT CATALOG:
${productString}

Do not invent or suggest items not listed above.
Only suggest specific products from the list, by name and price.
`;

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.6,
    max_tokens: 300,
  });

  return chatCompletion.choices[0].message.content;
}

module.exports = { getGPTResponse };
