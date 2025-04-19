const OpenAI = require("openai");
const { fetchAllProducts, searchProducts } = require("./productService");
const conversationService = require("./conversationService");
const logger = require("../utils/logger");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default conversation history size
const MAX_HISTORY_LENGTH = 10;

/**
 * Builds a system prompt with product data
 * @param {Array} products List of products
 * @param {Object} store Store information
 * @returns {string} Formatted system prompt
 */
function buildSystemPrompt(products, store = {}) {
  const productString = products
    .map(
      (p) =>
        `• ${p.name} - ${p.price} (${p.category}): ${p.description}`
    )
    .join("\n");

  return `
You are a helpful eCommerce assistant for ${store.name || 'our store'}. 
You should ONLY recommend products from the list below.

PRODUCT CATALOG:
${productString}

GUIDELINES:
- Do not invent or suggest items not listed above.
- Only suggest specific products from the list, by name and price.
- Be friendly, helpful, and conversational.
- If asked about shipping, mention that standard shipping takes 3-5 business days.
- For returns, mention our 30-day return policy.
- If you don't know the answer to a question, suggest contacting customer service.
- If asked about availability, check the inventory status before answering.
`;
}

/**
 * Generates a response from OpenAI based on user message and context
 * @param {string} userMessage The user's message
 * @param {string} source The source of products
 * @param {Object} store Store information 
 * @param {string} sessionId Session identifier for conversation history
 * @param {string} userId Optional user ID for authenticated users
 * @returns {string} AI-generated response
 */
async function getGPTResponse(userMessage, source = "woo", store = {}, sessionId = "default", userId = null) {
  try {
    // Check if the message contains a product search query
    const searchTerms = extractSearchTerms(userMessage);
    let productData = [];
    
    if (searchTerms) {
      // If we detected search intent, get matching products
      productData = await searchProducts(searchTerms, source, store);
      logger.debug('Search terms detected', { searchTerms, productsFound: productData.length });
    } else {
      // Otherwise fetch all products (could be optimized with caching)
      productData = await fetchAllProducts(source, store);
    }
    
    // Get conversation history from database
    let history;
    try {
      history = await conversationService.getConversationHistory(sessionId, MAX_HISTORY_LENGTH);
      logger.debug('Retrieved conversation history', { sessionId, messagesCount: history.length });
    } catch (error) {
      logger.warn('Failed to retrieve conversation history, using empty history', { error: error.message });
      history = [];
    }
    
    // Build the system prompt
    const systemPrompt = buildSystemPrompt(productData, store);
    
    // Prepare messages array for the API call
    const messages = [
      { role: "system", content: systemPrompt },
      // Add conversation history in the format OpenAI expects
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      // Add the current user message
      { role: "user", content: userMessage }
    ];

    // Call OpenAI API
    const chatCompletion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseContent = chatCompletion.choices[0].message.content;
    
    // Save both the user message and response to history in database
    try {
      await conversationService.storeMessage({
        sessionId,
        storeId: store.id || null,
        userId,
        role: "user",
        content: userMessage
      });
      
      await conversationService.storeMessage({
        sessionId,
        storeId: store.id || null,
        userId,
        role: "assistant",
        content: responseContent
      });
      
      logger.debug('Stored messages in conversation history', { sessionId });
    } catch (error) {
      logger.error('Failed to store messages in history', { error: error.message });
      // Continue even if storage fails
    }
    
    return responseContent;
  } catch (error) {
    logger.error("OpenAI API Error:", { error: error.message });
    throw new Error(`Failed to get AI response: ${error.message}`);
  }
}

/**
 * Extracts search terms from user message
 * @param {string} message User message
 * @returns {string|null} Search terms or null
 */
function extractSearchTerms(message) {
  // Check for common search patterns
  const searchPatterns = [
    /show me (.+)/i,
    /looking for (.+)/i,
    /search for (.+)/i,
    /find (.+)/i,
    /do you have (.+)/i
  ];
  
  for (const pattern of searchPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

/**
 * Clears conversation history for a session
 * @param {string} sessionId The session identifier
 * @returns {boolean} Success status
 */
async function clearConversationHistory(sessionId) {
  try {
    return await conversationService.clearConversationHistory(sessionId);
  } catch (error) {
    logger.error('Failed to clear conversation history', { error: error.message });
    throw error;
  }
}

module.exports = { 
  getGPTResponse,
  clearConversationHistory 
};
