document.addEventListener("DOMContentLoaded", () => {
  const sidebarLinks = document.querySelectorAll(".sidebar-nav ul li a")
  const sections = document.querySelectorAll(".dashboard-section")
  const logoutButton = document.getElementById("logout-btn") // Corrected ID

  // Modals and Forms for User Management
  const userModal = document.getElementById("user-form-modal") // Corrected ID
  const addUserBtn = document.getElementById("add-user-btn") // This ID is not in the HTML, assuming it's for opening the add user form
  const closeModalButtons = document.querySelectorAll(".close") // Corrected class
  const userForm = document.getElementById("user-form") // This is the edit form
  const addUserForm = document.getElementById("add-user-form") // New: Add user form
  const userModalTitle = document.getElementById("form-title-user") // Corrected ID
  const userIdInput = document.getElementById("user_id_edit") // Corrected ID
  const contrasenaInput = document.getElementById("user_contrasena") // Corrected ID for add form password
  const currentFotoPreview = document.getElementById("current_user_photo_preview") // Corrected ID for edit modal
  const fotoInput = document.getElementById("user_foto") // Corrected ID for add form photo

  // Edit Profile Modal (assuming these are still needed, though not directly in system dashboard HTML)
  const editProfileModal = document.getElementById("edit-profile-modal")
  const editProfileBtn = document.getElementById("edit-profile-btn")
  const editProfileForm = document.getElementById("edit-profile-form")
  const editCurrentFotoPreview = document.getElementById("edit-current-foto-preview")
  const editFotoInput = document.getElementById("edit-foto")

  // Change Password Modal (assuming these are still needed)
  const changePasswordModal = document.getElementById("change-password-modal")
  const changePasswordBtn = document.getElementById("change-password-btn")
  const changePasswordForm = document.getElementById("change-password-form")

  // Input fields for Add User Form
  const addUserNameInput = document.getElementById("user_nombre")
  const addUserApellidoInput = document.getElementById("user_apellido")
  const addUserDocPrefixInput = document.getElementById("user_documento_prefix")
  const addUserDocNumberInput = document.getElementById("user_documento_number")
  const addUserCorreoInput = document.getElementById("user_correo")
  const addUserContrasenaInput = document.getElementById("user_contrasena")
  const addUserDireccionInput = document.getElementById("direccion")
  const addUserTelefonoPrefixInput = document.getElementById("telefono_prefix")
  const addUserTelefonoNumberInput = document.getElementById("telefono_number")
  const addUserFotoInput = document.getElementById("user_foto")

  // Input fields for Edit User Modal
  const editUserNameInput = document.getElementById("nombre_user_edit")
  const editUserApellidoInput = document.getElementById("apellido_user_edit")
  const editUserDocPrefixInput = document.getElementById("documento_user_edit_prefix")
  const editUserDocNumberInput = document.getElementById("documento_user_edit_number")
  const editUserCorreoInput = document.getElementById("correo_user_edit")
  const editUserDireccionInput = document.getElementById("direccion_user_edit") // NEW
  const editUserTelefonoPrefixInput = document.getElementById("telefono_user_edit_prefix")
  const editUserTelefonoNumberInput = document.getElementById("telefono_user_edit_number")
  const editUserFotoInput = document.getElementById("foto_user_edit")
  const editUserStatusInput = document.getElementById("status_user_edit") // NEW

  const searchUserInput = document.getElementById("search-user-input")
  const userSearchButton = document.getElementById("user-search-button")
  const userTable = document.getElementById("users-table")

  // Function to show a specific section and hide others
  function showSection(sectionId) {
    document.querySelectorAll(".page").forEach((section) => {
      section.classList.remove("active")
    })
    document.getElementById(sectionId).classList.add("active")

    document.querySelectorAll(".sidebar ul li a").forEach((link) => {
      link.classList.remove("active")
      if (link.dataset.page === sectionId) {
        // Changed from data-section to data-page
        link.classList.add("active")
      }
    })
  }

  // Handle sidebar navigation clicks
  document.querySelectorAll(".sidebar ul li a").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const pageId = this.dataset.page
      if (pageId) {
        showSection(pageId)
      }
    })
  })

  // Initial load: show add-user section
  showSection("add-user") // Changed to add-user as per HTML structure

  if (logoutButton) {
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault()
      if (confirm("¿Está seguro de que desea cerrar sesión?")) {
        window.location.href = "/logout"
      }
    })
  }

  // Load users for manage-users section
  function loadUsers() {
    fetch("/api/admin/users/list")
      .then((response) => response.json())
      .then((users) => {
        const tableBody = document.querySelector("#users-table tbody")
        tableBody.innerHTML = "" // Clear existing rows
        users.forEach((user) => {
          const row = tableBody.insertRow()
          // Assuming user object has id, nombre, apellido, correo, rol, last_active_display, status
          // Adjusting to match the HTML table headers
          row.insertCell().textContent = user.nombre
          row.insertCell().textContent = user.apellido
          row.insertCell().textContent = user.correo
          row.insertCell().textContent = user.rol.charAt(0).toUpperCase() + user.rol.slice(1) // Capitalize role
          const statusOnlineCell = row.insertCell() // For Online/Offline status
          statusOnlineCell.textContent = user.status_online
          statusOnlineCell.classList.add(user.status_online === "Online" ? "status-online" : "status-offline")
          row.insertCell().textContent = user.account_status // NEW: Account Status (Activo/Deshabilitado)
          row.insertCell().textContent = user.last_active_display

          const actionsCell = row.insertCell()
          if (user.id === 1) {
            const editBtn = document.createElement("button")
            editBtn.innerHTML = '<i class="fas fa-edit"></i>'
            editBtn.classList.add("btn", "action-btn")
            editBtn.title = "Editar Usuario"
            editBtn.addEventListener("click", () => editUser(user.id))
            actionsCell.appendChild(editBtn)
          } else {
            // Otros usuarios - mostrar botones normales
            const editBtn = document.createElement("button")
            editBtn.innerHTML = '<i class="fas fa-edit"></i>'
            editBtn.classList.add("btn", "action-btn")
            editBtn.title = "Editar Usuario"
            editBtn.addEventListener("click", () => editUser(user.id))
            actionsCell.appendChild(editBtn)

            // NEW: Conditionally render Disable or Enable button
            if (user.id !== window.userInfo.id) {
              // Cannot disable/enable self
              if (user.account_status === "Activo") {
                const disableBtn = document.createElement("button")
                disableBtn.innerHTML = '<i class="fas fa-user-slash"></i>' // Icon for disable
                disableBtn.classList.add("btn", "action-btn", "delete") // Using 'delete' class for red color
                disableBtn.title = "Deshabilitar Usuario"
                disableBtn.addEventListener("click", () => disableUser(user.id, user.nombre))
                actionsCell.appendChild(disableBtn)
              } else {
                const enableBtn = document.createElement("button")
                enableBtn.innerHTML = '<i class="fas fa-user-check"></i>' // Icon for enable
                enableBtn.classList.add("btn", "action-btn") // Default color
                enableBtn.title = "Habilitar Usuario"
                enableBtn.addEventListener("click", () => enableUser(user.id, user.nombre))
                actionsCell.appendChild(enableBtn)
              }
            }
          }
        })
      })
      .catch((error) => {
        console.error("Error loading users:", error)
        displayFlashMessage("Error al cargar la lista de usuarios.", "error")
      })
  }

  if (addUserForm) {
    addUserForm.addEventListener("submit", (e) => {
      e.preventDefault()

      // Clear previous validation messages
      document.querySelectorAll(".field-validation-message").forEach((msg) => {
        msg.textContent = ""
        msg.style.display = "none"
      })

      // Basic client-side validation
      let isValid = true

      if (!addUserNameInput.value.trim()) {
        showValidationMessage("user_nombre_validation_message", "El nombre es requerido")
        isValid = false
      }

      if (!addUserApellidoInput.value.trim()) {
        showValidationMessage("user_apellido_validation_message", "El apellido es requerido")
        isValid = false
      }

      if (!addUserCorreoInput.value.trim()) {
        showValidationMessage("user_correo_validation_message", "El correo es requerido")
        isValid = false
      }

      if (!addUserContrasenaInput.value || addUserContrasenaInput.value.length < 8) {
        showValidationMessage("user_contrasena_validation_message", "La contraseña debe tener al menos 8 caracteres")
        isValid = false
      }

      if (!isValid) return

      // Submit form data
      const formData = new FormData(addUserForm)

      fetch("/api/admin/users", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            displayFlashMessage(data.message, "success")
            addUserForm.reset()
            // Optionally switch to manage users view
            showSection("manage-users")
            loadUsers()
          } else {
            displayFlashMessage("Error: " + data.message, "error")
          }
        })
        .catch((error) => {
          console.error("Error adding user:", error)
          displayFlashMessage("Error de red o del servidor al agregar usuario.", "error")
        })
    })
  }

  // --- Flash Message Display ---
  function displayFlashMessage(message, type) {
    const flashMessagesDiv = document.getElementById("flash-messages")
    if (!flashMessagesDiv) return

    // Clear all existing messages before adding a new one
    flashMessagesDiv.innerHTML = "" // ADD THIS LINE

    const alertDiv = document.createElement("div")
    alertDiv.classList.add("alert", `alert-${type}`, "fade-in")
    alertDiv.innerHTML = `
          <div class="alert-content">
              <i class="fas ${type === "success" ? "fa-check-circle" : type === "error" ? "fa-times-circle" : type === "warning" ? "fa-exclamation-triangle" : "fa-info-circle"}"></i>
              <span>${message}</span>
          </div>
          <button class="alert-close">&times;</button>
      `
    flashMessagesDiv.appendChild(alertDiv)

    // Close button functionality
    alertDiv.querySelector(".alert-close").addEventListener("click", () => {
      alertDiv.classList.remove("fade-in")
      alertDiv.classList.add("fade-out")
      alertDiv.addEventListener("animationend", () => alertDiv.remove())
    })

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.classList.remove("fade-in")
        alertDiv.classList.add("fade-out")
        alertDiv.addEventListener("animationend", () => alertDiv.remove())
      }
    }, 5000)
  }

  // Clear existing flash messages on page load (if any from Flask)
  const existingFlashMessages = document.querySelectorAll("#flash-messages .alert")
  existingFlashMessages.forEach((msg) => msg.remove())

  // --- Client-side Validation Functions ---
  function validateName(input, messageDiv) {
    const value = input.value.trim()
    if (!value || value.length < 2) {
      messageDiv.textContent = "Debe tener al menos 2 caracteres."
      messageDiv.classList.add("error")
      input.classList.add("field-invalid")
      input.classList.remove("field-valid")
      return false
    }
    if (value.length > 100) {
      messageDiv.textContent = "No puede exceder 100 caracteres."
      messageDiv.classList.add("error")
      input.classList.add("field-invalid")
      input.classList.remove("field-valid")
      return false
    }
    const namePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'\-.]+$/
    if (!namePattern.test(value)) {
      messageDiv.textContent = "Solo letras, espacios, acentos y caracteres básicos."
      messageDiv.classList.add("error")
      input.classList.add("field-invalid")
      input.classList.remove("field-valid")
      return false
    }
    messageDiv.textContent = ""
    messageDiv.classList.remove("error")
    input.classList.add("field-valid")
    input.classList.remove("field-invalid")
    return true
  }

  function validateDocument(prefixInput, numberInput, messageDiv) {
    const prefix = prefixInput.value
    const number = numberInput.value.trim()
    const fullDocument = `${prefix}-${number}`

    if (!number) {
      messageDiv.textContent = "El número de documento no puede estar vacío."
      messageDiv.classList.add("error")
      numberInput.classList.add("field-invalid")
      numberInput.classList.remove("field-valid")
      return false
    }

    const cedulaPattern = /^[VE]-\d{7,8}$/i // Matches V- or E- followed by 7 or 8 digits
    if (!cedulaPattern.test(fullDocument)) {
      messageDiv.textContent = "Formato de documento inválido. Debe ser V-XXXXXXXX, V-XXXXXXX, E-XXXXXXXX o E-XXXXXXX."
      messageDiv.classList.add("error")
      numberInput.classList.add("field-invalid")
      numberInput.classList.remove("field-valid")
      return false
    }

    if (!["V", "E"].includes(prefix.toUpperCase())) {
      messageDiv.textContent = "Solo se permiten los prefijos 'V' (venezolano) o 'E' (extranjero) para este documento."
      messageDiv.classList.add("error")
      prefixInput.classList.add("field-invalid")
      numberInput.classList.add("field-invalid")
      return false
    }

    let successMessage = ""
    if (prefix.toUpperCase() === "E") {
      successMessage = "Documento extranjero válido."
    } else {
      successMessage = "Documento venezolano válido."
    }

    messageDiv.textContent = successMessage
    messageDiv.classList.remove("error")
    messageDiv.classList.add("success")
    numberInput.classList.add("field-valid")
    numberInput.classList.remove("field-invalid")
    prefixInput.classList.add("field-valid")
    prefixInput.classList.remove("field-invalid")
    return true
  }

  function validateEmail(input, messageDiv) {
    const value = input.value.trim()
    if (!value) {
      messageDiv.textContent = "El email no puede estar vacío."
      messageDiv.classList.add("error")
      input.classList.add("field-invalid")
      input.classList.remove("field-valid")
      return false
    }
    if (value.length > 254) {
      messageDiv.textContent = "El email es demasiado largo."
      messageDiv.classList.add("error")
      input.classList.add("field-invalid")
      input.classList.remove("field-valid")
      return false
    }
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailPattern.test(value)) {
      messageDiv.textContent = "Formato de email inválido."
      messageDiv.classList.add("error")
      input.classList.add("field-invalid")
      input.classList.remove("field-valid")
      return false
    }
    messageDiv.textContent = ""
    messageDiv.classList.remove("error")
    input.classList.add("field-valid")
    input.classList.remove("field-invalid")
    return true
  }

  function validatePassword(input, messageDiv) {
    const value = input.value
    if (input.required && !value) {
      messageDiv.textContent = "La contraseña no puede estar vacía."
      messageDiv.classList.add("error")
      input.classList.add("field-invalid")
      input.classList.remove("field-valid")
      return false
    }
    if (input.required && value.length < 8) {
      messageDiv.textContent = "La contraseña debe tener al menos 8 caracteres."
      messageDiv.classList.add("error")
      input.classList.add("field-invalid")
      input.classList.remove("field-valid")
      return false
    }
    messageDiv.textContent = ""
    messageDiv.classList.remove("error")
    input.classList.add("field-valid")
    input.classList.remove("field-invalid")
    return true
  }

  function validateAddress(input, messageDiv) {
    const value = input.value.trim()
    if (!value || value.length < 5) {
      messageDiv.textContent = "La dirección debe tener al menos 5 caracteres."
      messageDiv.classList.add("error")
      input.classList.add("field-invalid")
      input.classList.remove("field-valid")
      return false
    }
    if (value.length > 255) {
      messageDiv.textContent = "La dirección no puede exceder 255 caracteres."
      messageDiv.classList.add("error")
      input.classList.add("field-invalid")
      input.classList.remove("field-valid")
      return false
    }
    const addressPattern = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s,.\-#]+$/
    if (!addressPattern.test(value)) {
      messageDiv.textContent = "La dirección contiene caracteres inválidos."
      messageDiv.classList.add("error")
      input.classList.add("field-invalid")
      input.classList.remove("field-valid")
      return true
    }
    messageDiv.textContent = ""
    messageDiv.classList.remove("error")
    input.classList.add("field-valid")
    input.classList.remove("field-invalid")
    return true
  }

  function validatePhone(prefixInput, numberInput, messageDiv) {
    const prefix = prefixInput.value
    const number = numberInput.value.trim()

    if (!prefix) {
      messageDiv.textContent = "Debe seleccionar un código de operadora."
      messageDiv.classList.add("error")
      prefixInput.classList.add("field-invalid")
      prefixInput.classList.remove("field-valid")
      return false
    }

    if (!number) {
      messageDiv.textContent = "El número de teléfono no puede estar vacío."
      messageDiv.classList.add("error")
      numberInput.classList.add("field-invalid")
      numberInput.classList.remove("field-valid")
      return false
    }

    // Validar que el número tenga exactamente 7 dígitos
    const cleanNumber = number.replace(/[^\d]/g, "")
    if (cleanNumber.length !== 7) {
      messageDiv.textContent = "El número debe tener exactamente 7 dígitos."
      messageDiv.classList.add("error")
      numberInput.classList.add("field-invalid")
      numberInput.classList.remove("field-valid")
      return false
    }

    // Validar que el prefijo sea uno de los permitidos
    const validPrefixes = ["0412", "0422", "0426", "0414", "0424"]
    if (!validPrefixes.includes(prefix)) {
      messageDiv.textContent = "Código de operadora inválido."
      messageDiv.classList.add("error")
      prefixInput.classList.add("field-invalid")
      numberInput.classList.add("field-invalid")
      return false
    }

    messageDiv.textContent = ""
    messageDiv.classList.remove("error")
    prefixInput.classList.add("field-valid")
    prefixInput.classList.remove("field-invalid")
    numberInput.classList.add("field-valid")
    numberInput.classList.remove("field-invalid")
    return true
  }

  function validateFile(input, messageDiv) {
    if (input.files.length === 0) {
      messageDiv.textContent = "" // File is optional, so no error if empty
      input.classList.remove("field-invalid", "field-valid")
      return true
    }

    const file = input.files[0]
    const allowedExtensions = ["png", "jpg", "jpeg", "gif"]
    const fileExtension = file.name.split(".").pop().toLowerCase()
    const maxSize = 5 * 1024 * 1024 // 5 MB

    if (!allowedExtensions.includes(fileExtension)) {
      messageDiv.textContent = `Tipo de archivo no permitido. Permitidos: ${allowedExtensions.join(", ")}.`
      messageDiv.classList.add("error")
      input.classList.add("field-invalid")
      input.classList.remove("field-valid")
      return false
    }

    if (file.size > maxSize) {
      messageDiv.textContent = `El archivo es demasiado grande. Máximo: ${maxSize / (1024 * 1024)}MB.`
      messageDiv.classList.add("error")
      input.classList.add("field-invalid")
      input.classList.remove("field-valid")
      return false
    }

    messageDiv.textContent = ""
    messageDiv.classList.remove("error")
    input.classList.add("field-valid")
    input.classList.remove("field-invalid")
    return true
  }

  // --- Attach Validation Listeners for Add User Form ---
  if (addUserNameInput) {
    addUserNameInput.addEventListener("input", () =>
      validateName(addUserNameInput, document.getElementById("user_nombre_validation_message")),
    )
  }
  if (addUserApellidoInput) {
    addUserApellidoInput.addEventListener("input", () =>
      validateName(addUserApellidoInput, document.getElementById("user_apellido_validation_message")),
    )
  }
  if (addUserDocPrefixInput && addUserDocNumberInput) {
    const docValidationHandler = () =>
      validateDocument(
        addUserDocPrefixInput,
        addUserDocNumberInput,
        document.getElementById("user_documento_validation_message"),
      )
    addUserDocPrefixInput.addEventListener("change", docValidationHandler)
    addUserDocNumberInput.addEventListener("input", docValidationHandler)
  }
  if (addUserCorreoInput) {
    addUserCorreoInput.addEventListener("input", () =>
      validateEmail(addUserCorreoInput, document.getElementById("user_correo_validation_message")),
    )
  }
  if (addUserContrasenaInput) {
    addUserContrasenaInput.addEventListener("input", () =>
      validatePassword(addUserContrasenaInput, document.getElementById("user_contrasena_validation_message")),
    )
  }
  if (addUserDireccionInput) {
    addUserDireccionInput.addEventListener("input", () =>
      validateAddress(addUserDireccionInput, document.getElementById("direccion_validation_message")),
    )
  }
  if (addUserTelefonoPrefixInput && addUserTelefonoNumberInput) {
    addUserTelefonoPrefixInput.addEventListener("change", () =>
      validatePhone(
        addUserTelefonoPrefixInput,
        addUserTelefonoNumberInput,
        document.getElementById("telefono_validation_message"),
      ),
    )
    addUserTelefonoNumberInput.addEventListener("input", () =>
      validatePhone(
        addUserTelefonoPrefixInput,
        addUserTelefonoNumberInput,
        document.getElementById("telefono_validation_message"),
      ),
    )
  }
  if (addUserFotoInput) {
    addUserFotoInput.addEventListener("change", () =>
      validateFile(addUserFotoInput, document.getElementById("user_foto_validation_message")),
    )
  }

  // --- Handle Add User Form Submission ---
  if (addUserForm) {
    addUserForm.addEventListener("submit", handleAddUserSubmit)
  }

  function handleAddUserSubmit(e) {
    e.preventDefault()
    console.log("DEBUG JS: Form submission initiated, preventing default.")

    const submitButton = addUserForm.querySelector('button[type="submit"]')
    submitButton.disabled = true
    submitButton.textContent = "Agregando Usuario..."

    // Run all client-side validations
    const isNameValid = validateName(addUserNameInput, document.getElementById("user_nombre_validation_message"))
    const isApellidoValid = validateName(
      addUserApellidoInput,
      document.getElementById("user_apellido_validation_message"),
    )
    const isDocumentValid = validateDocument(
      addUserDocPrefixInput,
      addUserDocNumberInput,
      document.getElementById("user_documento_validation_message"),
    )
    const isEmailValid = validateEmail(addUserCorreoInput, document.getElementById("user_correo_validation_message"))
    const isPasswordValid = validatePassword(
      addUserContrasenaInput,
      document.getElementById("user_contrasena_validation_message"),
    )
    const isAddressValid = validateAddress(
      addUserDireccionInput,
      document.getElementById("direccion_validation_message"),
    )
    const isPhoneValid = validatePhone(
      addUserTelefonoPrefixInput,
      addUserTelefonoNumberInput,
      document.getElementById("telefono_validation_message"),
    )
    const isFotoValid = validateFile(addUserFotoInput, document.getElementById("user_foto_validation_message"))

    // Check if all required fields are filled and valid
    const isRolSelected = document.getElementById("user_rol").value !== ""

    if (!isRolSelected) {
      displayFlashMessage("Por favor, seleccione un rol para el usuario.", "error")
      submitButton.disabled = false
      submitButton.textContent = "Agregar Usuario"
      return
    }

    if (
      !isNameValid ||
      !isApellidoValid ||
      !isDocumentValid ||
      !isEmailValid ||
      !isPasswordValid ||
      !isAddressValid ||
      !isPhoneValid ||
      !isFotoValid ||
      !isRolSelected
    ) {
      console.log("DEBUG JS: Client-side validation failed.")
      displayFlashMessage("Por favor, corrija los errores en el formulario.", "error")
      submitButton.disabled = false
      submitButton.textContent = "Agregar Usuario"
      return
    }

    const formData = new FormData(addUserForm)

    // Add the selected role to formData
    formData.append("rol", document.getElementById("user_rol").value)

    // Add the combined document to formData (backend expects 'cedula')
    formData.append("cedula", `${addUserDocPrefixInput.value}-${addUserDocNumberInput.value.trim()}`)

    const combinedPhone = `${addUserTelefonoPrefixInput.value}${addUserTelefonoNumberInput.value.trim()}`
    formData.append("telefono", combinedPhone)
    formData.append("telefono_prefix", addUserTelefonoPrefixInput.value)
    formData.append("telefono_number", addUserTelefonoNumberInput.value.trim())

    // DEBUG: Log FormData content
    console.log("DEBUG JS: FormData content before fetch:")
    for (const pair of formData.entries()) {
      console.log(pair[0] + ": " + pair[1])
    }

    fetch(addUserForm.action, {
      method: addUserForm.method,
      body: formData,
    })
      .then((response) => {
        console.log("DEBUG JS: Received raw response from backend:", response)
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON")
        }
        // Parse JSON regardless of HTTP status code
        return response.json().then((data) => ({
          status: response.status,
          ok: response.ok,
          data: data,
        }))
      })
      .then((result) => {
        console.log("DEBUG JS: Received parsed JSON data from backend:", result.data)
        if (result.ok && result.data.success) {
          console.log("DEBUG JS: Backend reported success:", result.data.message)
          displayFlashMessage(result.data.message, "success")
          addUserForm.reset()
          // Clear validation messages and classes after successful submission
          document.querySelectorAll(".field-validation-message").forEach((div) => {
            div.textContent = ""
            div.classList.remove("error", "success")
          })
          document.querySelectorAll("input, select").forEach((input) => {
            input.classList.remove("field-valid", "field-invalid")
          })
          // Hide photo preview
          const userFotoPreview = document.getElementById("user_foto_preview")
          if (userFotoPreview) {
            userFotoPreview.style.display = "none"
            userFotoPreview.src = ""
          }
          loadUsers() // Reload users table
          showSection("manage-users") // Redirect to manage users after adding
        } else {
          console.log("DEBUG JS: Backend reported error:", result.data.message)
          let errorMessage = result.data.message || "Error desconocido"

          // Provide specific messages for common HTTP status codes
          if (result.status === 409) {
            errorMessage = result.data.message || "El usuario ya existe en el sistema"
          } else if (result.status === 500) {
            errorMessage = result.data.message || "Error interno del servidor"
          }

          displayFlashMessage("Error: " + errorMessage, "error")
        }
      })
      .catch((error) => {
        console.error("DEBUG JS: Error during fetch:", error)
        if (error.message.includes("Response is not JSON")) {
          displayFlashMessage("Error de formato en la respuesta del servidor.", "error")
        } else if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
          displayFlashMessage("Error de conexión. Verifique su conexión a internet.", "error")
        } else {
          displayFlashMessage("Error de red o del servidor al agregar usuario.", "error")
        }
      })
      .finally(() => {
        submitButton.disabled = false
        submitButton.textContent = "Agregar Usuario"
        console.log("DEBUG JS: Fetch operation finished, button re-enabled.")
      })
  }

  // --- User Management (Sistema Dashboard) ---

  // Open Add User Modal (This button is not in the provided HTML, but keeping the logic if it exists elsewhere)
  if (addUserBtn) {
    addUserBtn.addEventListener("click", () => {
      userModalTitle.textContent = "Agregar Nuevo Usuario"
      userForm.reset() // This resets the edit form, not the add form
      userIdInput.value = ""
      contrasenaInput.required = true // Password is required for new users
      currentFotoPreview.style.display = "none"
      currentFotoPreview.src = ""
      userModal.style.display = "block"
    })
  }

  // Close Modals
  closeModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (userModal) userModal.style.display = "none"
      if (editProfileModal) editProfileModal.style.display = "none"
      if (changePasswordModal) changePasswordModal.style.display = "none"
    })
  })

  window.addEventListener("click", (event) => {
    if (userModal && event.target == userModal) {
      userModal.style.display = "none"
    }
    if (editProfileModal && event.target == editProfileModal) {
      editProfileModal.style.display = "none"
    }
    if (changePasswordModal && event.target == changePasswordModal) {
      changePasswordModal.style.display = "none"
    }
  })

  // Load users when the manage-users section is activated
  const manageUsersLink = document.querySelector('a[data-page="manage-users"]')
  if (manageUsersLink) {
    manageUsersLink.addEventListener("click", loadUsers)
  }

  // Edit User Function
  function editUser(userId) {
    fetch(`/api/admin/users/${userId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((user) => {
        if (user.success === false) {
          displayFlashMessage("Error: " + user.message, "error")
          return
        }

        if (userModalTitle) userModalTitle.textContent = "Editar Usuario"
        if (userIdInput) userIdInput.value = user.id
        if (editUserNameInput) editUserNameInput.value = user.nombre || ""
        if (editUserApellidoInput) editUserApellidoInput.value = user.apellido || ""

        // Split cedula into prefix and number for edit form
        const cedulaParts = user.cedula ? user.cedula.split("-") : ["V", ""]
        if (cedulaParts.length === 2) {
          if (editUserDocPrefixInput) editUserDocPrefixInput.value = cedulaParts[0]
          if (editUserDocNumberInput) editUserDocNumberInput.value = cedulaParts[1]
        } else {
          if (editUserDocPrefixInput) editUserDocPrefixInput.value = "V" // Default
          if (editUserDocNumberInput) editUserDocNumberInput.value = user.cedula || "" // Fallback
        }

        if (editUserCorreoInput) editUserCorreoInput.value = user.correo || ""
        if (editUserDireccionInput) editUserDireccionInput.value = user.direccion || ""

        // Split telefono into prefix and number for edit form
        if (user.telefono) {
          const phoneStr = user.telefono.toString()
          if (phoneStr.length === 11) {
            const prefix = phoneStr.substring(0, 4)
            const number = phoneStr.substring(4)
            if (editUserTelefonoPrefixInput) editUserTelefonoPrefixInput.value = prefix
            if (editUserTelefonoNumberInput) editUserTelefonoNumberInput.value = number
          }
        }

        const rolEditSelect = document.getElementById("rol_user_edit")
        if (rolEditSelect) rolEditSelect.value = user.rol || ""

        if (editUserStatusInput) editUserStatusInput.value = user.status || "active"

        // Display current photo
        if (currentFotoPreview) {
          if (user.foto) {
            currentFotoPreview.src = user.foto
            currentFotoPreview.style.display = "block"
          } else {
            currentFotoPreview.src = "/static/img/user.jpg"
            currentFotoPreview.style.display = "block"
          }
        }

        if (userModal) userModal.style.display = "block"
      })
      .catch((error) => {
        console.error("Error fetching user for edit:", error)
        displayFlashMessage("Error al cargar datos del usuario para edición.", "error")
      })
  }

  // Handle Edit User Form Submission
  if (userForm) {
    userForm.addEventListener("submit", handleEditUserSubmit)
  }

  function handleEditUserSubmit(e) {
    e.preventDefault()

    // Client-side validation for edit form
    let isValid = true

    // Clear previous validation messages
    document.querySelectorAll(".field-validation-message").forEach((msg) => {
      msg.textContent = ""
      msg.style.display = "none"
    })

    if (!editUserNameInput.value.trim()) {
      showValidationMessage("nombre_user_edit_validation_message", "El nombre es requerido")
      isValid = false
    }

    if (!editUserApellidoInput.value.trim()) {
      showValidationMessage("apellido_user_edit_validation_message", "El apellido es requerido")
      isValid = false
    }

    if (!editUserCorreoInput.value.trim()) {
      showValidationMessage("correo_user_edit_validation_message", "El correo es requerido")
      isValid = false
    }

    if (!isValid) return

    const formData = new FormData(userForm)

    fetch("/api/admin/users", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          displayFlashMessage(data.message, "success")
          userModal.style.display = "none"
          loadUsers() // Reload users table
        } else {
          displayFlashMessage("Error: " + data.message, "error")
        }
      })
      .catch((error) => {
        console.error("Error updating user:", error)
        displayFlashMessage("Error de red o del servidor al actualizar usuario.", "error")
      })
  }

  function showValidationMessage(elementId, message) {
    const element = document.getElementById(elementId)
    if (element) {
      element.textContent = message
      element.style.display = "block"
      element.style.color = "#dc3545"
    }
  }

  // MODIFIED: Renamed from deleteUser to disableUser
  function disableUser(userId, userName) {
    if (userId === 1) {
      displayFlashMessage(
        "No se puede deshabilitar al Usuario Vendedor Interno de Prealca (ID: 1). Este usuario debe permanecer siempre activo.",
        "error",
      )
      return
    }

    if (confirm(`¿Está seguro de que desea deshabilitar al usuario ${userName}?`)) {
      fetch(`/api/admin/users/disable/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            displayFlashMessage(data.message, "success")
            loadUsers() // Reload users table
          } else {
            displayFlashMessage("Error: " + data.message, "error")
          }
        })
        .catch((error) => {
          console.error("Error disabling user:", error)
          displayFlashMessage("Error de red o del servidor al deshabilitar usuario.", "error")
        })
    }
  }

  // NEW: Function to enable a user
  function enableUser(userId, userName) {
    if (confirm(`¿Está seguro de que desea habilitar al usuario ${userName}?`)) {
      fetch(`/api/admin/users/enable/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            displayFlashMessage(data.message, "success")
            loadUsers() // Reload users table
          } else {
            displayFlashMessage("Error: " + data.message, "error")
          }
        })
        .catch((error) => {
          console.error("Error enabling user:", error)
          displayFlashMessage("Error de red o del servidor al habilitar usuario.", "error")
        })
    }
  }

  function filterUsers() {
    const searchTerm = searchUserInput.value.toLowerCase()
    const rows = userTable.querySelectorAll("tbody tr")

    rows.forEach((row) => {
      const name = row.cells[0].textContent.toLowerCase() // Nombre
      const apellido = row.cells[1].textContent.toLowerCase() // Apellido
      const email = row.cells[2].textContent.toLowerCase() // Correo
      const role = row.cells[3].textContent.toLowerCase() // Rol
      const accountStatus = row.cells[5].textContent.toLowerCase() // Estado de Cuenta (Activo/Deshabilitado) - Fixed index

      if (
        name.includes(searchTerm) ||
        apellido.includes(searchTerm) ||
        email.includes(searchTerm) ||
        role.includes(searchTerm) ||
        accountStatus.includes(searchTerm)
      ) {
        row.style.display = "" // Show row
      } else {
        row.style.display = "none" // Hide row
      }
    })
  }

  if (searchUserInput) {
    searchUserInput.addEventListener("input", filterUsers) // Changed to 'input' for real-time filtering
  }

  if (userSearchButton) {
    userSearchButton.addEventListener("click", filterUsers)
  }

  if (searchUserInput) {
    searchUserInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault() // Prevent form submission
        filterUsers()
      }
    })
  }

  // Set up heartbeat to keep session alive
  setInterval(
    async () => {
      try {
        await fetch("/api/user/heartbeat", { method: "POST" })
      } catch (error) {
        console.error("Heartbeat failed:", error)
      }
    },
    5 * 60 * 1000,
  ) // Every 5 minutes
})
