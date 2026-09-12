# Disaster Management System

Transform disaster management from reactive chaos to structured, transparent intelligence by fusing heterogeneous data streams into actionable, resource-constrained response strategies.

## Overview

This application provides a comprehensive disaster management system designed for district emergency operations officers, field rescue coordinators, state disaster management analysts, and control room operators managing crisis response.

## Features

- **Disaster Incident Management**: Create, read, update, and delete disaster incidents
- **Multi-type Support**: Handle various disaster types (earthquake, flood, cyclone, fire, landslide, drought, tsunami)
- **Severity Tracking**: Classify incidents by severity levels (low, medium, high, critical)
- **Status Management**: Track disaster lifecycle from reported to resolved
- **Location-based Data**: Store geographic information including coordinates, district, and state
- **Impact Metrics**: Track affected population, casualties, and estimated damage
- **Resource Management**: Document deployed resources and response teams
- **Statistics Dashboard**: Get summary statistics of all disasters

## Technology Stack

- **Backend Framework**: FastAPI
- **Database**: SQLite (easily replaceable with PostgreSQL/MySQL)
- **ORM**: SQLAlchemy
- **Data Validation**: Pydantic
- **Architecture**: Modular Monolith

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation

1. Clone the repository or navigate to the project directory:
```bash
cd /app/user_workspace/team_044/33d0d305-67ef-4056-aa57-f5999e6f9f32
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - On Linux/Mac:
     ```bash
     source venv/bin/activate
     ```
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```

4. Install dependencies:
```bash
pip install -r backend/requirements.txt
```

5. Create environment configuration:
```bash
cp .env.example .env
```

6. Edit `.env` file and update configuration as needed (especially SECRET_KEY for production)

## Running the Application

1. Start the FastAPI server:
```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

2. Access the application:
   - API: http://localhost:8000
   - Interactive API Documentation (Swagger): http://localhost:8000/docs
   - Alternative API Documentation (ReDoc): http://localhost:8000/redoc

## API Endpoints

### Disaster Management

- `POST /api/v1/disasters/` - Create a new disaster incident
- `GET /api/v1/disasters/` - List all disasters (with optional filters)
- `GET /api/v1/disasters/{disaster_id}` - Get a specific disaster
- `PUT /api/v1/disasters/{disaster_id}` - Update a disaster
- `DELETE /api/v1/disasters/{disaster_id}` - Delete a disaster
- `GET /api/v1/disasters/stats/summary` - Get disaster statistics

### Query Parameters for Listing

- `skip`: Number of records to skip (pagination)
- `limit`: Maximum number of records to return
- `disaster_type`: Filter by disaster type
- `severity`: Filter by severity level
- `status_filter`: Filter by status
- `district`: Filter by district name
- `state`: Filter by state name

### Health Check

- `GET /` - Root endpoint with API information
- `GET /health` - Health check endpoint

## Example API Usage

### Create a Disaster

```bash
curl -X POST "http://localhost:8000/api/v1/disasters/" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Flood in Mumbai",
    "description": "Heavy rainfall causing severe flooding",
    "disaster_type": "flood",
    "severity": "high",
    "location": "Mumbai Central",
    "latitude": 19.0760,
    "longitude": 72.8777,
    "district": "Mumbai",
    "state": "Maharashtra",
    "affected_population": 50000,
    "casualties": 5,
    "estimated_damage": 1000000.0
  }'
```

### List All Disasters

```bash
curl -X GET "http://localhost:8000/api/v1/disasters/"
```

### Get Disaster Statistics

```bash
curl -X GET "http://localhost:8000/api/v1/disasters/stats/summary"
```

## Database Schema

### Disaster Model

- `id`: Unique identifier
- `title`: Disaster title
- `description`: Detailed description
- `disaster_type`: Type of disaster (enum)
- `severity`: Severity level (enum)
- `status`: Current status (enum)
- `location`: Location description
- `latitude`: Geographic latitude
- `longitude`: Geographic longitude
- `district`: District name
- `state`: State name
- `affected_population`: Number of people affected
- `casualties`: Number of casualties
- `estimated_damage`: Estimated financial damage
- `resources_deployed`: Description of deployed resources
- `response_team`: Assigned response team
- `reported_at`: Timestamp when reported
- `updated_at`: Last update timestamp
- `resolved_at`: Resolution timestamp

## Project Structure

```
.
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── database.py          # Database connection and session
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   └── routers/
│       ├── __init__.py
│       └── disasters.py     # Disaster management endpoints
├── .env.example             # Environment variables template
├── README.md                # This file
└── requirements.txt         # Python dependencies
```

## Development

### Database Migrations

The application automatically creates database tables on startup. For production, consider using Alembic for database migrations.

### Adding New Features

1. Define models in `backend/models.py`
2. Create Pydantic schemas in `backend/schemas.py`
3. Implement API routes in `backend/routers/`
4. Register routers in `backend/main.py`

## Security Considerations

- Change `SECRET_KEY` in production environment
- Use environment variables for sensitive configuration
- Implement authentication and authorization for production use
- Use HTTPS in production
- Configure CORS appropriately for your frontend domain
- Consider rate limiting for API endpoints

## Target Audience

- **District Emergency Operations Officers**: Monitor and coordinate disaster response at district level
- **Field Rescue Coordinators**: Track active incidents and resource deployment
- **State Disaster Management Analysts**: Analyze disaster patterns and impact metrics
- **Control Room Operators**: Real-time incident tracking and status updates

## License

This project is provided as-is for disaster management purposes.

## Support

For issues or questions, please refer to the API documentation at `/docs` endpoint.
