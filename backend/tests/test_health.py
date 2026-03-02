"""
Unit tests for health check endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import create_app
from app.db.base import get_db
from app.db.models import Base


# Test database setup
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    """Override get_db dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def test_app():
    """Create test app with overridden dependencies."""
    Base.metadata.create_all(bind=engine)
    
    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    
    yield app
    
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(test_app):
    """Provide test client."""
    return TestClient(test_app)


class TestHealthEndpoints:
    """Test health check endpoints."""

    def test_health_check_success(self, client):
        """Test basic health check endpoint."""
        response = client.get("/api/v1/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Stock Predictor API"
        assert data["version"] == "1.0.0"

    def test_health_check_response_structure(self, client):
        """Test health check response has required fields."""
        response = client.get("/api/v1/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "service" in data
        assert "version" in data

    def test_health_db_check_success(self, client):
        """Test database health check endpoint."""
        response = client.get("/api/v1/health/db")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"

    def test_health_db_check_response_structure(self, client):
        """Test database health check response structure."""
        response = client.get("/api/v1/health/db")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "database" in data

    def test_health_endpoint_content_type(self, client):
        """Test health endpoint returns JSON."""
        response = client.get("/api/v1/health")
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"

    def test_health_db_endpoint_content_type(self, client):
        """Test database health endpoint returns JSON."""
        response = client.get("/api/v1/health/db")
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"

    def test_health_check_response_time(self, client):
        """Test health check responds quickly."""
        import time
        
        start = time.time()
        response = client.get("/api/v1/health")
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 1.0  # Should respond within 1 second

    def test_health_endpoint_no_auth_required(self, client):
        """Test health endpoint doesn't require authentication."""
        response = client.get("/api/v1/health")
        
        # Should not return 401 Unauthorized
        assert response.status_code == 200

    def test_health_db_endpoint_no_auth_required(self, client):
        """Test database health endpoint doesn't require authentication."""
        response = client.get("/api/v1/health/db")
        
        # Should not return 401 Unauthorized
        assert response.status_code == 200

    def test_health_multiple_calls(self, client):
        """Test health endpoint works with multiple consecutive calls."""
        responses = [client.get("/api/v1/health") for _ in range(5)]
        
        assert all(r.status_code == 200 for r in responses)
        assert all(r.json()["status"] == "healthy" for r in responses)

    def test_health_db_multiple_calls(self, client):
        """Test database health endpoint works with multiple calls."""
        responses = [client.get("/api/v1/health/db") for _ in range(5)]
        
        assert all(r.status_code == 200 for r in responses)
        assert all(r.json()["status"] == "healthy" for r in responses)


class TestHealthCheckIntegration:
    """Integration tests for health checks."""

    def test_startup_health_check(self, client):
        """Test that application can perform health check on startup."""
        response = client.get("/api/v1/health")
        assert response.status_code == 200

    def test_health_checks_are_independent(self, client):
        """Test that health and db checks are independent."""
        health_response = client.get("/api/v1/health")
        db_response = client.get("/api/v1/health/db")
        
        assert health_response.status_code == 200
        assert db_response.status_code == 200

    def test_api_documentation_available(self, client):
        """Test that API documentation endpoints are available."""
        response = client.get("/api/docs")
        assert response.status_code == 200

    def test_swagger_ui_available(self, client):
        """Test that Swagger UI is available."""
        response = client.get("/api/docs")
        assert response.status_code == 200
        assert b"swagger" in response.content.lower() or b"openapi" in response.content.lower()

    def test_health_endpoint_path_case_sensitivity(self, client):
        """Test health endpoint path (should be case-sensitive in FastAPI)."""
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        
        # Different case should not work (FastAPI routes are case-sensitive)
        response_wrong_case = client.get("/api/v1/HEALTH")
        assert response_wrong_case.status_code == 404


class TestHealthCheckErrorHandling:
    """Test error handling in health checks."""

    def test_invalid_endpoint_returns_404(self, client):
        """Test that invalid endpoints return 404."""
        response = client.get("/api/v1/health-invalid")
        assert response.status_code == 404

    def test_method_not_allowed_returns_405(self, client):
        """Test that POST to GET-only endpoint returns 405."""
        response = client.post("/api/v1/health")
        assert response.status_code == 405

    def test_db_check_with_post_returns_405(self, client):
        """Test that POST to db health endpoint returns 405."""
        response = client.post("/api/v1/health/db")
        assert response.status_code == 405


class TestHealthCheckMetadata:
    """Test metadata consistency in health checks."""

    def test_health_check_version_consistency(self, client):
        """Test that version is consistent across checks."""
        response1 = client.get("/api/v1/health")
        version1 = response1.json()["version"]
        
        response2 = client.get("/api/v1/health")
        version2 = response2.json()["version"]
        
        assert version1 == version2

    def test_health_check_status_consistency(self, client):
        """Test that status is consistently 'healthy'."""
        for _ in range(3):
            response = client.get("/api/v1/health")
            assert response.json()["status"] == "healthy"

    def test_service_name_correct(self, client):
        """Test that service name is correct."""
        response = client.get("/api/v1/health")
        data = response.json()
        
        assert data["service"] == "Stock Predictor API"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
