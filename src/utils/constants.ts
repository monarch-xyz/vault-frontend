export const AGENT_NAME = 'WoWo'; 

// Define all possible activity types
export enum ActivityType {
  // Agent lifecycle
  AGENT_STARTED = "agent_started",
  IDLE = "idle",
  AGENT_STOPPING = "agent_stopping",
  
  // Message handling
  MESSAGE_RECEIVED = "message_received",
  MESSAGE_RESPONDING = "message_responding",
  
  // Morpho Blue activities
  MB_DEPOSIT_DETECTED = "morpho_blue_deposit_detected",
  MB_WITHDRAWAL_DETECTED = "morpho_blue_withdrawal_detected",
  MB_BORROW_DETECTED = "morpho_blue_borrow_detected",
  MB_REPAY_DETECTED = "morpho_blue_repay_detected",
  
  // Morpho Vault activities
  MV_DEPOSIT_DETECTED = "morpho_vault_deposit_detected",
  MV_WITHDRAWAL_DETECTED = "morpho_vault_withdrawal_detected",
  
  // Periodic activities
  PERIODIC_ANALYSIS_STARTED = "periodic_analysis_started",
  PERIODIC_ANALYSIS_COMPLETED = "periodic_analysis_completed",
  
  // Data fetching activities
  DATA_FETCHING_STARTED = "data_fetching_started",
  MARKET_DATA_FETCHED = "market_data_fetched",
  VAULT_DATA_FETCHED = "vault_data_fetched",
  
  // Reasoning activities
  REASONING_STARTED = "reasoning_started",
  REASONING_COMPLETED = "reasoning_completed",
  
  // Transaction activities
  TX_REALLOCATION = "tx_reallocation",
  TX_GET_ASSET_SHARE = "tx_get_asset_share",
  
  // Default state when no logs are available
  UNKNOWN = "unknown"
}
