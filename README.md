# Restaurant Booking System - API Documentation

## API Integration Guide for Vapi Voice AI System

This document outlines the API structure for communication between the Vapi Voice AI system and the server. Each API endpoint includes detailed specifications for both input and output data structures.

---

## 1. Check Table Availability API

Checks if tables are available for the requested date and time.

### Endpoint: POST /api/check-availability

### Input Parameters

```json
{
  "partySize": 7, // Required: Number of guests
  "date": "YYYY-MM-DD", // Required: Requested date
  "time": "HH:MM", // Required: Requested time
  "seatingPreference": "Indoor/Outdoor/Bar", // Optional
  "restaurantId": "string" // Required: Restaurant identifier
}
```

### Response Structure

```json
{
  "available": true, // Whether tables are available
  "availableTimes": [
    // Available time slots
    {
      "time": "HH:MM",
      "tables": ["T1", "T2"] // Available table IDs
    }
  ],
  "alternativeTimes": [
    // Alternative times if requested time unavailable
    "HH:MM",
    "HH:MM"
  ],
  "message": "string" // Customer-friendly message for Vapi to read
}
```

## 2. Create Booking API

Creates a new booking in the system.

### Endpoint: POST /api/create-booking

### Input Parameters

```json
{
  "customerName": "string", // Required: Customer's name
  "customerPhone": "string", // Required: Contact number
  "customerEmail": "string", // Optional: Email address
  "partySize": 7, // Required: Number of guests
  "date": "YYYY-MM-DD", // Required: Booking date
  "time": "HH:MM", // Required: Booking time
  "seatingPreference": "string", // Optional: Preferred seating area
  "specialRequests": "string", // Optional: Any special requirements
  "restaurantId": "string" // Required: Restaurant identifier
}
```

### Response Structure

```json
{
  "success": true, // Whether booking was successful
  "bookingReference": "string", // Unique booking reference
  "confirmedDetails": {
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "tableAssigned": "string",
    "message": "string" // Confirmation message for Vapi
  },
  "error": "string" // Error message if applicable
}
```

## 3. Check Booking API

Retrieves booking information.

### Endpoint: GET /api/check-booking

### Input Parameters

```json
{
  "identifier": "string", // Required: Booking reference or phone number
  "restaurantId": "string" // Required: Restaurant identifier
}
```

### Response Structure

```json
{
  "found": true, // Whether booking was found
  "bookings": [
    // Array of bookings found
    {
      "bookingReference": "string",
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "partySize": 7,
      "status": "Confirmed/Cancelled/Pending"
    }
  ],
  "message": "string" // Message for Vapi to read
}
```

## 4. Cancel Booking API

Cancels an existing booking.

### Endpoint: POST /api/cancel-booking

### Input Parameters

```json
{
  "bookingReference": "string", // Required: Booking reference
  "cancellationReason": "string", // Optional: Reason for cancellation
  "restaurantId": "string" // Required: Restaurant identifier
}
```

### Response Structure

```json
{
  "success": true, // Whether cancellation was successful
  "cancellationConfirmed": true, // Confirmation of cancellation
  "refundRequired": false, // Whether refund is needed
  "message": "string", // Cancellation message for Vapi
  "error": "string" // Error message if applicable
}
```

## 5. Modify Booking API

Modifies an existing booking.

### Endpoint: POST /api/modify-booking

### Input Parameters

```json
{
  "bookingReference": "string", // Required: Booking reference
  "restaurantId": "string", // Required: Restaurant identifier
  "modifications": {
    "date": "YYYY-MM-DD", // Optional: New date
    "time": "HH:MM", // Optional: New time
    "partySize": 7, // Optional: New party size
    "specialRequests": "string" // Optional: Updated special requests
  }
}
```

### Response Structure

```json
{
  "success": true, // Whether modification was successful
  "modifiedBooking": {
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "partySize": 7,
    "tableAssigned": "string"
  },
  "message": "string", // Confirmation message for Vapi
  "error": "string" // Error message if applicable
}
```

## Important Notes

1. Timestamps and Timezone

- All dates and times should be in the restaurant's local timezone
- Use 24-hour format for times (HH:MM)
- Use ISO format for dates (YYYY-MM-DD)

2. Message Field

- All response messages should be customer-friendly
- Vapi will read these messages directly to customers
- Keep messages clear and concise

3. Error Handling

- All error messages should be user-friendly
- Include specific error codes when applicable
- Provide clear instructions for resolution

4. Multi-tenant Support

- Include restaurantId in all requests
- Ensure data isolation between restaurants
- Validate restaurant ID before processing

5. Response Times

- Aim for response times under 2 seconds
- Include timeout handling
- Provide fallback responses when needed
