document.addEventListener("DOMContentLoaded", () => {
  // ── Git-branch animated background ────────────────────────────────
  (function () {
    "use strict";
    const canvas = document.getElementById("git-bg");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Speed and geometry
    const SPEED = 0.5;      // pixels per frame (slow drift upward)
    const ROW_H = 80;       // vertical gap between commit rows
    const DOT_R = 5;        // commit dot radius

    // Semi-transparent lime-green palette
    const COLORS = [
      "rgba(50,205,50,0.50)",
      "rgba(0,200,83,0.42)",
      "rgba(124,252,0,0.36)",
      "rgba(57,255,20,0.30)",
      "rgba(0,255,127,0.34)",
    ];

    // Lane positions as fractions of canvas width
    const LANE_FRACS = [0.08, 0.20, 0.33, 0.50, 0.67, 0.80, 0.92];

    // The repeating "git graph" segment (by row index)
    const SEGMENT_ROWS = 30;
    const lines = [
      { lane: 3, from: 0,  to: SEGMENT_ROWS }, // main
      { lane: 1, from: 3,  to: 13 },            // feature-A
      { lane: 5, from: 8,  to: 17 },            // hotfix
      { lane: 2, from: 15, to: 25 },            // feature-B
      { lane: 6, from: 20, to: SEGMENT_ROWS },  // release
    ];

    // Diagonal connectors: branch-off and merge-back
    // colorIdx is pre-computed once so we avoid findIndex calls per frame.
    const connectors = [
      { fromLane: 3, fromRow: 3,  toLane: 1, toRow: 3,  colorIdx: 0 },
      { fromLane: 1, fromRow: 13, toLane: 3, toRow: 13, colorIdx: 1 },
      { fromLane: 3, fromRow: 8,  toLane: 5, toRow: 8,  colorIdx: 0 },
      { fromLane: 5, fromRow: 17, toLane: 3, toRow: 17, colorIdx: 2 },
      { fromLane: 3, fromRow: 15, toLane: 2, toRow: 15, colorIdx: 0 },
      { fromLane: 2, fromRow: 25, toLane: 3, toRow: 25, colorIdx: 3 },
      { fromLane: 3, fromRow: 20, toLane: 6, toRow: 20, colorIdx: 0 },
    ];

    // Build commit dot positions (every 3 rows on each active line)
    const dots = [];
    lines.forEach((l, i) => {
      for (let r = l.from; r <= l.to; r += 3) {
        dots.push({ lane: l.lane, row: r, colorIdx: i });
      }
    });
    connectors.forEach((c) => {
      dots.push({ lane: c.fromLane, row: c.fromRow, colorIdx: c.colorIdx });
      dots.push({ lane: c.toLane,   row: c.toRow,   colorIdx: c.colorIdx });
    });

    const SEGMENT_H = SEGMENT_ROWS * ROW_H;
    let scroll = 0;
    let W = 0, H = 0;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function lx(lane) { return W * LANE_FRACS[lane]; }

    function drawSegment(yOff) {
      // Branch lines
      lines.forEach((l, i) => {
        ctx.beginPath();
        ctx.moveTo(lx(l.lane), yOff + l.from * ROW_H);
        ctx.lineTo(lx(l.lane), yOff + l.to   * ROW_H);
        ctx.strokeStyle = COLORS[i % COLORS.length];
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Diagonal connectors
      connectors.forEach((c) => {
        ctx.beginPath();
        ctx.moveTo(lx(c.fromLane), yOff + c.fromRow * ROW_H);
        ctx.lineTo(lx(c.toLane),   yOff + c.toRow   * ROW_H);
        ctx.strokeStyle = COLORS[c.colorIdx % COLORS.length];
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Commit dots
      dots.forEach((d) => {
        ctx.beginPath();
        ctx.arc(lx(d.lane), yOff + d.row * ROW_H, DOT_R, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[d.colorIdx % COLORS.length];
        ctx.fill();
      });
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      scroll = (scroll + SPEED) % SEGMENT_H;
      const copies = Math.ceil(H / SEGMENT_H) + 2;
      for (let i = 0; i < copies; i++) {
        drawSegment(-scroll + i * SEGMENT_H);
      }
      requestAnimationFrame(frame);
    }

    frame();
  })();

  // ── Activities app ─────────────────────────────────────────────────

  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

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
