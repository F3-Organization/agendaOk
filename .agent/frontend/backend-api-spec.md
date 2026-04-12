# Backend API Specification (ConfirmaZap)

This document provides a detailed technical specification for the ConfirmaZap API to guide frontend design and development.

## 1. Authentication (Google OAuth 2.0)

### Login Initializer
*   **Endpoint**: `GET /api/auth/google`
*   **Auth**: Public
*   **Description**: Starts the OAuth flow.
*   **Payload**: None
*   **Response**: `302 Redirect` to Google Consent Page.

### OAuth Callback
*   **Endpoint**: `GET /api/auth/google/callback?code={code}`
*   **Auth**: Public
*   **Description**: Receives the code from Google and logs the user in.
*   **Response (200 OK)**:
    ```json
    {
      "message": "Authentication successful!",
      "token": "JWT_STRING_HERE",
      "user": {
        "id": "uuid",
        "name": "User Name",
        "email": "user@email.com",
        "role": "USER | ADMIN"
      }
    }
    ```

### Get Current User (Me)
*   **Endpoint**: `GET /api/auth/me`
*   **Auth**: Required (JWT Header `Authorization: Bearer <token>`)
*   **Description**: Returns data for the currently authenticated user.
*   **Response (200 OK)**: Same user object as above.

---

## 2. Calendar Management

### List Appointments (Logic)
*   **Status**: Currently handled via Google direct sync to DB. To be displayed in Dashboard.
*   **Endpoint**: (To be implemented or used via repository fetch).

### Sync Google Calendar
*   **Endpoint**: `POST /api/calendar/sync`
*   **Auth**: Required + Active Subscription
*   **Description**: Schedules an asynchronous background job to pull the latest events from Google.
*   **Response (200 OK)**:
    ```json
    { "message": "Synchronization scheduled successfully!", "userId": "uuid" }
    ```

### Trigger Notifications
*   **Endpoint**: `POST /api/calendar/notify`
*   **Auth**: Required + Active Subscription
*   **Description**: Scans upcoming appointments and sends WhatsApp messages to clients.
*   **Response (200 OK)**:
    ```json
    { "message": "Notification scan scheduled!", "userId": "uuid" }
    ```

---

## 3. WhatsApp Integration (Evolution API)

### Connect (Generate QR Code)
*   **Endpoint**: `POST /api/whatsapp/connect`
*   **Auth**: Required + Active Subscription
*   **Description**: Creates a WhatsApp instance and returns a QR Code for scanning.
*   **Response (200 OK)**:
    ```json
    {
      "id": "instance_id",
      "status": "instance_status",
      "qrCode": "base64_image_data_uri"
    }
    ```

### Disconnect
*   **Endpoint**: `DELETE /api/whatsapp/disconnect`
*   **Auth**: Required
*   **Description**: Terminates the active WhatsApp session.
*   **Response (200 OK)**:
    ```json
    { "status": "success", "message": "WhatsApp disconnected successfully." }
    ```

---

## 4. Subscription Management (Abacate Pay)

### Create Checkout
*   **Endpoint**: `POST /api/subscription/checkout`
*   **Auth**: Required
*   **Description**: Generates a PIX/Card checkout link for PRO upgrade.
*   **Response (200 OK)**:
    ```json
    { "url": "https://abacatepay.com/checkout/..." }
    ```

### Get Subscription Status
*   **Endpoint**: `GET /api/subscription/status`
*   **Auth**: Required
*   **Description**: Returns the user's current plan and status.
*   **Response (200 OK)**:
    ```json
    {
      "status": "ACTIVE | INACTIVE | PAST_DUE",
      "plan": "PRO | FREE",
      "currentPeriodEnd": "ISO_DATE",
      "checkoutUrl": "last_generated_checkout_link"
    }
    ```

---

## 5. System Health
*   **Endpoint**: `GET /api/health`
*   **Description**: Verifies if the API is operational.
*   **Response**: `{ "status": "ok", "timestamp": "..." }`
