const NoteApp = (() => {
  let editor = null;
  let viewer = null;
  let currentPage = 1;
  const LINK_REGEX = /((https?:\/\/)?([\w-]+\.)?[\w-]+\.[a-z]{2,}(\/[^\s]*)?)/g;

  function loadNote(page) {
    const noteContent = localStorage.getItem(`notepage-${page}`);
    editor.value = noteContent ?? "";
    viewer.innerText = noteContent ?? "";
    activateHyperlinks();
  }

  function saveNote() {
    try {
      localStorage.setItem(`notepage-${currentPage}`, editor.value);
    } catch (e) {
      console.error("Failed to save note:", e);
      window.alert("Saving failed");
    }
  }

  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  }

  function activateHyperlinks() {
    viewer.innerHTML = editor.value.replace(
      LINK_REGEX,
      '<a href="$1" target="_blank">$1</a>'
    );
  }

  function toggleSetting(key, value) {
    switch (key) {
      case "spellcheck":
        editor.spellcheck = value;
        break;
      default:
        console.warn(`Tried to set unsupported settings key: ${key}`);
    }
  }

  function loadAndSetSettings() {
    const settingsDiv = document.querySelector("#settings-sheet div.toggles");
    const toggleInputs = settingsDiv.querySelectorAll("input[data-key]");

    toggleInputs.forEach(input => {
      const settingKey = input.dataset.key;
      const localStorageKey = `notepage-${settingKey}-enabled`;
      const savedValue = localStorage.getItem(localStorageKey) === "true";

      // Set the default value from localStorage
      input.checked = savedValue;
      toggleSetting(settingKey, savedValue);

      // Add event listener to update localStorage when toggled
      input.addEventListener("change", () => {
        localStorage.setItem(localStorageKey, input.checked);
        toggleSetting(settingKey, input.checked);
      });
    });
  }

  function addEventListeners() {
    // Auto-save note
    editor.addEventListener("input", debounce(saveNote, 300));

    // Make links clickable with CTRL pressed
    // document.addEventListener("keydown", e => {
    //   if (e.ctrlKey || e.metaKey) {
    //     editor.style.display = "none";
    //     viewer.style.display = "block";
    //     activateHyperlinks();
    //   }
    // });

    // document.addEventListener("keyup", e => {
    //   if (e.key == "Control" && !e.ctrlKey) {
    //     editor.style.display = "block";
    //     viewer.style.display = "none";
    //   }
    // });

    // Add keyboard shortcuts for page navigation
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        saveNote();
        // Toggle display of viewer and editor
        if (editor.style.display !== "none") {
          editor.style.display = "none";
          viewer.style.display = "block";
          activateHyperlinks();
        } else {
          viewer.style.display = "none";
          editor.style.display = "block";
          editor.focus();
        }
      } else if (document.activeElement !== editor) {
        // Only handle page navigation if editor is not focused
        if (e.key === "ArrowLeft") {
          changePage(-1); // Go to the previous page
          e.preventDefault(); // Prevent default scrolling behavior
        } else if (e.key === "ArrowRight") {
          changePage(1);
          e.preventDefault();
        } else {
          // Focus the editor if key other than navigation key is pressed
          editor.focus();
        }
      }
    });
  }

  function changePage(delta) {
    const newPage = Math.max(1, parseInt(currentPage) + delta); // Ensure the page number is at least 1
    if (newPage !== currentPage) {
      currentPage = newPage;
      localStorage.setItem("notepage-current", currentPage);
      loadNote(currentPage);
      document.querySelector("h1").textContent = `Page ${currentPage}`;
    }
  }

  function start() {
    editor = document.querySelector("#editor");
    viewer = document.querySelector("#viewer");
    currentPage = localStorage.getItem("notepage-current") ?? 1;

    loadNote(currentPage);
    document.querySelector("h1").textContent = `Page ${currentPage}`;

    editor.contentEditable = true;
    editor.focus();

    addEventListeners();
    loadAndSetSettings();
  }

  return { start };
})();

document.addEventListener("DOMContentLoaded", NoteApp.start);
