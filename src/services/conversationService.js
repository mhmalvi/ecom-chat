/**
 * Conversation service for storing and retrieving chat history
 */

const supabase = require('../lib/supabase');
const logger = require('../utils/logger');

/**
 * Stores a message in the conversation history
 * @param {Object} message Message data to store
 * @returns {Object} Stored message
 */
async function storeMessage(message) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        session_id: message.sessionId,
        store_id: message.storeId,
        user_id: message.userId,
        role: message.role,
        content: message.content,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      logger.error('Failed to store message', { error: error.message });
      throw new Error(`Failed to store message: ${error.message}`);
    }

    return data;
  } catch (error) {
    logger.error('Error storing message', { error: error.message });
    throw error;
  }
}

/**
 * Retrieves conversation history for a session
 * @param {string} sessionId Session identifier
 * @param {number} limit Maximum number of messages to retrieve
 * @returns {Array} List of messages
 */
async function getConversationHistory(sessionId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })
      .limit(limit);

    if (error) {
      logger.error('Failed to retrieve conversation history', { error: error.message, sessionId });
      throw new Error(`Failed to retrieve conversation history: ${error.message}`);
    }

    return data;
  } catch (error) {
    logger.error('Error retrieving conversation history', { error: error.message });
    throw error;
  }
}

/**
 * Clears conversation history for a session
 * @param {string} sessionId Session identifier
 * @returns {boolean} Success status
 */
async function clearConversationHistory(sessionId) {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      logger.error('Failed to clear conversation history', { error: error.message, sessionId });
      throw new Error(`Failed to clear conversation history: ${error.message}`);
    }

    return true;
  } catch (error) {
    logger.error('Error clearing conversation history', { error: error.message });
    throw error;
  }
}

/**
 * Gets conversation statistics for a store
 * @param {string} storeId Store identifier
 * @returns {Object} Conversation statistics
 */
async function getConversationStats(storeId) {
  try {
    // Get total conversations count
    const { count: totalConversations, error: countError } = await supabase
      .from('messages')
      .select('session_id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .distinct();

    if (countError) {
      logger.error('Failed to get conversation count', { error: countError.message });
      throw new Error(`Failed to get conversation count: ${countError.message}`);
    }

    // Get message count
    const { count: totalMessages, error: messageError } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId);

    if (messageError) {
      logger.error('Failed to get message count', { error: messageError.message });
      throw new Error(`Failed to get message count: ${messageError.message}`);
    }

    // Get active sessions (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { count: activeSessions, error: activeError } = await supabase
      .from('messages')
      .select('session_id', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gt('timestamp', yesterday.toISOString())
      .distinct();

    if (activeError) {
      logger.error('Failed to get active sessions count', { error: activeError.message });
      throw new Error(`Failed to get active sessions count: ${activeError.message}`);
    }

    return {
      totalConversations,
      totalMessages,
      activeSessions,
      averageMessagesPerConversation: totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0
    };
  } catch (error) {
    logger.error('Error getting conversation stats', { error: error.message });
    throw error;
  }
}

module.exports = {
  storeMessage,
  getConversationHistory,
  clearConversationHistory,
  getConversationStats
}; 