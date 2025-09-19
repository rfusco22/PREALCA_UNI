document.addEventListener("DOMContentLoaded", () => {
  const sidebarLinks = document.querySelectorAll(".sidebar-nav ul li a");
  const sections = document.querySelectorAll(".dashboard-section");
  const logoutButton = document.getElementById("logout-btn");

  // Modals and Forms for User Management
  const userModal = document.getElementById("user-form-modal");
  const addUserBtn = document.getElementById("add-user-btn");
  const closeModalButtons = document.querySelectorAll(".close");
  const userForm = document.getElementById("user-form");
  const addUserForm = document.getElementById("add-user-form");
  const userModalTitle = document.getElementById("form-title-user");
  const userIdInput = document.getElementById("user_id_edit");
  const contrasenaInput = document.getElementById("user_contrasena");
  const currentFotoPreview = document.getElementById("current_user_photo_preview");
  const fotoInput = document.getElementById("user_foto");

  // Input fields for Add User Form
  const addUserNameInput = document.getElementById("user_nombre");
  const addUserApellidoInput = document.getElementById("user_apellido");
  const addUserDocPrefixInput = document.getElementById("user_documento_prefix");
  const addUserDocNumberInput = document.getElementById("user_documento_number");
  const addUserCorreoInput = document.getElementById("user_correo");
  const addUserContrasenaInput = document.getElementById("user_contrasena");
  const addUserDireccionInput = document.getElementById("direccion");
  const addUserTelefonoPrefixInput = document.getElementById("telefono_prefix");
  const addUserTelefonoNumberInput = document.getElementById("telefono_number");
  const addUserFotoInput = document.getElementById("user_foto");

  // Input fields for Edit User Modal
  const editUserNameInput = document.getElementById("nombre_user_edit");
  const editUserApellidoInput = document.getElementById("apellido_user_edit");
  const editUserDocPrefixInput = document.getElementById("documento_type_user_edit"); // CORREGIDO
  const editUserDocNumberInput = document.getElementById("documento_number_user_edit"); // CORREGIDO
  const editUserCorreoInput = document.getElementById("correo_user_edit");
  const editUserDireccionInput = document.getElementById("direccion_user_edit");
  const editUserTelefonoPrefixInput = document.getElementById("telefono_prefix_user_edit"); // CORREGIDO
  const editUserTelefonoNumberInput = document.getElementById("telefono_number_user_edit"); // CORREGIDO
  const editUserFotoInput = document.getElementById("foto_user_edit");
  const editUserStatusInput = document.getElementById("status_user_edit");


  function showSection(sectionId) {
    document.querySelectorAll(".page").forEach((section) => {
      section.classList.remove("active");
    });
    document.getElementById(sectionId).classList.add("active");

    document.querySelectorAll(".sidebar ul li a").forEach((link) => {
      link.classList.remove("active");
      if (link.dataset.page === sectionId) {
        link.classList.add("active");
      }
    });
  }

  document.querySelectorAll(".sidebar ul li a").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const pageId = this.dataset.page;
      if (pageId) {
        showSection(pageId);
      }
    });
  });

  showSection("add-user");

  function loadUsers() {
    fetch("/api/admin/users/list")
      .then((response) => response.json())
      .then((users) => {
        const tableBody = document.querySelector("#users-table tbody");
        tableBody.innerHTML = "";
        users.forEach((user) => {
          const row = tableBody.insertRow();
          row.insertCell().textContent = user.nombre;
          row.insertCell().textContent = user.apellido;
          row.insertCell().textContent = user.correo;
          row.insertCell().textContent = user.rol.charAt(0).toUpperCase() + user.rol.slice(1);
          const statusOnlineCell = row.insertCell();
          statusOnlineCell.textContent = user.status_online;
          statusOnlineCell.classList.add(user.status_online === "Online" ? "status-online" : "status-offline");
          row.insertCell().textContent = user.account_status;
          row.insertCell().textContent = user.last_active_display;

          const actionsCell = row.insertCell();
          const editBtn = document.createElement("button");
          editBtn.innerHTML = '<i class="fas fa-edit"></i>';
          editBtn.classList.add("btn", "action-btn");
          editBtn.title = "Editar Usuario";
          editBtn.addEventListener("click", () => editUser(user.id));
          actionsCell.appendChild(editBtn);

          if (user.id !== 1 && user.id !== window.userInfo.id) {
            if (user.account_status === "Activo") {
              const disableBtn = document.createElement("button");
              disableBtn.innerHTML = '<i class="fas fa-user-slash"></i>';
              disableBtn.classList.add("btn", "action-btn", "delete");
              disableBtn.title = "Deshabilitar Usuario";
              disableBtn.addEventListener("click", () => disableUser(user.id, user.nombre));
              actionsCell.appendChild(disableBtn);
            } else {
              const enableBtn = document.createElement("button");
              enableBtn.innerHTML = '<i class="fas fa-user-check"></i>';
              enableBtn.classList.add("btn", "action-btn");
              enableBtn.title = "Habilitar Usuario";
              enableBtn.addEventListener("click", () => enableUser(user.id, user.nombre));
              actionsCell.appendChild(enableBtn);
            }
          }
        });
      })
      .catch((error) => {
        console.error("Error loading users:", error);
        displayFlashMessage("Error al cargar usuarios.", "error");
      });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault();
      fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            window.location.href = "/";
          } else {
            displayFlashMessage("Error al cerrar sesión: " + data.message, "error");
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          displayFlashMessage("Error de red al cerrar sesión.", "error");
        });
    });
  }

  function displayFlashMessage(message, type) {
    const flashMessagesDiv = document.getElementById("flash-messages");
    if (!flashMessagesDiv) return;
    flashMessagesDiv.innerHTML = "";
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} fade-in`;
    alertDiv.innerHTML = `
      <div class="alert-content">
        <i class="fas ${type === "success" ? "fa-check-circle" : "fa-times-circle"}"></i>
        <span>${message}</span>
      </div>
      <button class="alert-close">&times;</button>
    `;
    flashMessagesDiv.appendChild(alertDiv);
    alertDiv.querySelector(".alert-close").addEventListener("click", () => {
      alertDiv.classList.remove("fade-in");
      alertDiv.classList.add("fade-out");
      alertDiv.addEventListener("animationend", () => alertDiv.remove());
    });
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.classList.remove("fade-in");
        alertDiv.classList.add("fade-out");
        alertDiv.addEventListener("animationend", () => alertDiv.remove());
      }
    }, 5000);
  }

  closeModalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (userModal) userModal.style.display = "none";
    });
  });

  window.addEventListener("click", (event) => {
    if (userModal && event.target == userModal) {
      userModal.style.display = "none";
    }
  });

  document.querySelector('a[data-page="manage-users"]').addEventListener("click", loadUsers);

  function editUser(userId) {
    fetch(`/api/admin/users/${userId}`)
      .then((response) => response.json())
      .then((user) => {
        if (user.success === false) {
          displayFlashMessage("Error: " + user.message, "error");
          return;
        }
        userModalTitle.textContent = "Editar Usuario";
        userIdInput.value = user.id;
        editUserNameInput.value = user.nombre;
        editUserApellidoInput.value = user.apellido;
        const cedulaParts = user.cedula.split("-");
        if (cedulaParts.length === 2) {
          editUserDocPrefixInput.value = cedulaParts[0];
          editUserDocNumberInput.value = cedulaParts[1];
        }
        editUserCorreoInput.value = user.correo;
        editUserDireccionInput.value = user.direccion || "";
        if (user.telefono) {
          const phoneStr = user.telefono.toString();
          if (phoneStr.length === 11) {
            const prefix = phoneStr.substring(0, 4);
            const number = phoneStr.substring(4);
            editUserTelefonoPrefixInput.value = prefix;
            editUserTelefonoNumberInput.value = number;
          }
        }
        document.getElementById("rol_user_edit").value = user.rol;
        editUserStatusInput.value = user.status;
        if (user.foto) {
          currentFotoPreview.src = user.foto;
          currentFotoPreview.style.display = "block";
        } else {
          currentFotoPreview.src = "";
          currentFotoPreview.style.display = "none";
        }
        userModal.style.display = "block";
      })
      .catch((error) => {
        console.error("Error fetching user for edit:", error);
        displayFlashMessage("Error al cargar datos del usuario para edición.", "error");
      });
  }

  if (userForm) {
    userForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(userForm);
        const userId = userIdInput.value;
        const cedula = `${editUserDocPrefixInput.value}-${editUserDocNumberInput.value.trim()}`;
        const telefono = `${editUserTelefonoPrefixInput.value}${editUserTelefonoNumberInput.value.trim()}`;
        formData.set('cedula', cedula);
        formData.set('telefono', telefono);
        fetch(`/api/admin/users/${userId}`, {
            method: "POST",
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayFlashMessage(data.message, "success");
                userModal.style.display = "none";
                loadUsers();
            } else {
                displayFlashMessage("Error: " + data.message, "error");
            }
        })
        .catch(error => {
            console.error("Error updating user:", error);
            displayFlashMessage("Error de red o del servidor al actualizar usuario.", "error");
        });
    });
  }

  function disableUser(userId, userName) {
      if (confirm(`¿Está seguro de que desea deshabilitar al usuario ${userName}?`)) {
          fetch(`/api/admin/users/disable/${userId}`, {
              method: "POST",
              headers: { 'Content-Type': 'application/json' },
          })
          .then(response => response.json())
          .then(data => {
              if (data.success) {
                  displayFlashMessage(data.message, "success");
                  loadUsers();
              } else {
                  displayFlashMessage("Error: " + data.message, "error");
              }
          })
          .catch(error => {
              console.error("Error disabling user:", error);
              displayFlashMessage("Error de red o del servidor al deshabilitar usuario.", "error");
          });
      }
  }

  function enableUser(userId, userName) {
      if (confirm(`¿Está seguro de que desea habilitar al usuario ${userName}?`)) {
          fetch(`/api/admin/users/enable/${userId}`, {
              method: "POST",
              headers: { 'Content-Type': 'application/json' },
          })
          .then(response => response.json())
          .then(data => {
              if (data.success) {
                  displayFlashMessage(data.message, "success");
                  loadUsers();
              } else {
                  displayFlashMessage("Error: " + data.message, "error");
              }
          })
          .catch(error => {
              console.error("Error enabling user:", error);
              displayFlashMessage("Error de red o del servidor al habilitar usuario.", "error");
          });
      }
  }
  
  setInterval(async () => {
    try {
      await fetch("/api/user/heartbeat", { method: "POST" });
    } catch (error) {
      console.error("Heartbeat failed:", error);
    }
  }, 5 * 60 * 1000);
});
