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
    viewer.innerHTML = editor.value.replace(LINK_REGEX, match => {
      // Add protocol if missing
      const url =
        match.startsWith("http://") || match.startsWith("https://")
          ? match
          : "https://" + match;
      return `<a href="${url}" target="_blank">${match}</a>`;
    });
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

  /**
   * Toggle between editor and viewer
   * When switching to viewer, save the note and activate hyperlinks
   * When switching to editor, focus the editor
   */
  function toggleEditor() {
    if (editor.style.display !== "none") {
      editor.style.display = "none";
      viewer.style.display = "block";
      activateHyperlinks();
    } else {
      viewer.style.display = "none";
      editor.style.display = "block";
      editor.focus();
    }
  }

  function addEventListeners() {
    // Auto-save note
    editor.addEventListener("input", debounce(saveNote, 300));

    // Pagination buttons
    document.querySelector(".page-prev").addEventListener("click", () => {
      changePage(-1);
    });

    document.querySelector(".page-next").addEventListener("click", () => {
      changePage(1);
    });

    // Activate hyperlinks when editor lose focus
    editor.addEventListener("blur", toggleEditor);
    // Activate editor when viewer clicked
    viewer.addEventListener("click", toggleEditor);

    // Add keyboard shortcuts for page navigation
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        saveNote();
        editor.blur(); // Trigger blur event to switch to viewer
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
          toggleEditor();
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
