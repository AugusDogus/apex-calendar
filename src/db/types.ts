/**
 * Represents a guild's calendar monitoring configuration
 */
export type Guild = {
  /** The Discord guild (server) ID */
  id: string;
  /** The Discord channel ID where the calendar is posted */
  channelId: string;
  /** The Discord message ID of the calendar image */
  messageId: string;
};
