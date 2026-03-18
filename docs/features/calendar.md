# Calendar Integration
The Calendar feature allows employees to sync their shifts and POS events to their personal calendars (like Google Calendar or Apple Calendar/iCal). 

## Architecture
The system supports two primary methods of calendar integration:
1. **iCal Feed (`calendar_integration.py`)**: Generates an `.ics` subscription URL for employees. They can subscribe to this URL in any standard calendar app to view shift events, shipment deliveries, etc. It securely generates these links using a unique token per employee.
2. **Google Calendar OAuth Sync (`google_calendar_sync.py`)**: A direct 2-way sync implemented using the Google Calendar API via OAuth2. It handles the full OAuth flow (redirecting, token generation, caching refresh tokens) and pushes POS events directly into the employee's Google Calendar.

## Key Capabilities
- **Shift Event Generation**: Takes schedules created in the POS and transforms them into calendar events containing start times, end times, shift types, and notes.
- **Shipment Event Generation**: Allows delivery windows for vendor shipments to appear on the calendar, helping staff prepare for incoming inventory.
- **Individual Event Exports**: Users can download a singular `.ics` file for a specific event without subscribing to the entire feed.
