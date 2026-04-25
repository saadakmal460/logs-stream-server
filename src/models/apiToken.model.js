const { mongoose } = require("../lib/mongo");

const apiTokenSchema = new mongoose.Schema(
  {
    project_id: String,
    owner_id: String,
    label: String,
    token: String,
    token_prefix: String,
    token_suffix: String,
    created_at: Date,
    last_used_at: Date,
  },
  { collection: "api_tokens" }
);

module.exports = mongoose.model("ApiToken", apiTokenSchema);
