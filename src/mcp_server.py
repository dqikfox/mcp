"""
MCP server for Mergington High School Activity Management.

Exposes the FastAPI activity endpoints as MCP tools so GitHub Copilot
(and other MCP-capable agents) can list, sign up, and unregister students
from extracurricular activities directly from chat.
"""

from mcp.server.fastmcp import FastMCP
import httpx

BASE_URL = "http://localhost:8000"

mcp = FastMCP("Mergington Activities")


@mcp.tool()
def get_activities() -> dict:
    """Return all extracurricular activities and their current participants."""
    response = httpx.get(f"{BASE_URL}/activities")
    response.raise_for_status()
    return response.json()


@mcp.tool()
def signup_for_activity(activity_name: str, email: str) -> dict:
    """
    Sign a student up for an extracurricular activity.

    Args:
        activity_name: Exact name of the activity (e.g. "Chess Club").
        email: Student's school email address (e.g. "alice@mergington.edu").
    """
    response = httpx.post(
        f"{BASE_URL}/activities/{activity_name}/signup",
        params={"email": email},
    )
    response.raise_for_status()
    return response.json()


@mcp.tool()
def unregister_from_activity(activity_name: str, email: str) -> dict:
    """
    Remove a student from an extracurricular activity.

    Args:
        activity_name: Exact name of the activity (e.g. "Chess Club").
        email: Student's school email address (e.g. "alice@mergington.edu").
    """
    response = httpx.delete(
        f"{BASE_URL}/activities/{activity_name}/unregister",
        params={"email": email},
    )
    response.raise_for_status()
    return response.json()


if __name__ == "__main__":
    mcp.run()
