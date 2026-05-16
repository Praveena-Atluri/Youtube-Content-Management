export type YouTubeChannel = {
  channelId: string;
  name: string;
  handle?: string;
};

// Telugu news & media channels — mirrors the RSS feed sources
// Channel IDs can be found in the channel's YouTube URL: youtube.com/channel/<id>
// or via: youtube.com/@<handle> → About page → Share → Copy channel ID
export const YOUTUBE_CHANNELS: YouTubeChannel[] = [
  { channelId: "UCt7fwAhXDy3oNFTAzF2o8Pw", name: "NTV Telugu", handle: "ntvteluguhd" },
  { channelId: "UCQGqX5Ndpm4snE0NTjyOJnA", name: "V6 Velugu", handle: "V6NewsChannel" },
  { channelId: "UCmlqn9St6j4TDuvEQO9s9-w", name: "Sakshi TV", handle: "sakshitv" },
  { channelId: "UCcpRxvQ1nUTLENMYSe8nYKQ", name: "TV9 Telugu", handle: "TV9Telugu" },
  { channelId: "UCWoKSJRMfHjMuHmQBGVNnaw", name: "ABN Telugu", handle: "abnandhrajyothy" },
  { channelId: "UCBiUe3N0D7nt7tPbSMoKhkQ", name: "10TV News", handle: "10TVNewsHD" },
  { channelId: "UCIzbFxGMd8mK-q0Fhg4TVKQ", name: "ETV Telugu", handle: "etvtelugunews" },
  { channelId: "UCApBcxLrmDPMeulL8IVKH0g", name: "Mojo TV", handle: "mojotv" },
];
