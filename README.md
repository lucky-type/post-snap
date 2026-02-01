# PostSnap

PostSnap is a Chrome extension that simplifies the process of capturing HTTP requests from your browser and saving them directly to your Postman collections. It allows you to record network traffic, filter by host, and sync requests with authentication details to Postman for easy testing and documentation.

## Features

- **Request Capture**: Record HTTP requests (GET, POST, PUT, DELETE, etc.) from any tab.
- **Host Filtering**: Filter captured requests by specific domains to focus on target APIs.
- **Auth Detection**: Automatically detects authentication methods (Bearer Token, Basic Auth, API Key).
- **Postman Integration**: 
  - Connects to your Postman account via API Key.
  - Lists and selects existing Postman Collections.
  - Saves requests directly to the selected collection.
  - Supports "Upsert" to update existing requests or create new ones.
- **Bulk Token Update**: Update tokens across multiple requests for a specific host.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Lucide React
- **Build Tool**: Vite 7, CRXJS Vite Plugin
- **Language**: TypeScript
- **State/Bg**: Chrome Extension Manifest V3 (Service Workers, Storage, WebRequest)

## Installation & Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/lucky-type/post-snap.git
   cd post-snap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```
   For development with hot reload:
   ```bash
   npm run dev
   ```

4. **Load into Chrome**
   - Open Chrome and go to `chrome://extensions/`.
   - Enable **Developer mode** (toggle in the top right).
   - Click **Load unpacked**.
   - Select the `dist` folder created by the build process.

## Usage

1. Open the PostSnap popup in Chrome.
2. Go to **Settings** and enter your Postman API Key.
3. Select a **Target Collection** where you want to save requests.
4. In the **Capture** tab, select a **Host** to filter traffic (or capture all).
5. Click **Start Capturing**.
6. Interact with the website you are testing.
7. Review the captured requests in the extension popup.
8. Click **Save to Postman** to sync them.

## License

MIT License
