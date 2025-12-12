document.addEventListener("DOMContentLoaded", () => {
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
      // reset select options
      activitySelect.innerHTML = '<option value="">Select an activity</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants html
        const participants = details.participants || [];

        // create participants container so we can attach handlers to delete buttons
        const participantsWrapper = document.createElement("div");
        participantsWrapper.className = "participants";

        const h5 = document.createElement("h5");
        h5.innerHTML = `Participants <span class="count">${participants.length}</span>`;
        participantsWrapper.appendChild(h5);

        if (participants.length) {
          const ul = document.createElement("ul");
          participants.forEach((p) => {
            const display = (p && p.name) || p || "";
            const initials = display
              .split(/[\s@]+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((s) => s[0].toUpperCase())
              .join("");

            const li = document.createElement("li");

            const avatar = document.createElement("span");
            avatar.className = "avatar";
            avatar.textContent = initials || "?";

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = display;

            const removeBtn = document.createElement("button");
            removeBtn.className = "participant-remove-btn";
            removeBtn.title = "Remove participant";
            removeBtn.innerHTML = "✖";

            // when clicked, call unregister endpoint
            removeBtn.addEventListener("click", async () => {
              const emailForRemove = (p && p.email) ? p.email : p;
              if (!emailForRemove) return;
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(emailForRemove)}`,
                  { method: "DELETE" }
                );
                const result = await resp.json();
                if (resp.ok) {
                  messageDiv.textContent = result.message;
                  messageDiv.className = "success";
                  messageDiv.classList.remove("hidden");
                  // refresh activities list
                  fetchActivities();
                } else {
                  messageDiv.textContent = result.detail || "Could not remove participant";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                }
                setTimeout(() => messageDiv.classList.add("hidden"), 5000);
              } catch (err) {
                console.error(err);
                messageDiv.textContent = "Failed to remove participant.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                setTimeout(() => messageDiv.classList.add("hidden"), 5000);
              }
            });

            li.appendChild(avatar);
            li.appendChild(nameSpan);
            li.appendChild(removeBtn);
            ul.appendChild(li);
          });
          participantsWrapper.appendChild(ul);
        } else {
          const none = document.createElement("div");
          none.className = "none";
          none.textContent = "No participants yet";
          participantsWrapper.appendChild(none);
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;
        activityCard.appendChild(participantsWrapper);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh activities so the new participant appears immediately
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
