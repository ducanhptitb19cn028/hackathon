# Knowledge Portal

An AI-powered learning platform that provides personalized learning experiences through natural language interaction.

## Features

- **Natural Language Search**: Search for educational videos using natural language queries
- **Personalized Learning Paths**: Get customized learning paths based on your goals and skill level
- **Interactive Quizzes**: Test your knowledge with AI-generated quizzes from video content
- **Progress Tracking**: Monitor your learning progress and achievements
- **Smart Recommendations**: Receive content suggestions based on your learning history

## Tech Stack

- React 18
- TypeScript
- Material-UI
- Redux Toolkit
- React Router
- Axios

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/knowledge-portal.git
cd knowledge-portal
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── components/         # Reusable UI components
│   └── layout/        # Layout components (Navbar, Footer)
├── pages/             # Page components
├── store/             # Redux store configuration
│   └── slices/        # Redux slices
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── App.tsx            # Root component
```

## Core Features

### Natural Language Search
- Search for videos using conversational queries
- Filter results by category, difficulty level, and duration
- View detailed video information and metadata

### Learning Paths
- Create personalized learning paths based on goals
- Track progress through interactive content
- Receive recommendations for next steps

### Quiz System
- Generate quizzes from video content
- Multiple choice questions with explanations
- Track quiz history and performance

### User Profile
- Manage personal information and preferences
- View learning progress and achievements
- Access history of completed content

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Material-UI for the beautiful UI components
- React and TypeScript communities for excellent documentation
- All contributors who help improve this project 