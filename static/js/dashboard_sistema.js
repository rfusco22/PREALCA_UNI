document.addEventListener("DOMContentLoaded", () => {
  const sidebarLinks = document.querySelectorAll(".sidebar ul li a")
  const logoutButton = document.getElementById("logout-btn")

  // Modals and Forms for User Management
  const userModal = document.getElementById("user-form-modal")
  const addUserForm = document.getElementById("add-user-form")
  const userForm = document.getElementById("user-form") // This is the edit form
  const closeModalButtons = document.querySelectorAll(".close")
  const userModalTitle = document.getElementById("form-title-user")
  const userIdInput = document.getElementById("user_id_edit")
  const currentFotoPreview = document.getElementById("current_user_photo_preview")

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
  const editUserDocTypeInput = document.getElementById("documento_user_edit_prefix")
  const editUserDocNumberInput = document.getElementById("documento_user_edit_number")
  const editUserCorreoInput = document.getElementById("correo_user_edit")
  const editUserDireccionInput = document.getElementById("direccion_user_edit")
  const editUserTelefonoPrefixInput = document.getElementById("telefono_user_edit_prefix")
  const editUserTelefonoNumberInput = document.getElementById("telefono_user_edit_number")
  const editUserFotoInput = document.getElementById("foto_user_edit")
  const editUserStatusInput = document.getElementById("status_user_edit")
  const editUserRolInput = document.getElementById("rol_user_edit")

  // Function to show a specific section and hide others
  function showSection(sectionId) {
    document.querySelectorAll(".page").forEach((section) => {
      section.classList.remove("active")
    })
    document.getElementById(sectionId).classList.add("active")

    document.querySelectorAll(".sidebar ul li a").forEach((link) => {
      link.classList.remove("active")
      if (link.dataset.page === sectionId) {
        link.classList.add("active")
      }
    })
  }

  // Handle sidebar navigation clicks
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const pageId = this.dataset.page
      if (pageId) {
        showSection(pageId)
      }
    })
  })

  // Initial load: show add-user section and load users for the manage section
  showSection("add-user")
  loadUsers()

  // Load users when the manage-users link is clicked
  document.querySelector('a[data-page="manage-users"]').addEventListener("click", loadUsers)


  // --- VALIDATION FUNCTIONS ---
  function setValidationFeedback(element, isValid, messageDiv, message) {
    if (!messageDiv) return;
    element.classList.remove("field-valid", "field-invalid");
    messageDiv.classList.remove("error", "success");
    messageDiv.textContent = "";

    if (isValid === true) {
        element.classList.add("field-valid");
        messageDiv.classList.add("success");
        messageDiv.textContent = message || "Válido.";
    } else if (isValid === false) {
        element.classList.add("field-invalid");
        messageDiv.classList.add("error");
        messageDiv.textContent = message || "Inválido";
    }
  }

  function validateName(input, messageDiv) {
      const value = input.value.trim();
      if (!value || value.length < 2) {
          setValidationFeedback(input, false, messageDiv, "Debe tener al menos 2 caracteres.");
          return false;
      }
      if (value.length > 100) {
          setValidationFeedback(input, false, messageDiv, "No puede exceder 100 caracteres.");
          return false;
      }
      const namePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'\-.]+$/;
      if (!namePattern.test(value)) {
          setValidationFeedback(input, false, messageDiv, "Solo letras, espacios y acentos.");
          return false;
      }
      setValidationFeedback(input, true, messageDiv, "Válido.");
      return true;
  }

  function validatePhone(prefixInput, numberInput, messageDiv) {
      const prefix = prefixInput.value;
      const number = numberInput.value.trim();
      if (!prefix || !number) {
          setValidationFeedback(numberInput, false, messageDiv, "El teléfono es requerido.");
          return false;
      }
      const cleanNumber = number.replace(/[^\d]/g, "");
      if (cleanNumber.length !== 7) {
          setValidationFeedback(numberInput, false, messageDiv, "El número debe tener 7 dígitos.");
          return false;
      }
      setValidationFeedback(numberInput, true, messageDiv, "Teléfono válido.");
      return true;
  }
    
  function validateEmail(input, messageDiv) {
      const value = input.value.trim();
      if (!value) {
          setValidationFeedback(input, false, messageDiv, "El email no puede estar vacío.");
          return false;
      }
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(value)) {
          setValidationFeedback(input, false, messageDiv, "Formato de email inválido.");
          return false;
      }
      setValidationFeedback(input, true, messageDiv, "Email válido.");
      return true;
  }
    
  function validatePassword(input, messageDiv) {
        const value = input.value;
        if (input.required && !value) {
            setValidationFeedback(input, false, messageDiv, "La contraseña no puede estar vacía.");
            return false;
        }
        if (input.required && value.length < 8) {
            setValidationFeedback(input, false, messageDiv, "Mínimo 8 caracteres.");
            return false;
        }
        setValidationFeedback(input, true, messageDiv, "Contraseña segura.");
        return true;
  }
    
  function validateAddress(input, messageDiv) {
        const value = input.value.trim();
        if (!value || value.length < 5) {
            setValidationFeedback(input, false, messageDiv, "La dirección debe tener al menos 5 caracteres.");
            return false;
        }
        setValidationFeedback(input, true, messageDiv, "Dirección válida.");
        return true;
  }

  function validateDocument(prefixInput, numberInput, messageDiv) {
    const prefix = prefixInput.value;
    const number = numberInput.value.trim();
    if (!number) {
        setValidationFeedback(numberInput, false, messageDiv, "El número de documento no puede estar vacío.");
        return false;
    }
    const cedulaPattern = /^\d{7,8}$/;
    if (!cedulaPattern.test(number)) {
        setValidationFeedback(numberInput, false, messageDiv, "Debe tener entre 7 y 8 dígitos numéricos.");
        return false;
    }
    setValidationFeedback(numberInput, true, messageDiv, "Documento válido.");
    return true;
  }

  function validateFile(input, messageDiv) {
    if (input.files.length === 0) {
      setValidationFeedback(input, true, messageDiv, ""); // Opcional
      return true;
    }
    const file = input.files[0];
    const allowedExtensions = ["png", "jpg", "jpeg", "gif"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    const maxSize = 5 * 1024 * 1024; // 5 MB

    if (!allowedExtensions.includes(fileExtension)) {
      setValidationFeedback(input, false, messageDiv, `Tipo de archivo no permitido.`);
      return false;
    }
    if (file.size > maxSize) {
      setValidationFeedback(input, false, messageDiv, `El archivo es demasiado grande (Máx 5MB).`);
      return false;
    }
    setValidationFeedback(input, true, messageDiv, "Archivo válido.");
    return true;
  }
    
  // Attach validation listeners
  addUserNameInput.addEventListener("input", () => validateName(addUserNameInput, document.getElementById("user_nombre_validation_message")));
  addUserApellidoInput.addEventListener("input", () => validateName(addUserApellidoInput, document.getElementById("user_apellido_validation_message")));
  addUserDocNumberInput.addEventListener("input", () => validateDocument(addUserDocPrefixInput, addUserDocNumberInput, document.getElementById("user_documento_validation_message")));
  addUserCorreoInput.addEventListener("input", () => validateEmail(addUserCorreoInput, document.getElementById("user_correo_validation_message")));
  addUserContrasenaInput.addEventListener("input", () => validatePassword(addUserContrasenaInput, document.getElementById("user_contrasena_validation_message")));
  addUserDireccionInput.addEventListener("input", () => validateAddress(addUserDireccionInput, document.getElementById("direccion_validation_message")));
  addUserTelefonoNumberInput.addEventListener("input", () => validatePhone(addUserTelefonoPrefixInput, addUserTelefonoNumberInput, document.getElementById("telefono_validation_message")));
  addUserFotoInput.addEventListener("change", () => validateFile(addUserFotoInput, document.getElementById("user_foto_validation_message")));


  // Load users for manage-users section
  function loadUsers() {
    fetch("/api/admin/users/list")
      .then((response) => response.json())
      .then((users) => {
        const tableBody = document.querySelector("#users-table tbody")
        tableBody.innerHTML = "" // Clear existing rows
        users.forEach((user) => {
          const row = tableBody.insertRow()
          row.insertCell().textContent = user.nombre
          row.insertCell().textContent = user.apellido
          row.insertCell().textContent = user.correo
          row.insertCell().textContent = user.rol.charAt(0).toUpperCase() + user.rol.slice(1)
          const statusOnlineCell = row.insertCell()
          statusOnlineCell.textContent = user.status_online
          statusOnlineCell.classList.add(user.status_online === "Online" ? "status-online" : "status-offline")
          row.insertCell().textContent = user.account_status
          row.insertCell().textContent = user.last_active_display

          const actionsCell = row.insertCell()
          const editBtn = document.createElement("button")
          editBtn.innerHTML = '<i class="fas fa-edit"></i>'
          editBtn.classList.add("btn-sm", "btn-primary")
          editBtn.title = "Editar Usuario"
          editBtn.addEventListener("click", () => editUser(user.id))
          actionsCell.appendChild(editBtn)

          if (user.id !== 1 && user.id !== window.userInfo.id) {
              if (user.account_status === "Activo") {
                const disableBtn = document.createElement("button")
                disableBtn.innerHTML = '<i class="fas fa-user-slash"></i>'
                disableBtn.classList.add("btn-sm", "btn-danger")
                disableBtn.title = "Deshabilitar Usuario"
                disableBtn.addEventListener("click", () => disableUser(user.id, user.nombre))
                actionsCell.appendChild(disableBtn)
              } else {
                const enableBtn = document.createElement("button")
                enableBtn.innerHTML = '<i class="fas fa-user-check"></i>'
                enableBtn.classList.add("btn-sm", "btn-success")
                enableBtn.title = "Habilitar Usuario"
                enableBtn.addEventListener("click", () => enableUser(user.id, user.nombre))
                actionsCell.appendChild(enableBtn)
              }
          }
        })
      })
      .catch((error) => {
        console.error("Error loading users:", error)
        displayFlashMessage("Error al cargar usuarios.", "error")
      })
  }

  // Logout functionality
  if (logoutButton) {
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault()
      fetch("/api/logout", {
        method: "POST"
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            window.location.href = "/"
          } else {
            displayFlashMessage("Error al cerrar sesión: " + data.message, "error")
          }
        })
        .catch(error => {
          console.error("Error:", error)
          displayFlashMessage("Error de red al cerrar sesión.", "error")
        })
    })
  }

  // Flash Message Display
  function displayFlashMessage(message, type) {
    const flashMessagesDiv = document.getElementById("flash-messages")
    if (!flashMessagesDiv) return;
    flashMessagesDiv.innerHTML = "";
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    flashMessagesDiv.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
  }

  // Handle Add User Form Submission
  if (addUserForm) {
    addUserForm.addEventListener("submit", (e) => {
        e.preventDefault()
        const submitButton = addUserForm.querySelector('button[type="submit"]')
        submitButton.disabled = true
        submitButton.textContent = "Agregando..."

        const formData = new FormData(addUserForm)
        
        // Combine phone parts before sending
        const fullPhone = addUserTelefonoPrefixInput.value + addUserTelefonoNumberInput.value;
        formData.append("telefono", fullPhone);

        fetch(addUserForm.action, {
            method: addUserForm.method,
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayFlashMessage(data.message, "success")
                addUserForm.reset()
                loadUsers()
                showSection("manage-users")
            } else {
                displayFlashMessage("Error: " + data.message, "error")
            }
        })
        .catch(error => {
            displayFlashMessage("Error de red o del servidor al agregar usuario.", "error")
        })
        .finally(() => {
            submitButton.disabled = false
            submitButton.textContent = "Agregar Usuario"
        })
    });
  }

  // --- User Management ---
  closeModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (userModal) userModal.style.display = "none"
    })
  })

  window.addEventListener("click", (event) => {
    if (userModal && event.target == userModal) {
      userModal.style.display = "none"
    }
  })

  // Edit User Function
  function editUser(userId) {
    fetch(`/api/admin/users/${userId}`)
      .then(response => response.json())
      .then(user => {
        if (user.success === false) {
          displayFlashMessage("Error: " + user.message, "error");
          return;
        }
        userModalTitle.textContent = "Editar Usuario";
        userIdInput.value = user.id;
        editUserNameInput.value = user.nombre;
        editUserApellidoInput.value = user.apellido;
        
        const cedulaParts = user.cedula.split('-');
        if (cedulaParts.length === 2) {
          editUserDocTypeInput.value = cedulaParts[0];
          editUserDocNumberInput.value = cedulaParts[1];
        }

        editUserCorreoInput.value = user.correo;
        editUserDireccionInput.value = user.direccion || "";

        if (user.telefono) {
          const phoneStr = user.telefono.toString();
          if (phoneStr.length === 11) {
            editUserTelefonoPrefixInput.value = phoneStr.substring(0, 4);
            editUserTelefonoNumberInput.value = phoneStr.substring(4);
          }
        }

        editUserRolInput.value = user.rol;
        editUserStatusInput.value = user.status;

        if (user.foto) {
          currentFotoPreview.src = user.foto;
          currentFotoPreview.style.display = "block";
        } else {
          currentFotoPreview.style.display = "none";
        }

        userModal.style.display = "block";
      })
      .catch(error => {
        console.error("Error fetching user for edit:", error);
        displayFlashMessage("Error al cargar datos del usuario para edición.", "error");
      });
  }

  // Handle Edit User Form Submission
  if (userForm) {
      userForm.addEventListener("submit", (e) => {
        e.preventDefault()
        const formData = new FormData(userForm)
        const userId = userIdInput.value;

        // Combine phone parts for submission
        const fullPhone = editUserTelefonoPrefixInput.value + editUserTelefonoNumberInput.value;
        formData.set("telefono", fullPhone); // Use .set to overwrite if parts already exist


        fetch(`/api/admin/users/${userId}`, {
            method: "POST",
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayFlashMessage(data.message, "success")
                userModal.style.display = "none"
                loadUsers()
            } else {
                displayFlashMessage("Error: " + data.message, "error")
            }
        })
        .catch(error => {
            displayFlashMessage("Error de red o del servidor al actualizar usuario.", "error")
        })
    })
  }

  function disableUser(userId, userName) {
    if (confirm(`¿Está seguro de que desea deshabilitar al usuario ${userName}?`)) {
      fetch(`/api/admin/users/disable/${userId}`, {
        method: "POST"
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            displayFlashMessage(data.message, "success")
            loadUsers()
          } else {
            displayFlashMessage("Error: " + data.message, "error")
          }
        })
        .catch(error => {
          displayFlashMessage("Error de red o del servidor al deshabilitar usuario.", "error")
        })
    }
  }

  function enableUser(userId, userName) {
    if (confirm(`¿Está seguro de que desea habilitar al usuario ${userName}?`)) {
      fetch(`/api/admin/users/enable/${userId}`, {
        method: "POST"
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            displayFlashMessage(data.message, "success")
            loadUsers()
          } else {
            displayFlashMessage("Error: " + data.message, "error")
          }
        })
        .catch(error => {
          displayFlashMessage("Error de red o del servidor al habilitar usuario.", "error")
        })
    }
  }

  // Heartbeat to keep session alive
  setInterval(
    async () => {
      try {
        await fetch("/api/user/heartbeat", { method: "POST" })
      } catch (error) {
        console.error("Heartbeat failed:", error)
      }
    },
    5 * 60 * 1000,
  )
});
