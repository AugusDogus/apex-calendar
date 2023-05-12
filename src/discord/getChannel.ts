import type { Client, CommandInteraction } from 'discord.js';

type Props =
  | { interaction?: undefined; client: Client; channelId: string }
  | { interaction: CommandInteraction; client: Client; channelId?: undefined };

function isClientChannelIdProps(props: Props): props is { interaction?: undefined; client: Client; channelId: string } {
  return 'channelId' in props && typeof props.channelId === 'string';
}

export const getChannel = async (props: Props) => {
  const id = getChannelId(props);
  const channel = props.client.channels.cache.get(id);
  if (channel) return channel;
  return await props.client.channels.fetch(id);
};

const getChannelId = (props: Props) => {
  if (isClientChannelIdProps(props)) {
    return props.channelId;
  } else {
    return props.interaction?.channelId;
  }
};
