# REST API Plan

## 1. Resources

- **Tasks**: Represents tasks created by users. Corresponds to the `tasks` table.
- **TimeEntries**: Represents time tracking sessions for tasks. Corresponds to the `time_entries` table.
- **Auth**: Represents user authentication operations (login, register). Corresponds to the `auth.users` table managed by Supabase.
- **Summaries**: Represents aggregated time tracking data. Derived from `time_entries` and `tasks`.

## 2. Endpoints

### Auth

- **POST** `/api/auth/register`
  - **Description**: Registers a new user.
  - **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "a-strong-password"
    }
    ```
  - **Response Body**:
    ```json
    {
      "user": {
        "id": "...",
        "email": "user@example.com",
        "created_at": "..."
      },
      "session": {
        "access_token": "...",
        "refresh_token": "..."
      }
    }
    ```
  - **Success**: `201 Created`
  - **Errors**: `400 Bad Request` (Invalid email/password), `422 Unprocessable Entity` (User already exists)

- **POST** `/api/auth/login`
  - **Description**: Logs in an existing user.
  - **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "a-strong-password"
    }
    ```
  - **Response Body**: (Same as `/register`)
  - **Success**: `200 OK`
  - **Errors**: `400 Bad Request` (Invalid credentials)

### Tasks

- **GET** `/api/tasks`
  - **Description**: Retrieves a list of tasks for the authenticated user.
  - **Query Parameters**:
    - `status` (optional, enum: 'active', 'completed'): Filter tasks by status.
    - `sortBy` (optional, e.g., 'created_at'): Field to sort by.
    - `order` (optional, 'asc' | 'desc'): Sort order.
  - **Response Body**:
    ```json
    [
      {
        "id": "uuid",
        "name": "Task Name",
        "description": "Task Description",
        "status": "active",
        "created_at": "timestamp"
      }
    ]
    ```
  - **Success**: `200 OK`
  - **Errors**: `401 Unauthorized`

- **POST** `/api/tasks`
  - **Description**: Creates a new task.
  - **Request Body**:
    ```json
    {
      "name": "New Task",
      "description": "Optional description"
    }
    ```
  - **Response Body**:
    ```json
    {
      "id": "uuid",
      "name": "New Task",
      "description": "Optional description",
      "status": "active",
      "created_at": "timestamp"
    }
    ```
  - **Success**: `201 Created`
  - **Errors**: `400 Bad Request` (Validation error), `401 Unauthorized`

