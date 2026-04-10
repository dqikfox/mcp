document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Auth UI elements
  const userIconBtn = document.getElementById("user-icon-btn");
  const userDropdown = document.getElementById("user-dropdown");
  const showLoginBtn = document.getElementById("show-login-btn");
  const loginPanel = document.getElementById("login-panel");
  const loggedInPanel = document.getElementById("logged-in-panel");
  const teacherNameDisplay = document.getElementById("teacher-name-display");
  const logoutBtn = document.getElementById("logout-btn");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const cancelLoginBtn = document.getElementById("cancel-login-btn");
  const signupContainer = document.getElementById("signup-container");

  // ── Auth state ────────────────────────────────────────────────────────────

  function getToken() {
    return localStorage.getItem("authToken");
  }

  function setToken(token) {
    localStorage.setItem("authToken", token);
  }

  function clearToken() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("teacherName");
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function updateAuthUI() {
    const loggedIn = isLoggedIn();
    const name = localStorage.getItem("teacherName") || "";

    if (loggedIn) {
      loginPanel.classList.add("hidden");
      loggedInPanel.classList.remove("hidden");
      teacherNameDisplay.textContent = name;
      signupContainer.classList.remove("hidden");
      userIconBtn.classList.add("logged-in");
    } else {
      loginPanel.classList.remove("hidden");
      loggedInPanel.classList.add("hidden");
      signupContainer.classList.add("hidden");
      userIconBtn.classList.remove("logged-in");
    }

    // Re-render activities to show/hide delete buttons
    fetchActivities();
  }

  // ── Dropdown toggle ───────────────────────────────────────────────────────

  userIconBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle("hidden");
  });

  document.addEventListener("click", () => {
    userDropdown.classList.add("hidden");
  });

  userDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // ── Login modal ───────────────────────────────────────────────────────────

  showLoginBtn.addEventListener("click", () => {
    userDropdown.classList.add("hidden");
    loginModal.classList.remove("hidden");
    loginError.classList.add("hidden");
    loginForm.reset();
  });

  cancelLoginBtn.addEventListener("click", () => {
    loginModal.classList.add("hidden");
  });

  loginModal.addEventListener("click", (e) => {
    if (e.target === loginModal) {
      loginModal.classList.add("hidden");
    }
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password }),
      });
      const result = await response.json();

      if (response.ok) {
        setToken(result.token);
        localStorage.setItem("teacherName", result.name);
        loginModal.classList.add("hidden");
        updateAuthUI();
      } else {
        loginError.textContent = result.detail || "Invalid username or password";
        loginError.classList.remove("hidden");
      }
    } catch (error) {
      loginError.textContent = "Login failed. Please try again.";
      loginError.classList.remove("hidden");
      console.error("Login error:", error);
    }
  });

  // ── Logout ────────────────────────────────────────────────────────────────

  logoutBtn.addEventListener("click", async () => {
    userDropdown.classList.add("hidden");
    const token = getToken();
    if (token) {
      try {
        await fetch("/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    clearToken();
    updateAuthUI();
  });

  // ── Activities ────────────────────────────────────────────────────────────

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and dropdown options (keep placeholder)
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML — show delete buttons only when logged in
        const loggedIn = isLoggedIn();
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        loggedIn
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

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
          headers: { Authorization: `Bearer ${getToken()}` },
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
          headers: { Authorization: `Bearer ${getToken()}` },
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
  updateAuthUI();
});
