
# Hellenika Komiks - Notebook Feature Reconstruction Prompt

Rebuild the "Notes" feature into a sophisticated, multi-tab notebook application with a distinct "lined paper" aesthetic. The feature should function as a single-page application within the `/app/notebook` route, allowing users to create, edit, manage, and organize notes without full page reloads.

**Core Functional Requirements:**

1.  **Data Persistence:**
    *   All notes data (title, content, tags, folder path) must be stored in a Supabase table named `notes`.
    *   Create a server actions file (`src/app/notes/actions.ts`) to handle all CRUD (Create, Read, Update, Delete) operations for the notes.

2.  **UI/UX & Layout:**
    *   **Desktop View (≥ 768px):** Implement a three-panel layout:
        1.  A fixed sidebar for listing notes and folders.
        2.  A main content area.
        3.  Within the main content area, a tab bar at the top to show all open notes.
        4.  Below the tab bar, an editor/viewer panel that displays the content of the currently active tab.
    *   **Mobile View (< 768px):** Implement a two-view system:
        1.  A "list" view showing all notes and folders.
        2.  A "page" view showing the editor for a single active note. The user must be able to navigate back from the page view to the list view.
    *   **Styling:** Create a `src/app/notebook/notebook.css` file to give the note-taking area a "lined paper" appearance, complete with a red margin line. This style should be toggleable.

3.  **Note Management:**
    *   **Multi-Tab Interface:** Users must be able to open multiple notes simultaneously. Each open note should appear as a tab in the tab bar. The user can switch between notes by clicking tabs and close them individually.
    *   **State Persistence:** The list of open tabs and the currently active tab must be saved to the browser's `localStorage` so the user's session is restored when they return to the page.
    *   **Create New Note:** A button should allow users to create a new, empty note, which should immediately open in a new tab.

4.  **Editor & Content:**
    *   **Markdown Support:** Notes should be written in Markdown. Use `@uiw/react-md-editor` for editing and `react-markdown` for displaying the rendered content.
    *   **Edit/View Toggle:** Users should be able to switch between a read-only view of the rendered Markdown and an edit mode that displays the Markdown editor.
    *   **Content Fields:** A note must support a `title` and a `content` body.

5.  **Organization:**
    *   **Folders:** Implement a folder system using a `folder_path` text field in the `notes` table. Paths should be strings where colons denote nesting (e.g., `"school:cs101:assignments"`). The UI should render this as a hierarchical, collapsible tree.
    *   **Tags:** Allow users to add multiple text tags to each note. Display these tags as badges.
    *   **Move & Organize:** Users must be able to move notes between folders.

6.  **Component Structure:**
    *   **`src/app/notebook/page.tsx`:** The main page component that manages the overall state, layout switching (mobile vs. desktop), and orchestrates all sub-components.
    *   **`src/app/notes/actions.ts`:** Server actions for all database interactions.
    *   **`src/app/notebook/notebook.css`:** Styles for the notebook/paper aesthetic.
    *   Other components as needed for UI elements like lists, editors, etc., which should be organized logically.
