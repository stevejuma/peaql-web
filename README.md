# PeaQL Web

A web-based SQL query interface built with Svelte, TypeScript, and the PeaQL database library. Execute SQL queries directly in your browser with syntax highlighting, data visualization, and persistent storage.

## Features

- 🔍 **SQL Editor** - CodeMirror-powered editor with SQL syntax highlighting and autocomplete
- 📊 **Data Visualization** - Interactive data tables with sorting, filtering, and pagination
- 💾 **Persistent Storage** - Queries and database state saved locally using IndexedDB
- 🎨 **Modern UI** - Clean, responsive interface built with Tailwind CSS and shadcn/ui components
- ⚡ **In-Browser Database** - Powered by PeaQL for client-side SQL execution
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🗂️ **Tabbed Interface** - Multiple query tabs for efficient workflow

## Demo Data

The application includes a comprehensive demo database with sample data including:
- Music catalog (albums, artists, tracks)
- Customer data and invoices
- Employee records
- Playlist management

Perfect for learning SQL or testing queries without setting up a separate database.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/stevejuma/peaql-web.git
cd peaql-web
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Writing Queries**: Use the SQL editor to write your queries with full syntax highlighting
2. **Executing Queries**: Click the play button or use `Ctrl+Enter` to execute queries
3. **Viewing Results**: Query results are displayed in an interactive data table below the editor
4. **Managing Tabs**: Create multiple query tabs for different workspaces
5. **Data Persistence**: Your queries and database state are automatically saved locally

## Tech Stack

- **Frontend Framework**: Svelte 5 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4.0
- **UI Components**: shadcn/ui components adapted for Svelte
- **Code Editor**: CodeMirror 6
- **Database**: PeaQL (client-side SQL database)
- **Data Tables**: TanStack Table
- **Storage**: IndexedDB via idb-keyval

## Project Structure

```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui component library
│   │   ├── data-table/     # Data visualization components
│   │   ├── sql-editor.svelte
│   │   └── app-sidebar.svelte
│   ├── hooks/              # Svelte runes and utilities
│   ├── demo.sql            # Sample database schema and data
│   └── utils.ts            # Utility functions
├── App.svelte              # Main application component
└── main.ts                 # Application entry point
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run fmt` - Format code with Prettier
- `npm run check` - Type check with Svelte and TypeScript

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [PeaQL](https://github.com/stevejuma/peaql) - The client-side SQL database engine
- [CodeMirror](https://codemirror.net/) - The excellent code editor
- [shadcn svelte](https://www.shadcn-svelte.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
