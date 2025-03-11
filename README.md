
# Japanese Translation App

A web application that translates English text to Japanese with customizable tone and interactive reading features.

## Features

- 🌐 English to Japanese translation with OpenAI
- 🎭 Multiple tone options for translations
- 📚 Save and review translation history
- 📖 Interactive Japanese text with furigana support
- 📝 Vocabulary management system with spaced repetition
- 🔐 User authentication for personalized experience

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI components
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL via Drizzle ORM
- **API**: OpenAI for translations and furigana conversion
- **Authentication**: Passport.js

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd japanese-translation-app
   ```

2. Install dependencies
   ```
   npm install
   ```

### Setting Up OpenAI API Key

This application requires an OpenAI API key to perform Japanese translations and furigana conversion:

1. Create an account on [OpenAI](https://platform.openai.com/) if you don't have one
2. Generate an API key in the OpenAI dashboard
3. Create a `.env` file in the root directory of the project with the following content:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
   Replace `your_api_key_here` with your actual OpenAI API key

### Running the Application

After setting up your API key, start the development server:
```
npm run dev
```

Open your browser and navigate to http://localhost:5000

## Project Structure

- `/client` - React frontend code
- `/server` - Express backend API
- `/shared` - Shared TypeScript types and schemas

## Development

### Building for Production

```
npm run build
```

### Starting Production Server

```
npm start
```

## License

MIT

## Acknowledgements

- Built with [Shadcn UI](https://ui.shadcn.com/) components
- Translations powered by OpenAI
