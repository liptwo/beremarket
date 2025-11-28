# API Documentation

This document provides details on the API endpoints for the ReMarket application.

## Base URL

All API endpoints are prefixed with `/api/v1`.

---

## Authentication

Many endpoints require authentication using a JSON Web Token (JWT).

- **How to Authenticate**: Include the `Authorization` header in your request with the value `Bearer <accessToken>`.
- **Getting Tokens**: The `POST /users/login` endpoint provides both an `accessToken` and a `refreshToken`. The `accessToken` is short-lived.
- **Refreshing Tokens**: When the `accessToken` expires, use the `GET /users/refresh_token` endpoint (with the `refreshToken` stored in cookies) to get a new `accessToken`.

---

## User API

**Endpoint**: `/users`

### 1. Register a new user

- **Nhiệm vụ**: Đăng ký một tài khoản người dùng mới.
- **Endpoint**: `POST /register`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "displayName": "John Doe"
  }
  ```
- **Response (Success)**: `201 Created`
  ```json
  {
    "message": "User created successfully. Please check your email to verify your account.",
    "user": {
      "_id": "60d5f2f5c7b8f3b4a8f8b4a2",
      "email": "user@example.com",
      "displayName": "John Doe"
    }
  }
  ```

---

## Review API

**Endpoint**: `/reviews`

API for users to review listings.

### 1. Create a new review

- **Endpoint**: `POST /`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "listingId": "listingId123",
    "rating": 5,
    "comment": "Great product!"
  }
  ```
- **Response (Success)**: `201 Created`
  ```json
  {
    "insertedId": "reviewId1",
    ...
  }
  ```

### 2. Get reviews for a listing

- **Endpoint**: `GET /listing/:listingId`
- **URL Params**: `listingId` (ID of the listing)
- **Response (Success)**: `200 OK`
  ```json
  [
    {
      "_id": "reviewId1",
      "rating": 5,
      "comment": "Great product!",
      "userId": "userId1",
      "listingId": "listingId123",
      "createdAt": "2023-10-27T10:00:00.000Z"
    }
  ]
  ```

### 3. Update a review

- **Endpoint**: `PUT /:reviewId`
- **Authentication**: Required
- **URL Params**: `reviewId` (ID of the review to update)
- **Request Body**:
  ```json
  {
    "rating": 4,
    "comment": "Good product."
  }
  ```
- **Response (Success)**: `200 OK`
  ```json
  {
    "value": {
        "_id": "reviewId1",
        ...
    }
  }
  ```

### 4. Delete a review

- **Endpoint**: `DELETE /:reviewId`
- **Authentication**: Required
- **URL Params**: `reviewId` (ID of the review to delete)
- **Response (Success)**: `200 OK`
  ```json
  {
    "message": "Review deleted successfully.",
    "result": { ... }
  }
  ```

---

## Messaging API

**Endpoint**: `/messages`

API for users to send and receive messages.

### 1. Send a message

- **Endpoint**: `POST /`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "receiverId": "receiverUserId",
    "message": "Hello, is this still available?"
  }
  ```
- **Response (Success)**: `201 Created`
  ```json
  {
    "insertedId": "messageId1",
    ...
  }
  ```

### 2. Get messages with a specific user

- **Endpoint**: `GET /:otherUserId`
- **Authentication**: Required
- **URL Params**: `otherUserId` (ID of the other user in the conversation)
- **Response (Success)**: `200 OK`
  ```json
  [
    {
      "_id": "msg1",
      "senderId": "user1",
      "receiverId": "user2",
      "message": "Hello!",
      "createdAt": "2023-10-27T10:55:00.000Z"
    }
  ]
  ```

### 3. Get all conversations for the current user

- **Endpoint**: `GET /conversations`
- **Authentication**: Required
- **Response (Success)**: `200 OK`
  ```json
  [
    {
      "_id": "conversationId1",
      "participants": ["user1", "user2"],
      "createdAt": "2023-10-27T11:00:00.000Z"
    }
  ]
  ```

---

## Listing API

**Endpoint**: `/listings`

### 1. Get all listings

- **Nhiệm vụ**: Lấy danh sách tất cả các tin đăng, có hỗ trợ phân trang và tìm kiếm.
- **Endpoint**: `GET /`
- **Query Params (Optional)**:
  - `page` (number): Trang hiện tại.
  - `limit` (number): Số lượng tin trên mỗi trang.
  - `q` (string): Từ khóa tìm kiếm.
  - `category` (string): Lọc theo ID danh mục.
- **Response (Success)**: `200 OK`
  ```json
  {
      "total": 100,
      "page": 1,
      "limit": 10,
      "data": [
          {
              "_id": "listingId1",
              "title": "Used Laptop",
              "price": 500,
              ...
          }
      ]
  }
  ```

### 2. Get listing details

- **Nhiệm vụ**: Lấy thông tin chi tiết của một tin đăng.
- **Endpoint**: `GET /:id`
- **URL Params**: `id` (ID of the listing)
- **Response (Success)**: `200 OK`
  ```json
  {
      "_id": "listingId1",
      "title": "Used Laptop",
      "description": "A great laptop for sale.",
      "price": 500,
      "category": { ... },
      "seller": { ... },
      "images": ["url1", "url2"]
  }
  ```

### 3. Create a new listing

- **Nhiệm vụ**: Tạo một tin đăng mới.
- **Endpoint**: `POST /`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "title": "New Listing",
    "description": "Description of the new item.",
    "price": 150,
    "categoryId": "catId123",
    "images": ["url1", "url2"]
  }
  ```
