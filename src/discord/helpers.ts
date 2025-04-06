import type { Client, CommandInteraction } from 'discord.js';
import { tryCatch } from '../utils/try-catch';

type GetChannelProps =
  | { interaction?: undefined; client: Client; channelId: string }
  | { interaction: CommandInteraction; client: Client; channelId?: undefined };

const getChannelId = (props: GetChannelProps) => {
  if (props.interaction) {
    return props.interaction.channelId;
  }

  if (props.channelId) {
    return props.channelId;
  }

  return undefined;
};

export const getChannel = async (props: GetChannelProps) => {
  const id = getChannelId(props);
  if (!id) return undefined;

  const cachedChannel = props.client.channels.cache.get(id);
  if (cachedChannel) return cachedChannel;

  const { data: channel, error } = await tryCatch(props.client.channels.fetch(id));
  if (error) {
    console.error('Error fetching channel:', error);
    return undefined;
  }

  return channel;
};
