// Default variables that should be available in every project
export const DEFAULT_GLOBAL_VARIABLES: Record<string, string> = {
  username: "",
  password: "",
  base_url: "",
  api_key: "",
  token: "",
  tokenName: "x-access-token",
  refresh_token: "",
  refreshTokenName: "refresh_token",
};

// Default shared variables (empty array, but can be extended)
export const DEFAULT_SHARED_VARIABLES: Array<{ key: string; value: string }> = [
  // Add any default shared variables here if needed
  // { key: "default_header", value: "application/json" },
  // { key: "timeout", value: "30000" },
];
