# Apex Calendar Bot

<div align="center">
  <img src=".github/assets/logo.png" alt="Apex Calendar Bot Logo" width="150" height="150">
  <br>
  <br>
  <a href="https://discord.com/api/oauth2/authorize?client_id=1095418638200209559&permissions=92160&scope=bot%20applications.commands">
    <img src="https://img.shields.io/badge/Invite%20to%20Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white" alt="Invite to Discord">
  </a>
  <br>
  <br>
  <img src=".github/assets/example.png" alt="Example Calendar" width="800">
</div>

## About

Apex Calendar Bot is a Discord bot that helps you keep track of Apex Legends events by displaying and automatically updating a calendar in your server. The bot fetches event data and renders a beautiful calendar view that updates periodically.

## Features

- 📅 Displays a beautiful calendar of Apex Legends events
- 🔄 Automatically updates calendar information
- 🎮 Shows event details including times and descriptions
- 🔒 Secure command system with permission controls

## Commands

- `/start` - Start calendar monitoring in the current channel
- `/stop` - Stop calendar monitoring (with optional message deletion)
- `/refresh` - Manually refresh the calendar

All commands require the `Kick Members` permission to use.

## Setup

1. [Click here to invite the bot](https://discord.com/api/oauth2/authorize?client_id=1095418638200209559&permissions=92160&scope=bot%20applications.commands) to your server
2. Create a channel for the calendar
3. Use `/start` in the desired channel
4. Done! The bot will automatically keep the calendar updated

## Self-Hosting

If you want to host the bot yourself:

1. Clone this repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Create a `.env` file with:
   ```env
   DISCORD_TOKEN=your_bot_token
   DATABASE_PATH=./data  # Directory where SQLite database will be stored
   ```
4. Run the bot:
   ```bash
   bun start
   ```

## Docker

The easiest way to run the bot is using our pre-built Docker image:

```bash
docker run -d \
  -e DISCORD_TOKEN=your_bot_token \
  -e DATABASE_PATH=/data \
  -v /path/to/your/data:/data \
  ghcr.io/augusdogus/apex-calendar:latest
```

The volume mount (`-v`) maps a directory on your host system to store the SQLite database. This ensures your bot's data persists even if the container restarts. The `DATABASE_PATH` environment variable should match the container path in your volume mount.

### Building Locally

If you prefer to build the image yourself:

```bash
docker build -t apex-calendar .
docker run -d \
  -e DISCORD_TOKEN=your_bot_token \
  -e DATABASE_PATH=/data \
  -v /path/to/your/data:/data \
  apex-calendar
```
