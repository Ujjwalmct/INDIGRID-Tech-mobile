# UI Customization Documentation: Maximo Technician Application

**Application:** Technician (`id="techmobile"`)
**Version:** 9.1.22.0
**Objective:** UI modifications to simplify the application interface across the Work Order Details, Tasks, and Work Order Card views. These changes streamline the technician's view by removing redundant scheduling and location data, condensing the UI, and introducing quicker navigation to critical workflows.

---

## 1. File: `app.xml`

### 1.1. Tasks Page (`<page id="tasks">`)

**Header Modification**
The header was updated to provide technicians with immediate context regarding the selected work order.

- **Target Element:** `<header-template id="nr2dj">`
- **Action:** Added the work order description to the sub-title.
- **Attribute Added:** `sub-title="{page.state.workorder.description}"`

**Task Completion UI**

- **Target Element:** `<button id="pb_mv">` inside the list item (`id="r6bdn"`).
- **Action:** The quick-complete checkmark button on individual task list items was commented out to streamline the task view.

**Task Specification Inline Edit (Checklist Attributes)**

Editable input fields were added to allow technicians to view and modify task specification values directly from the task list.

- **Target Element:** `<panel id="task_spec_panel_inline">` inside the task list details
- **Action:** Modified the inline specification display to show editable Attribute and Value fields
- **Fields Added:**
  - **Attribute (Read-only):** Displays `assetattributedesc` from `ASSETATTRIBUTE.DESCRIPTION`
    - Label: "Attribute"
    - Element: `<label id="tsk_spec_il_lbl1">`
  - **Value (Editable):** Input field for `alnvalue` from `WORKORDERSPEC.ALNVALUE`
    - Label: "Value"
    - Element: `<smart-input id="tsk_spec_il_value_input">`
    - Input kind: `ALN` (Alphanumeric)
    - On change: Triggers `onTaskSpecValueChange` to save the value
- **Data Source:** Uses child datasource `IGTWOACTIVITYSPECALN` from `woPlanTaskDetailds`

### 1.2. Work Order Details Page (`<page id="workOrderDetails">`)

Several informational blocks were commented out to declutter the technician's view and remove unused features.

**Information Sections Removed**

- **Long Description:** The `<box>` wrapping the long description label, the rich-text viewer, and the maximize button was commented out.
- **Schedule Dates:**
  - The `<box>` containing the Scheduled Start Date and time was commented out.
  - The `<box>` containing the Scheduled Finish Date and time (`id="g463q"`) was commented out.
- **Estimated Duration:** The `<box>` container holding the estimated duration field was commented out.

**Tasks Navigation Button Added**
A new quick-action button was added to the details page to allow technicians to navigate directly to the Tasks page.

- **Target Element:** Inserted as a `<button>` (`id="qdn4v"`) within the primary button group (`id="yyb2k"`).
- **Action:** Added a button featuring the `carbon:list--numbered` icon.
- **Functionality:**
  - Triggers `MapsToTask` on click.
  - Displays a numerical badge with the total number of tasks (`tag-value="{app.state.taskCount}"`).
  - Conditionally hides itself if there are no tasks associated with the work order.

---

## 2. File: `wo-card-group.xml`

### 2.1. Work Order Card Group (`<card-group>`)

To condense the UI on the main schedule/work order list view, relative scheduling dates and address details were disabled from the individual work order cards.

> Note: There is no separate `wo-card.xml` in this workspace; the work order card UI is defined in `wo-card-group.xml`.

**Relative Dates Disabled**

- **Target Element:** `<box slot="slot3" ...>` inside `<common-card-template>`
- **Action:** The following `<date-relative>` elements were kept in place but forced to never render by setting `hidden="{true}"`:
  - **Overdue Date (`id="qj_467"`)**: "Overdue since"
  - **Due Date (`id="qj_43"`)**: "Due"
  - **Completed Date (`id="qj_577"`)**: "Work completed"

**Service Address Disabled**

- **Target Element:** `<box slot="slot5" id="jv55d">` inside `<common-card-template>`
- **Action:** The entire Service Address row (map icon `id="w5v20"` + field `id="ymjv9"`) was disabled by forcing the container to be hidden with `hidden="{true}"`.

**Tasks Button Added (WO Card Actions)**

- **Target Element:** `<button-group slot="slot6" id="bxek9">` inside `<common-card-template>`
- **Action:** Added a Tasks navigation button immediately after the Work Log button (`id="eyw9b"`).
- **Button:** `icon="carbon:list--numbered"`, `on-click="navigateToTask"`, `on-click-arg="{item}"`, `id="qdn4v"`
- **Badge:** Shows `tag-value="{app.state.taskCount}"`

**Implementation Note (Stability)**

- Disabling via `hidden="{true}"` is used to avoid accidental XML comment issues (e.g., an unclosed `<!-- ... -->`) that can cause the whole page to render blank.

---

## 3. File: `TaskController.js`

### 3.1. Task Item Click Handler

A method was added to handle task item selection and load specifications.

**Method Added: `onTaskItemClick(event)`**

- **Purpose:** Loads task specifications when a task item is clicked in the task list.
- **Parameters:**
  - `event.item` - The task item that was clicked
- **Functionality:**
  1. Selects the clicked task in `woPlanTaskDetailds`
  2. Gets the child datasource (`IGTWOACTIVITYSPECALN`) for specifications
  3. Forces reload of the specification data
  4. Displays toast messages for success/warning/error states

### 3.2. Task Specification Value Change Handler

A method was added to handle inline editing of task specification values.

**Method Added: `onTaskSpecValueChange(event)`**

- **Purpose:** Saves the updated task specification value when a technician modifies it in the inline input field.
- **Parameters:**
  - `event.item` - The specification item being modified (contains `workorderspecid`, `alnvalue`, etc.)
  - `event.datasource` - Reference to the parent `woPlanTaskDetailds` datasource
- **Functionality:**
  1. Finds the parent task containing the modified specification
  2. Gets the child datasource (`IGTWOACTIVITYSPECALN`) for the specification
  3. Saves the updated value to the datasource
- **Error Handling:** Logs errors to console if save fails

**Related Attributes:**

| Attribute | Source | Description |
|-----------|--------|-------------|
| `assetattributedesc` | `ASSETATTRIBUTE.DESCRIPTION` | Description of the classification attribute |
| `alnvalue` | `WORKORDERSPEC.ALNVALUE` | Alphanumeric value for the attribute |
| `workorderspecid` | `WORKORDERSPEC.WORKORDERSPECID` | Unique identifier for the specification |
