# API Reference - Dashboard Donasi PABU

## Base URL
```
Backend: http://localhost:8000/api
Frontend: http://localhost:5173
```

## Authentication
Semua endpoint API dilindungi dengan Laravel Sanctum authentication.

**Headers Required:**
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

## Teams API

### 1. Get All Teams
**Endpoint:** `GET /api/teams`

**Query Parameters:**
- `branch_id` (optional) - Filter by branch ID

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Tim Alpha",
      "branch_id": 1,
      "code": "ALPHA",
      "created_at": "2025-01-06T10:00:00.000000Z",
      "updated_at": "2025-01-06T10:00:00.000000Z",
      "branch": {
        "id": 1,
        "name": "PABU PUSAT",
        "code": "PUSAT",
        "address": "Jakarta Pusat"
      },
      "users": []
    }
  ]
}
```

### 2. Create Team
**Endpoint:** `POST /api/teams`

**Request Body:**
```json
{
  "name": "Tim Beta",
  "branch_id": 1,
  "code": "BETA"
}
```

**Validation Rules:**
- `name`: required, string, max 255 characters
- `branch_id`: required, must exist in branches table
- `code`: required, string, max 50 characters, unique

**Response:** Same as Get Team (201 Created)

### 3. Get Team by ID
**Endpoint:** `GET /api/teams/{id}`

**Response:** Same structure as Get All Teams (single object)

### 4. Update Team
**Endpoint:** `PUT /api/teams/{id}`

**Request Body:** Same as Create Team

**Validation Rules:** Same as Create Team (code unique except current team)

**Response:** Same as Get Team

### 5. Delete Team
**Endpoint:** `DELETE /api/teams/{id}`

**Response:**
```json
{
  "message": "Team deleted successfully"
}
```

## Branches API

### Get All Branches
**Endpoint:** `GET /api/branches`

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "PABU PUSAT",
      "code": "PUSAT",
      "address": "Jakarta Pusat",
      "created_at": "2025-01-06T10:00:00.000000Z",
      "updated_at": "2025-01-06T10:00:00.000000Z"
    }
  ]
}
```

## Users API

### Get All Users
**Endpoint:** `GET /api/users`

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "081234567890",
      "branch_id": 1,
      "team_id": 1,
      "role": "volunteer",
      "created_at": "2025-01-06T10:00:00.000000Z",
      "updated_at": "2025-01-06T10:00:00.000000Z"
    }
  ]
}
```

## Programs API

### Get All Programs
**Endpoint:** `GET /api/programs`

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "type": "ZISWAF",
      "name": "Zakat Fitrah",
      "code": "ZF",
      "description": "Program zakat fitrah",
      "volunteer_rate": 5.0,
      "branch_rate": 10.0,
      "created_at": "2025-01-06T10:00:00.000000Z",
      "updated_at": "2025-01-06T10:00:00.000000Z"
    }
  ]
}
```

## Transactions API

### Get All Transactions
**Endpoint:** `GET /api/transactions`

**Query Parameters:**
- `status` (optional) - Filter by status
- `branch_id` (optional) - Filter by branch
- `team_id` (optional) - Filter by team
- `volunteer_id` (optional) - Filter by volunteer

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "branch_id": 1,
      "team_id": 1,
      "volunteer_id": 1,
      "program_type": "ZISWAF",
      "program_id": 1,
      "donor_name": "Ahmad Donor",
      "amount": 500000,
      "transfer_method": "Bank Transfer",
      "proof_image": "path/to/image.jpg",
      "status": "pending",
      "status_reason": null,
      "created_at": "2025-01-06T10:00:00.000000Z",
      "updated_at": "2025-01-06T10:00:00.000000Z",
      "validated_at": null,
      "validated_by": null
    }
  ]
}
```

## Error Responses

### Validation Error (422)
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "name": ["The name field is required."]
  }
}
```

### Not Found (404)
```json
{
  "message": "No query results for model [App\\Models\\Team] 999"
}
```

### Unauthorized (401)
```json
{
  "message": "Unauthenticated."
}
```

### Server Error (500)
```json
{
  "message": "Server Error"
}
```

## Status Codes

- `200` - OK (GET, PUT)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity (Validation Error)
- `500` - Internal Server Error

## Data Types

### Team Status
- Active teams are included in responses
- Deleted teams are soft-deleted (not shown)

### Transaction Status
- `pending` - Waiting for validation
- `valid` - Approved transaction
- `double_duta` - Duplicate ambassador
- `double_input` - Duplicate input
- `not_in_account` - Not found in account
- `other` - Other reasons

### User Roles
- `admin` - System administrator
- `validator` - Transaction validator
- `volunteer` - Field volunteer
- `branch` - Branch manager

### Program Types
- `ZISWAF` - Zakat, Infaq, Sedekah, Wakaf
- `QURBAN` - Qurban/Sacrifice program

## Rate Limiting

API menggunakan rate limiting default Laravel:
- 60 requests per minute untuk authenticated users
- 10 requests per minute untuk guest users

## Pagination

Untuk endpoint yang mengembalikan banyak data, gunakan parameter:
- `page` - Nomor halaman (default: 1)
- `per_page` - Jumlah item per halaman (default: 15, max: 100)

Response akan include metadata pagination:
```json
{
  "data": [...],
  "links": {...},
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 75
  }
}
```