- **PATCH** `/api/tasks/{taskId}`
  - **Description**: Updates a task's details (name, description, status).
  - **Request Body**:
    ```json
    {
      "name": "Updated Task Name",
      "description": "Updated description",
      "status": "completed"
    }
    ```
  - **Response Body**:
    ```json
    {
      "id": "uuid",
      "name": "Updated Task Name",
      "description": "Updated description",
      "status": "completed",
      "created_at": "timestamp"
    }
    ```
  - **Success**: `200 OK`
  - **Errors**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden` (Task has active timer), `404 Not Found`

### Time Entries (as sub-resource of Tasks)

- **POST** `/api/tasks/{taskId}/time-entries/start`
  - **Description**: Starts a new time entry for a task.
  - **Request Body**: (Empty)
  - **Response Body**:
    ```json
    {
      "id": "uuid",
      "task_id": "uuid",
      "start_time": "timestamp",
      "end_time": null
    }
    ```
  - **Success**: `201 Created`
  - **Errors**: `401 Unauthorized`, `404 Not Found`, `409 Conflict` (Another timer is already active)

- **POST** `/api/tasks/{taskId}/time-entries/{timeEntryId}/stop`
  - **Description**: Stops an active time entry. Validates daily time capacity before stopping.
  - **Request Body**:
    ```json
    {
      "timezone_offset": 60
    }
    ```
  - **Response Body**:
    ```json
    {
      "id": "uuid",
      "task_id": "uuid",
      "start_time": "timestamp",
      "end_time": "timestamp"
    }
    ```
  - **Success**: `200 OK`
  - **Errors**: 
    - `400 Bad Request` with error code `DailyCapacityExceeded` (Total time for a day exceeds 24 hours)
    - `401 Unauthorized`
    - `404 Not Found`
    - `409 Conflict` (Timer already stopped)

- **POST** `/api/tasks/{taskId}/time-entries`
  - **Description**: Manually creates a new time entry for a task with specified start and end times. Sessions crossing midnight are automatically split based on user's timezone.
  - **Request Body**:
    ```json
    {
      "start_time": "2026-01-27T09:00:00.000Z",
      "end_time": "2026-01-27T17:00:00.000Z",
      "timezone_offset": 60
    }
    ```
  - **Response Body**:
    ```json
    {
      "id": "uuid",
      "task_id": "uuid",
      "start_time": "timestamp",
      "end_time": "timestamp"
    }
    ```
  - **Success**: `201 Created`
  - **Errors**: 
    - `400 Bad Request` (Validation: end_time > start_time, no future times, invalid timezone_offset)
    - `400 Bad Request` with error code `DailyCapacityExceeded` (Total time for a day exceeds 24 hours)
    - `401 Unauthorized`
    - `404 Not Found`
  - **Note**: If the time entry spans multiple days in the user's timezone, it will be automatically split into separate entries for each day.

- **PATCH** `/api/tasks/{taskId}/time-entries/{timeEntryId}`
  - **Description**: Manually edits an existing time entry.
  - **Request Body**:
    ```json
    {
      "start_time": "new-start-timestamp",
      "end_time": "new-end-timestamp",
      "timezone_offset": 60
    }
    ```
  - **Response Body**:
    ```json
    {
      "id": "uuid",
      "task_id": "uuid",
      "start_time": "new-start-timestamp",
      "end_time": "new-end-timestamp"
    }
    ```
  - **Success**: `200 OK`
  - **Errors**: 
    - `400 Bad Request` (Validation: end_time > start_time)
    - `400 Bad Request` with error code `DailyCapacityExceeded` (Total time for a day exceeds 24 hours)
    - `401 Unauthorized`
    - `404 Not Found`
    - `409 Conflict` (Cannot edit active timer)

### Summaries

- **GET** `/api/summary/daily`
  - **Description**: Gets the daily work summary for a specific date range, considering user's timezone.
  - **Query Parameters**:
    - `date_from` (optional, format: 'YYYY-MM-DD'): Start date for the summary (defaults to today).
    - `date_to` (optional, format: 'YYYY-MM-DD'): End date for the summary (defaults to today).
    - `timezone_offset` (required, number): Timezone offset in minutes from UTC (e.g., 60 for UTC+1, -300 for UTC-5).
  - **Response Body**:
    ```json
    {
      "date_from": "2026-01-25T00:00:00.000Z",
      "date_to": "2026-01-25T23:59:59.999Z",
      "total_duration_seconds": 14400,
      "total_duration_formatted": "04:00:00",
      "tasks": [
        {
          "task_id": "uuid",
          "task_name": "Task Name",
          "task_status": "active",
          "duration_seconds": 14400,
          "duration_formatted": "04:00:00",
          "entries_count": 3
        }
      ]
    }
    ```
  - **Success**: `200 OK`
  - **Errors**: `400 Bad Request` (Invalid date format or timezone offset), `401 Unauthorized`
  - **Note**: The endpoint filters entries based on the user's local date (using timezone_offset), not UTC date. Sessions spanning multiple days are correctly attributed to each day.

- **GET** `/api/tasks/active-timer`
  - **Description**: Checks if there is any active timer for the user upon app startup.
  - **Response Body**:
    ```json
    // If active timer exists:
    {
      "id": "time-entry-uuid",
      "task_id": "task-uuid",
      "start_time": "timestamp"
    }
    // If no active timer:
    null
    ```
  - **Success**: `200 OK`
  - **Errors**: `401 Unauthorized`

## 3. Authentication and Authorization

- **Authentication**: Authentication will be handled using JSON Web Tokens (JWT). Supabase Auth will be used for user registration and login, which provides JWTs upon successful authentication. The JWT will be sent in the `Authorization` header of each request as a Bearer token.
- **Authorization**: Row Level Security (RLS) in PostgreSQL, as configured in `db-plan.md`, will enforce that users can only access and modify their own data (`tasks` and `time_entries`). API endpoints will be protected, requiring a valid JWT for access.

## 4. Validation and Business Logic

### Validation
- **Tasks**:
  - `name`: Required, string, max 255 chars.
  - `description`: Optional, string, max 5000 chars.
  - `status`: Must be one of 'active' or 'completed'.
- **Time Entries**:
  - `end_time`: Must be greater than `start_time` if not null.
- **Input Validation**: All API endpoints receiving data will use a library like Zod to validate the request body against the defined schemas.

### Business Logic
- **Single Active Timer**: The API will enforce that only one time entry can be active (`end_time IS NULL`) for a user at any given time. The `POST /api/tasks/{taskId}/time-entries/start` endpoint will check for existing active timers before creating a new one, returning a `409 Conflict` error if one exists. This is supported by the unique index on `user_id` for active time entries mentioned in the DB plan.
- **No Edits on Active Tasks**: The `PATCH /api/tasks/{taskId}` endpoint will prevent updates to a task if it has an active timer. It will query for an active `time_entry` associated with the `taskId` before allowing the update.
- **Daily Summary Calculation**: The `GET /api/summary/daily` endpoint will use the `get_daily_summary` PostgreSQL function defined in the DB plan to efficiently calculate total work duration per task for a given day.
- **Active Timer Recovery**: The `GET /api/tasks/active-timer` endpoint allows the frontend to check for an unfinished session when the application starts, fulfilling requirement F-06 from the PRD. The frontend will then be responsible for presenting the user with recovery options.
- **Daily Time Capacity Validation**: When creating or editing time entries (`POST /api/tasks/{taskId}/time-entries`, `PATCH /api/tasks/{taskId}/time-entries/{timeEntryId}`, and `POST /api/tasks/{taskId}/time-entries/{timeEntryId}/stop`), the API validates that the total time for any given day (in user's timezone) does not exceed 24 hours. This validation:
  - Considers all completed time entries (active timers are excluded)
  - Checks each day affected by the new/edited entry
  - When editing or stopping, excludes the current entry from existing time calculations
  - Returns `400 Bad Request` with error code `DailyCapacityExceeded` and detailed information (day, existing time, new time, total, limit) if validation fails
  - Uses the `timezone_offset` parameter to correctly determine local days
  - For stop endpoint: validates before the timer is stopped to prevent invalid data from being saved
