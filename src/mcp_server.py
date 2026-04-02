"""
mcp_server.py — Mergington High School MCP Server
==================================================
Exposes the FastAPI activity endpoints as MCP tools so GitHub Copilot
and other MCP-capable agents can manage activities directly from chat.

Tools:
  - get_activities          : list all activities + participants
  - get_activity_details    : details for one activity
  - signup_for_activity     : enrol a student
  - unregister_from_activity: remove a student
  - get_participants        : list participants for one activity
  - check_availability      : check if an activity has open spots
  - search_activities       : filter activities by keyword
"""

from mcp.server.fastmcp import FastMCP
import httpx

BASE_URL = "http://localhost:8000"

mcp = FastMCP("Mergington Activities")

# ── Core activity tools ───────────────────────────────────────────────────────

@mcp.tool()
def get_activities() -> dict:
    """Return all extracurricular activities and their current participants."""
    response = httpx.get(f"{BASE_URL}/activities")
    response.raise_for_status()
    return response.json()


@mcp.tool()
def get_activity_details(activity_name: str) -> dict:
    """
    Return full details for a single activity.

    Args:
        activity_name: Exact name of the activity (e.g. "Chess Club").
    """
    response = httpx.get(f"{BASE_URL}/activities")
    response.raise_for_status()
    all_activities = response.json()
    if activity_name not in all_activities:
        return {"error": f"Activity '{activity_name}' not found."}
    return {activity_name: all_activities[activity_name]}


@mcp.tool()
def signup_for_activity(activity_name: str, email: str) -> dict:
    """
    Sign a student up for an extracurricular activity.

    Args:
        activity_name: Exact name of the activity (e.g. "Chess Club").
        email: Student's school email address (must end in @mergington.edu).
    """
    if not email.endswith("@mergington.edu"):
        return {"error": "Email must be a @mergington.edu address."}
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
        email: Student's school email address (must end in @mergington.edu).
    """
    if not email.endswith("@mergington.edu"):
        return {"error": "Email must be a @mergington.edu address."}
    response = httpx.delete(
        f"{BASE_URL}/activities/{activity_name}/unregister",
        params={"email": email},
    )
    response.raise_for_status()
    return response.json()


# ── Extended tools ────────────────────────────────────────────────────────────

@mcp.tool()
def get_participants(activity_name: str) -> dict:
    """
    List all enrolled participants for a specific activity.

    Args:
        activity_name: Exact name of the activity (e.g. "Drama Club").
    """
    response = httpx.get(f"{BASE_URL}/activities")
    response.raise_for_status()
    all_activities = response.json()
    if activity_name not in all_activities:
        return {"error": f"Activity '{activity_name}' not found."}
    activity = all_activities[activity_name]
    return {
        "activity": activity_name,
        "participants": activity["participants"],
        "count": len(activity["participants"]),
        "max_participants": activity["max_participants"],
    }


@mcp.tool()
def check_availability(activity_name: str) -> dict:
    """
    Check whether an activity has open spots remaining.

    Args:
        activity_name: Exact name of the activity (e.g. "Math Club").
    """
    response = httpx.get(f"{BASE_URL}/activities")
    response.raise_for_status()
    all_activities = response.json()
    if activity_name not in all_activities:
        return {"error": f"Activity '{activity_name}' not found."}
    activity = all_activities[activity_name]
    enrolled = len(activity["participants"])
    max_p = activity["max_participants"]
    spots_left = max_p - enrolled
    return {
        "activity": activity_name,
        "enrolled": enrolled,
        "max_participants": max_p,
        "spots_available": spots_left,
        "is_full": spots_left <= 0,
    }


@mcp.tool()
def search_activities(keyword: str) -> dict:
    """
    Search activities by keyword — matches against name, description, or schedule.

    Args:
        keyword: Search term (e.g. "Friday", "chess", "sports").
    """
    response = httpx.get(f"{BASE_URL}/activities")
    response.raise_for_status()
    all_activities = response.json()
    kw = keyword.lower()
    matches = {
        name: details
        for name, details in all_activities.items()
        if kw in name.lower()
        or kw in details.get("description", "").lower()
        or kw in details.get("schedule", "").lower()
    }
    return {"keyword": keyword, "results": matches, "count": len(matches)}


if __name__ == "__main__":
    mcp.run()