- **Response (Success)**: `201 Created`
  ```json
  {
      "message": "Listing created successfully.",
      "listing": { ... }
  }
  ```

### 4. Update a listing

- **Nhiệm vụ**: Cập nhật thông tin một tin đăng đã có (chỉ chủ sở hữu mới có quyền).
- **Endpoint**: `PUT /:id`
- **Authentication**: Required
- **URL Params**: `id` (ID of the listing to update)
- **Request Body**:
  ```json
  {
    "title": "Updated Listing Title",
    "price": 140
  }
  ```
- **Response (Success)**: `200 OK`
  ```json
  {
      "message": "Listing updated successfully.",
      "listing": { ... }
  }
  ```

### 5. Delete a listing

- **Nhiệm vụ**: Xóa một tin đăng (chỉ chủ sở hữu mới có quyền).
- **Endpoint**: `DELETE /:id`
- **Authentication**: Required
- **URL Params**: `id` (ID of the listing to delete)
- **Response (Success)**: `200 OK`
  ```json
  {
    "message": "Listing deleted successfully."
  }
  ```

---

## Category API

**Endpoint**: `/categories`

### 1. Get all categories

- **Nhiệm vụ**: Lấy danh sách tất cả các danh mục sản phẩm.
- **Endpoint**: `GET /`
- **Response (Success)**: `200 OK`
  ```json
  [
    {
      "_id": "catId1",
      "name": "Electronics",
      "slug": "electronics"
    },
    {
      "_id": "catId2",
      "name": "Furniture",
      "slug": "furniture"
    }
  ]
  ```

### 2. Create a new category

- **Nhiệm vụ**: Tạo một danh mục mới (yêu cầu quyền admin).
- **Endpoint**: `POST /`
- **Authentication**: Required (Admin role)
- **Request Body**:
  ```json
  {
    "name": "New Category"
  }
  ```
- **Response (Success)**: `201 Created`
  ```json
  {
    "message": "Category created successfully.",
    "category": {
      "_id": "newCatId",
      "name": "New Category",
      "slug": "new-category"
    }
  }
  ```

---

## Real-time Messaging (WebSockets)

The application uses WebSockets for real-time communication, primarily for instant messaging.

### 1. Connecting to the Server

- **Library**: The client should use a Socket.IO client library.
- **Connection**: Connect to the main server URL.

### 2. Joining a Room

To receive real-time messages, the authenticated user must join a room corresponding to their own User ID.

- **Event to Emit**: `joinRoom`
- **Payload**:
  ```javascript
  // The client should send their own user ID after connecting
  socket.emit('joinRoom', 'your_user_id_here')
  ```
- **Purpose**: By joining this room, the server can push new messages directly to the user.

### 3. Receiving New Messages

Once in a room, the client needs to listen for incoming messages from the server.

- **Event to Listen For**: `newMessage`
- **Payload**: The server will send the complete message object when a new message is received for the user.
  ```json
  {
    "_id": "messageId123",
    "conversationId": "conversationId456",
    "senderId": "senderUserId",
    "receiverId": "your_user_id_here",
    "message": "Hello, this is a real-time message!",
    "createdAt": "2023-10-28T12:00:00.000Z",
    "updatedAt": "2023-10-28T12:00:00.000Z"
  }
  ```
- **How it Works**: When User A sends a message to User B via the `POST /api/v1/messages` endpoint, the server will emit a `newMessage` event to the room named after User B's ID. Any client that has joined that room will receive the message in real-time.
