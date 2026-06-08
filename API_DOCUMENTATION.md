# Nearu App API Documentation

This document outlines the API endpoints, request/response structures, and authentication mechanisms used by the Nearu mobile application.

## Base URL

The base URL for all API calls is:
`https://nearu.kalametiyaseafoodrestaurant.com/api`

---

## 1. Authentication & Security

### Authentication Headers

All protected endpoints require the `Authorization` header with a Bearer token:
`Authorization: Bearer <access_token>`

### [POST] /auth/login

Authenticates a user with email and password.

- **Request Body**:

  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- **Response**:

  ```json
  {
    "token": "JWT_ACCESS_TOKEN",
    "refreshToken": "JWT_REFRESH_TOKEN",
    "user": { "id": "uuid", "name": "John Doe", "email": "..." }
  }
  ```

### [POST] /auth/register

Registers a new user.

- **Request Body**:

  ```json
  {
    "name": "John Doe",
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### [POST] /auth/refresh

Refreshes the access token using a refresh token.

- **Request Body**:

  ```json
  {
    "refreshToken": "JWT_REFRESH_TOKEN"
  }
  ```

### [POST] /auth/google

Authenticates or registers a user via Google Sign-In.

- **Request Body**:

  ```json
  {
    "idToken": "GOOGLE_ID_TOKEN"
  }
  ```

### [POST] /auth/apple

Authenticates or registers a user via Apple Sign-In.

- **Request Body**:

  ```json
  {
    "identityToken": "APPLE_IDENTITY_TOKEN",
    "authorizationCode": "APPLE_AUTH_CODE",
    "fullName": "Optional",
    "email": "Optional"
  }
  ```

---

## 2. Profile Management

### [PUT] /profile

Updates the user's profile information. Uses `multipart/form-data`.

- **Fields**:
  - `name`: string
  - `email`: string
  - `phoneNumber`: string
  - `metadata`: string (JSON stringified)
  - `profileImage`: Binary file (WebP format preferred)

### [DELETE] /profile

Deletes the user's account and all associated data.

---

## 3. Circles & Members

### [GET] /circles

Fetches all circles the user belongs to.

### [POST] /circles

Creates a new circle.

- **Request Body**:

  ```json
  {
    "name": "Family",
    "relationship": "Family",
    "location": { "latitude": 0, "longitude": 0, "name": "Default" }
  }
  ```

### [POST] /circles/join-by-code

Joins an existing circle using a 6-digit invite code.

- **Request Body**:

  ```json
  {
    "code": "XYZ123"
  }
  ```

### [DELETE] /circles/{circleId}/leave

Removes the current user from the specified circle.

---

## 4. Location Tracking

### [POST] /profile/circles/{circleId}/live-location

Syncs the user's current location to a specific circle.

- **Frequency**: Every 10-30 seconds depending on app state.
- **Request Body**:

  ```json
  {
    "latitude": 6.9271,
    "longitude": 79.8612,
    "name": "Colombo, Sri Lanka",
    "speed": "0",
    "run": "foreground", 
    "time": "2026-03-22 11:30:00"
  }
  ```

  - `run`: 'foreground' or 'background'
  - `time`: Formatted string (YYYY-MM-DD HH:mm:ss)

---

## 5. SOS & Emergency

### [POST] /profile/sos

Triggers an SOS alert to all members of the user's circles.

- **Request Body**:

  ```json
  {
    "message": "SOS Emergency Alert!",
    "latitude": 6.9271,
    "longitude": 79.8612
  }
  ```

---

## 6. Places & Geofencing

### [POST] /circles/{circleId}/locations

Adds a saved place (geofence) to a circle.

- **Request Body**:

  ```json
  {
    "latitude": 6.9271,
    "longitude": 79.8612,
    "name": "Home",
    "metadata": {
      "radius": 100,
      "address": "123 Street, Colombo",
      "notifyOnArrival": true,
      "notifyOnDeparture": true,
      "placeType": "Home"
    }
  }
  ```

---

## 7. Push Notifications

### [POST] /profile/device-token

Registers the device's FCM (Firebase Cloud Messaging) token.

- **Request Body**:

  ```json
  {
    "token": "FCM_DEVICE_TOKEN",
    "platform": "android" | "ios"
  }
  ```

---
*Note: This documentation is generated based on the current frontend implementation.*
