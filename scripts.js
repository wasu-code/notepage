const NoteApp = (() => {
  let textArea = null;
  let currentPage = 1;
  const LINK_REGEX = /((https?:\/\/)?([\w-]+\.)?[\w-]+\.[a-z]{2,}(\/[^\s]*)?)/g;

  function loadNote(page) {
    const noteContent = localStorage.getItem(`notepage-${page}`);
    textArea.innerText = noteContent ?? "";
  }

  function saveNote() {
    try {
      localStorage.setItem(`notepage-${currentPage}`, textArea.innerText);
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
    textArea.innerHTML = textArea.innerText.replace(
      LINK_REGEX,
      '<a href="$1" target="_blank">$1</a>'
    );
  }

  function toggleSetting(key, value) {
    switch (key) {
      case "spellcheck":
        textArea.spellcheck = value;
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
    textArea.addEventListener("input", debounce(saveNote, 300));

    // Make links clickable with CTRL pressed
    document.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault(); // Prevent the default "select all" behavior
        const range = document.createRange();
        range.selectNodeContents(textArea); // Select all content inside #note-content
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      } else if (e.ctrlKey || e.metaKey) {
        activateHyperlinks();
        textArea.contentEditable = false;
      }
    });

    document.addEventListener("keyup", e => {
      if (e.ctrlKey || e.metaKey) {
        textArea.contentEditable = true;
      }
    });

    // Add keyboard shortcuts for page navigation
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        // Unfocus the textArea and save note
        saveNote();
        textArea.blur();
      } else if (document.activeElement !== textArea) {
        // Only handle page navigation if textArea is not focused
        if (e.key === "ArrowLeft") {
          changePage(-1); // Go to the previous page
          e.preventDefault(); // Prevent default scrolling behavior
        } else if (e.key === "ArrowRight") {
          changePage(1);
          e.preventDefault();
        } else {
          // Focus the textArea if key other than navigation key is pressed
          textArea.focus();
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
    textArea = document.querySelector("#note-content");
    currentPage = localStorage.getItem("notepage-current") ?? 1;

    loadNote(currentPage);
    document.querySelector("h1").textContent = `Page ${currentPage}`;

    textArea.contentEditable = true;
    textArea.focus();

    addEventListeners();
    loadAndSetSettings();
  }

  return { start };
})();

document.addEventListener("DOMContentLoaded", NoteApp.start);
