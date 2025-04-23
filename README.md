# ✅ Salesforce Path Checklist Components

This project delivers a modern, visually appealing, and reusable solution using **Lightning Web Components (LWC)** to dynamically check required fields in Salesforce records and block stage changes until all required data is filled.

It includes 3 core components and 1 message channel, offering a complete **checklist experience with preventive validation**, powered by **SLDS 2.0** and **Lightning Message Service (LMS)**.

---

## 📦 Components

### 1. `CheckListFieldsToStatus`
Checklist component that **displays and verifies required fields** based on the current stage of the record.

- Shows filled / unfilled icons
- Displays a badge with pending fields count (color-coded)
- Fully responsive UI using SLDS 2.0
- Communicates with other components via **LMS**

---

### 2. `PatchCheckListFieldsToStatus`
Custom Path component that **blocks status updates** when required fields are not filled.

- Preventive validation using **LMS**
- Interactive stage update via `updateRecord`
- Fully integrated with `CheckListFieldsToStatus`

---

### 3. `utilsComponent`
Utility component that centralizes:

- Custom toast messages
- Alerts and error display

---

### 4. `MessageChannels/CheckListFieldsToSatusChannel`
Custom **Lightning Message Service (LMS)** channel:

- Communication between components
- Handles field validation response messaging

---

## 🚀 Getting Started

### 🔧 Prerequisites

- Salesforce DX project
- Apex & LWC enabled
- API version `60+`

---

### ⚙️ Setup Instructions

1. **Add both components to the record page via Lightning App Builder**:
   - `CheckListFieldsToStatus`: Displays the checklist of required fields
   - `PatchCheckListFieldsToStatus`: Renders the interactive path

2. **Configure public `@api` attributes** on both components:

| Property               | Description                                     |
|------------------------|-------------------------------------------------|
| `recordId`             | Current record ID                               |
| `objectApiName`        | Object API name                                 |
| `statusField`          | Status field to monitor (e.g., Status)          |
| `Etapa1` to `Etapa5`   | Stage names                                     |
| `CamposEtapa1` to `CamposEtapa5` | Required fields per stage             |
| `relatedObjectNameX`   | Related object name                             |
| `fieldRelationshipX`   | Lookup field name                               |
| `screenObjectNameX`    | Display name for UI                             |
| `stageRelationshipX`   | Stage for related list validation               |

3. **Set the required fields dynamically via App Builder**.

---

## 🔁 Message Flow via LMS

1. User clicks a new stage in `PatchCheckListFieldsToStatus`
2. It publishes `getFieldsToFill` to LMS
3. `CheckListFieldsToStatus` listens and returns pending fields
4. If fields are missing:
   - Shows a toast and blocks the update
5. If all fields are filled:
   - Executes `updateRecord` and updates the path

---

## 📸 Demo Screenshots

### ✅ Checklist View

![Checklist Example](./images/checklist-example.png)

---

### ⏩ Interactive Path View

![Path Example](./images/path-example.png)

> 💡 Add your screenshots inside the `/images` folder for better documentation.

---

## 🎨 Customization Options

- SLDS 2.0 responsive visual style
- Easily reusable for any object
- Configurable validation stages and fields
- Extendable to additional related lists

---

## 🤝 Contributing

Pull requests are welcome! Contributions to improve UX, accessibility, or performance are appreciated.

---

## 📄 License

This project is licensed under the **MIT License**.
---