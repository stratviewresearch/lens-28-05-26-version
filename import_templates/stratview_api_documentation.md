Stratview Dashboards API Documentation
Base URL: http://localhost/stratview-yii2/web -use new directory please
________________________________________
Authentication Endpoints
1. Login
POST /auth/login
Body (JSON):
{
  "email": "user@example.com",
  "password": "password"
}
Response (Success):
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "company": "Company Name",
    "designation": "Analyst",
    "phone_number": "1234567890",
    "access_token": "abc...123"
  },
  "message": "Login successful."
}
2. Signup
POST /auth/signup
Body (JSON):
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "company": "Company Name",
  "designation": "Analyst",
  "phone_number": "1234567890",
  "password": "password"
}
Response (Success):
{
  "status": "success",
  "data": { "id": 2, "name": "Jane Doe", "email": "jane@example.com" },
  "message": "Registration successful."
}
3. Get Current User (Me)
GET /auth/me
Headers: Authorization: Bearer <token>
Response:
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "company": "Company",
    "designation": "Analyst",
    "phone_number": "1234567890"
  }
}
4. Update Profile
POST /auth/update-profile
Headers: Authorization: Bearer <token>
Response:
{
  "status": "success",
  "data": { "id": 1, "name": "Updated Name", ... },
  "message": "Profile updated successfully."
}
5. Logout
POST /auth/logout
Headers: Authorization: Bearer <token>
Response:
{ "status": "success", "message": "Successfully logged out." }
________________________________________
Dashboard & Data Endpoints
6. Category List
GET /new-dashboard-api/category-list
Response:
{
  "status": "success",
  "data": [
    { "id": "all", "name": "All Categories", "slug": "all", "icon": "Layers", "color": "teal" },
    { "id": 1, "name": "Aerospace", "slug": "aerospace", "icon": "Plane", "color": "blue" }
  ]
}
7. Subcategory List
POST /new-dashboard-api/subcategory-list
Body: { "category_id": "1" }
Response:
{
  "status": "success",
  "data": [
    {
      "id": 5,
      "name": "Aircraft Interiors",
      "slug": "aircraft-interiors",
      "purchased": true,
      "dashboards": [
        { "id": 10, "name": "Main View", "slug": "main", "purchased": true }
      ]
    }
  ]
}
8. Dashboard Data
POST /new-dashboard-api/dashboard-data
Body: { "dashboard_slug": "aircraft-interiors" }
Response:
{
  "status": "success",
  "data": { "id": 10, "name": "Main View", "slug": "main", "purchased": true }
}
9. User Subscriptions
POST /new-dashboard-api/user-subscriptions
Response:
{
  "status": "success",
  "data": [
    {
      "dashboard_name": "Aircraft Interiors",
      "dashboard_slug": "aircraft-interiors",
      "valid_from": "2024-03-10",
      "valid_to": "2025-03-10",
      "active": true
    }
  ]
}
10. Search
POST /new-dashboard-api/search
Body: { "q": "aircraft" }
Response:
{
  "status": "success",
  "data": [
    { "type": "dashboard", "name": "Aircraft Interiors", "purchased": true, ... }
  ]
}
11. Submit Inquiry
POST /new-dashboard-api/submit-inquiry
Response:
{ "status": "success", "message": "Inquiry submitted successfully." }
