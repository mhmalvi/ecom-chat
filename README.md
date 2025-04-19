# AI Chatbot Backend

A secure, robust Express server that integrates with OpenAI's API for chat functionality. This server implements best practices for security, rate limiting, and session management.

## Features

- **OpenAI Integration**: Seamless integration with OpenAI's API for AI-powered chat responses
- **Session Management**: Maintains chat history for a natural conversation flow
- **Security**: Implemented with Helmet for HTTP headers, API key authentication, and CORS protection
- **Rate Limiting**: Prevents abuse with configurable request limits
- **Error Handling**: Robust error handling and logging
- **Environment Configuration**: Easy configuration via environment variables

## Prerequisites

- Node.js (v14.x or later recommended)
- npm or yarn
- OpenAI API key

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ai-chatbot-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   
3. Create an environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your specific configuration:
   - Set your OpenAI API key
   - Configure your secure API key for client authentication
   - Adjust other settings as needed

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /api/health
```
Returns the server status and version.

### Chat Endpoint
```
POST /api/chat
```

#### Request Headers
- `x-api-key`: Your API key as set in environment variables

#### Request Body
```json
{
  "message": "Your message here",
  "sessionId": "optional-session-id"
}
```

#### Response
```json
{
  "response": "AI response message",
  "sessionId": "session-id-for-continuing-conversation"
}
```

## Configuration

All configuration is done through environment variables. See `.env.example` for all available options.

## Security Considerations

- The server requires API key authentication for all chat endpoints
- Rate limiting is enabled to prevent abuse
- CORS is configured to allow only specific origins
- HTTP security headers are set using Helmet

## Error Handling

The server includes comprehensive error handling:
- Validation errors for invalid requests
- Authentication errors for invalid API keys
- Rate limiting errors
- OpenAI API errors
- Server errors with appropriate status codes

## License

[Your License Here]

## Contributing

[Your Contributing Guidelines] 