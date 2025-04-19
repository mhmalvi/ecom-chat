const supabase = require("../lib/supabase");

async function getStoreByApiKey(apiKey) {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("api_key", apiKey)
    .single();

  if (error) {
    console.error("Failed to get store:", error.message);
    return null;
  }

  return data;
}

async function getStoreById(id) {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to get store by ID:", error.message);
    return null;
  }

  return data;
}

module.exports = { getStoreByApiKey, getStoreById };
