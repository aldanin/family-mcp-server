# Family MCP Server

MCP server for TheDaninFamily database with tools to query family events and dates.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update database password in `src/index.ts`:
```typescript
const pool = new Pool({
  // ...
  password: 'your_actual_password',
});
```

3. Build the server:
```bash
npm run build
```

## Tools

### getDPOC
Returns the EPOCH timestamp of the oldest birthdate in the members table (DPOC - Database Point of Origin for Calendar).

**Parameters:** None

**Returns:**
```json
{
  "dpoc": 1234567890,
  "description": "EPOCH timestamp of the oldest birthdate in the members table"
}
```

### getEvents
Get events for a specific family member. If a reference date is provided, returns events from that date onwards. Otherwise, returns all events from DPOC.

**Parameters:**
- `name` (required): The name of the family member
- `refDate` (optional): Reference date as EPOCH number

**Returns:**
```json
{
  "name": "Roy",
  "refDate": 1234567890,
  "events": [
    {
      "event_date": "2019-03-12",
      "event_type": "University Graduation",
      "name": "Roy",
      "event_epoch": 1552348800
    }
  ],
  "count": 1
}
```

## Usage

Add to your MCP settings configuration file (e.g., VS Code settings):

```json
{
  "mcpServers": {
    "family-db": {
      "command": "node",
      "args": ["e:\\D F G\\_ProfessionalProgramming\\SideProjects\\MCP\\MCP1\\family-mcp-server\\dist\\index.js"]
    }
  }
}
```

## Database Schema

This server expects a PostgreSQL database named `thedaninfamily` with the following tables:

- `members`: Family members with id, name, birthdate, etc.
- `events`: Events linked to members with event_date and event_type
