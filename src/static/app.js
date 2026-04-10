document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const sortSelect = document.getElementById("sort-select");

  // Day-of-week order for sorting
  const DAY_ORDER = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 };

  function firstDayOrder(schedule) {
    const lower = schedule.toLowerCase();
    for (const [day, order] of Object.entries(DAY_ORDER)) {
      if (lower.includes(day)) return order;
    }
    return 99;
  }

  // All activities data stored after fetch
  let allActivities = {};

  function getFilteredSorted() {
    const query = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const sort = sortSelect.value;

    let entries = Object.entries(allActivities);

    // Filter by search query
    if (query) {
      entries = entries.filter(([name, details]) =>
        name.toLowerCase().includes(query) ||
        details.description.toLowerCase().includes(query) ||
        details.schedule.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (category) {
      entries = entries.filter(([, details]) => details.category === category);
    }

    // Sort
    entries.sort(([nameA, detailsA], [nameB, detailsB]) => {
      switch (sort) {
        case "name-asc":
          return nameA.localeCompare(nameB);
        case "name-desc":
          return nameB.localeCompare(nameA);
        case "spots-desc": {
          const spotsA = detailsA.max_participants - detailsA.participants.length;
          const spotsB = detailsB.max_participants - detailsB.participants.length;
          return spotsB - spotsA || nameA.localeCompare(nameB);
        }
        case "day-asc":
          return firstDayOrder(detailsA.schedule) - firstDayOrder(detailsB.schedule) || nameA.localeCompare(nameB);
        default:
          return 0;
      }
    });

    return entries;
  }

  function renderActivities() {
    activitiesList.innerHTML = "";
    const entries = getFilteredSorted();

    if (entries.length === 0) {
      activitiesList.innerHTML = "<p>No activities match your search.</p>";
      return;
    }

    entries.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      // Create participants HTML with delete icons instead of bullet points
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
          <h4>${name}</h4>
          ${details.category ? `<span class="category-badge">${details.category}</span>` : ""}
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

      activitiesList.appendChild(activityCard);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();

      // Populate category filter (deduplicated, sorted)
      const categories = [...new Set(
        Object.values(allActivities)
          .map((d) => d.category)
          .filter(Boolean)
      )].sort();
      const currentCategory = categoryFilter.value;
      // Keep the "All" option, replace the rest
      categoryFilter.innerHTML = `<option value="">All Categories</option>`;
      categories.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        if (cat === currentCategory) opt.selected = true;
        categoryFilter.appendChild(opt);
      });

      // Populate the sign-up dropdown with all activities (unfiltered)
      activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;
      Object.keys(allActivities).sort().forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Re-render on filter/sort changes (no extra network request needed)
  searchInput.addEventListener("input", renderActivities);
  categoryFilter.addEventListener("change", renderActivities);
  sortSelect.addEventListener("change", renderActivities);

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
