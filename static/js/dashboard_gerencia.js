document.addEventListener("DOMContentLoaded", () => {
  // Load alerts immediately without waiting
  loadAllAlerts()

  // Load other critical data in background
  loadRemainingDataInBackground()

  // Cargar datos del usuario
  loadUserInfo()

  // Configurar navegación del sidebar
  setupSidebarNavigation()

  // Configurar cierre de sesión
  setupLogout()

  // Setup modals (only for viewing, as add/edit buttons are removed)
  setupUserModal()
  setupClientModal()
  setupDriverModal()
  setupTruckModal()
  setupSellerModal()
  setupSupplierModal()
  setupInventoryModal()
  setupConcreteDesignModal()
  setupMaintenanceModal()
  setupDispatchDetailsModal() // Setup modal for dispatch details
  setupSupplierPurchaseOrderModal() // Setup modal for supplier purchase orders

  startHeartbeat() // Start heartbeat for online status
})

// Cargar información del usuario
function loadUserInfo() {
  const userName = document.getElementById("user-name")
  const userPhoto = document.getElementById("user-photo")

  if (window.userInfo && window.userInfo.nombreCompleto) {
    if (userName.textContent === "Cargando...") {
      userName.textContent = window.userInfo.nombreCompleto
    }

    sessionStorage.setItem("userName", window.userInfo.nombreCompleto)
    sessionStorage.setItem("userId", window.userInfo.id)
    sessionStorage.setItem("userRole", window.userInfo.rol)

    if (userPhoto) {
      userPhoto.src = window.userInfo.foto
    }
  } else {
    userName.textContent = sessionStorage.getItem("userName") || "Usuario Gerencia"
  }
}

// Configurar navegación del sidebar
function setupSidebarNavigation() {
  const menuLinks = document.querySelectorAll(".sidebar ul li a:not(#logout-btn)")

  menuLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()

      menuLinks.forEach((item) => item.classList.remove("active"))
      this.classList.add("active")

      const pageId = this.getAttribute("data-page")
      showPage(pageId)

      // Load specific tables when their pages are active
      if (pageId === "alertas") {
        loadAllAlerts()
      } else if (pageId === "gestion-usuarios") {
        loadUsersTable()
      } else if (pageId === "gestion-clientes") {
        loadClientsTable()
      } else if (pageId === "gestion-choferes") {
        loadDriversTable()
      } else if (pageId === "gestion-camiones") {
        loadTrucksTable()
      } else if (pageId === "gestion-vendedores") {
        loadSellersTable()
      } else if (pageId === "gestion-proveedores") {
        loadSuppliersTable()
      } else if (pageId === "ordenes-compra-proveedor") {
        loadSupplierPurchaseOrdersTable()
      } else if (pageId === "mantenimiento") {
        loadMaintenanceTable()
      } else if (pageId === "inventario") {
        loadInventoryTable()
      } else if (pageId === "disenos-concreto") {
        loadConcreteDesignsTable()
      } else if (pageId === "registro-guias-despacho") {
        loadRegistroGuiaDespachoTable()
      }
    })
  })
}

// Mostrar página específica
function showPage(pageId) {
  // Hide all pages
  const pages = document.querySelectorAll(".page")
  pages.forEach((page) => page.classList.remove("active"))

  // Show selected page
  const selectedPage = document.getElementById(pageId)
  if (selectedPage) {
    selectedPage.classList.add("active")

    // Load data for this page if not already loaded
    loadDataForPage(pageId)
  }

  // Update active menu item
  const menuItems = document.querySelectorAll(".menu-item")
  menuItems.forEach((item) => item.classList.remove("active"))

  const activeMenuItem = document.querySelector(`[data-page="${pageId}"]`)
  if (activeMenuItem) {
    activeMenuItem.classList.add("active")
  }
}

// Configurar cierre de sesión
function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn")

  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault()

    fetch("/api/logout", {
      method: "POST",
      credentials: "same-origin",
    })
      .then(() => {
        window.location.href = "/"
      })
      .catch((error) => {
        console.error("Error al cerrar sesión:", error)
        window.location.href = "/"
      })
  })
}

// Function to load all alerts (inventory and expirations)
async function loadAllAlerts(forceRefresh = false) {
  if (loadingStates.alerts && !forceRefresh) return

  // Show cached data immediately if available
  if (dataCache.alerts && !forceRefresh) {
    displayAlerts(dataCache.alerts)
    return
  }

  // Show skeleton loading immediately
  displayAlerts(null)

  loadingStates.alerts = true
  try {
    const response = await fetch("/api/all_alerts")
    const alerts = await response.json()
    if (response.ok) {
      dataCache.alerts = alerts
      dataCache.lastUpdated.alerts = Date.now()
      displayAlerts(alerts)
    } else {
      console.error("Error loading alerts:", alerts.message)
      displayAlerts([])
    }
  } catch (error) {
    console.error("Fetch error for alerts:", error)
    displayAlerts([])
  } finally {
    loadingStates.alerts = false
  }
}

// Function to display alerts in the HTML
function displayAlerts(alerts) {
  const alertsContainer = document.getElementById("alertsContent")

  // Show skeleton loading if no alerts provided (initial load)
  if (alerts === null || alerts === undefined) {
    alertsContainer.innerHTML = `
      <div class="alerts-skeleton">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    `
    return
  }

  alertsContainer.innerHTML = "" // Clear previous content

  if (alerts.length === 0) {
    alertsContainer.innerHTML = `
      <div class="alerts-empty">
        <i class="fas fa-check-circle"></i>
        <p>No hay alertas activas en este momento</p>
      </div>
    `
    return
  }

  const alertsGrid = document.createElement("div")
  alertsGrid.className = "alerts-grid"

  alerts.forEach((alert) => {
    const alertCard = document.createElement("div")

    // Determine alert type and styling
    let alertType = "warning"
    let iconClass = "fas fa-exclamation-triangle"
    let title = "Alerta"

    if (alert.nivel === "critico") {
      alertType = "critical"
      iconClass = "fas fa-exclamation-circle"
    }

    // Set title based on alert type
    if (alert.tipo === "inventario_critico" || alert.tipo === "inventario_advertencia") {
      title = "Inventario"
    } else if (alert.tipo === "licencia") {
      title = "Vencimiento de Licencia"
    } else if (alert.tipo === "certificado_medico") {
      title = "Vencimiento de Certificado Médico"
    } else if (alert.tipo === "mantenimiento") {
      title = "Mantenimiento Programado"
    } else if (alert.tipo === "orden_compra_pendiente") {
      title = "Orden de Compra Pendiente"
    }

    // Generate message content
    let message = ""
    let daysInfo = ""

    if (alert.tipo === "inventario_critico" || alert.tipo === "inventario_advertencia") {
      message = alert.mensaje
    } else if (alert.tipo === "licencia") {
      message = `La licencia de ${alert.chofer_nombre} vence el ${alert.fecha_vencimiento}`
      daysInfo = `${alert.dias_restantes} días restantes`
    } else if (alert.tipo === "certificado_medico") {
      message = `El certificado médico de ${alert.chofer_nombre} vence el ${alert.fecha_vencimiento}`
      daysInfo = `${alert.dias_restantes} días restantes`
    } else if (alert.tipo === "mantenimiento") {
      message = alert.mensaje
    } else if (alert.tipo === "orden_compra_pendiente") {
      message = alert.mensaje
    }

    alertCard.className = `alert-card ${alertType}`
    alertCard.innerHTML = `
      <div class="alert-card-header">
        <div class="alert-card-icon">
          <i class="${iconClass}"></i>
        </div>
        <h3 class="alert-card-title">${title}</h3>
      </div>
      <div class="alert-card-content">
        ${message}
      </div>
      <div class="alert-card-meta">
        <span class="alert-card-type">${alert.tipo.replace("_", " ").toUpperCase()}</span>
        ${daysInfo ? `<span class="alert-card-days">${daysInfo}</span>` : ""}
      </div>
    `

    alertsGrid.appendChild(alertCard)
  })

  alertsContainer.appendChild(alertsGrid)
}

// Data cache and loading optimization
const dataCache = {
  alerts: null,
  clients: null,
  drivers: null,
  trucks: null,
  sellers: null,
  dispatches: null,
  purchaseOrders: null,
  maintenance: null,
  inventory: null,
  users: null,
  concreteDesigns: null,
  suppliers: null,
  lastUpdated: {},
}

// Loading states management
const loadingStates = {
  alerts: false,
  clients: false,
  drivers: false,
  trucks: false,
  sellers: false,
  dispatches: false,
  purchaseOrders: false,
  maintenance: false,
  inventory: false,
  users: false,
  concreteDesigns: false,
  suppliers: false,
}

async function loadCriticalDataFirst() {
  // Load most important data first (alerts)
  await loadAllAlerts()

  // Then load data for currently visible section
  const currentPage = document.querySelector(".page.active")?.id
  if (currentPage) {
    await loadDataForPage(currentPage)
  }
}

async function loadDataForPage(pageId) {
  const loadingPromises = []

  switch (pageId) {
    case "alertas":
      if (!dataCache.alerts) loadingPromises.push(loadAllAlerts())
      break
    case "gestion-usuarios":
      if (!dataCache.users) loadingPromises.push(loadUsersTable())
      break
    case "gestion-clientes":
      if (!dataCache.clients) loadingPromises.push(loadClientsTable())
      break
    case "gestion-choferes":
      if (!dataCache.drivers) loadingPromises.push(loadDriversTable())
      break
    case "gestion-camiones":
      if (!dataCache.trucks) loadingPromises.push(loadTrucksTable())
      break
    case "gestion-vendedores":
      if (!dataCache.sellers) loadingPromises.push(loadSellersTable())
      break
    case "registro-guias-despacho":
      if (!dataCache.dispatches) loadingPromises.push(loadRegistroGuiaDespachoTable())
      break
    case "ordenes-compra-proveedor":
      if (!dataCache.purchaseOrders) loadingPromises.push(loadSupplierPurchaseOrdersTable())
      break
    case "mantenimiento":
      if (!dataCache.maintenance) loadingPromises.push(loadMaintenanceTable())
      break
    case "inventario":
      if (!dataCache.inventory) loadingPromises.push(loadInventoryTable())
      break
    case "disenos-concreto":
      if (!dataCache.concreteDesigns) loadingPromises.push(loadConcreteDesignsTable())
      break
    case "gestion-proveedores":
      if (!dataCache.suppliers) loadingPromises.push(loadSuppliersTable())
      break
  }

  if (loadingPromises.length > 0) {
    await Promise.all(loadingPromises)
  }
}

async function loadRemainingDataInBackground() {
  const backgroundTasks = []

  if (!dataCache.clients) backgroundTasks.push(loadClientsTable())
  if (!dataCache.drivers) backgroundTasks.push(loadDriversTable())
  if (!dataCache.trucks) backgroundTasks.push(loadTrucksTable())
  if (!dataCache.sellers) backgroundTasks.push(loadSellersTable())
  if (!dataCache.dispatches) backgroundTasks.push(loadRegistroGuiaDespachoTable())
  if (!dataCache.purchaseOrders) backgroundTasks.push(loadSupplierPurchaseOrdersTable())
  if (!dataCache.maintenance) backgroundTasks.push(loadMaintenanceTable())
  if (!dataCache.inventory) backgroundTasks.push(loadInventoryTable())
  if (!dataCache.users) backgroundTasks.push(loadUsersTable())
  if (!dataCache.concreteDesigns) backgroundTasks.push(loadConcreteDesignsTable())
  if (!dataCache.suppliers) backgroundTasks.push(loadSuppliersTable())

  // Load in small batches to avoid overwhelming the server
  const batchSize = 3
  for (let i = 0; i < backgroundTasks.length; i += batchSize) {
    const batch = backgroundTasks.slice(i, i + batchSize)
    await Promise.all(batch)
    // Small delay between batches
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

async function loadInitialData() {
  try {
    // Step 1: Load critical data immediately
    await loadCriticalDataFirst()

    // Step 2: Load remaining data in background
    setTimeout(() => {
      loadRemainingDataInBackground()
    }, 500) // Small delay to let critical data render first

    console.log("[v0] Critical data loaded, background loading initiated")
  } catch (error) {
    console.error("[v0] Error loading initial data:", error)
  }
}

function loadUsersTable(forceRefresh = false) {
  if (loadingStates.users && !forceRefresh) return Promise.resolve()

  if (dataCache.users && !forceRefresh) {
    renderUsersTable(dataCache.users)
    return Promise.resolve()
  }

  const table = document.getElementById("users-table")
  if (!table) return Promise.resolve()

  loadingStates.users = true
  return fetch("/api/admin/users/list")
    .then((response) => response.json())
    .then((data) => {
      dataCache.users = data
      dataCache.lastUpdated.users = Date.now()
      renderUsersTable(data)
    })
    .catch((error) => console.error("Error al cargar usuarios:", error))
    .finally(() => {
      loadingStates.users = false
    })
}

function renderUsersTable(data) {
  const table = document.getElementById("users-table")
  if (!table) return

  const tbody = table.querySelector("tbody")
  tbody.innerHTML = ""

  data.forEach((user) => {
    const row = document.createElement("tr")
    const statusClass = user.status_online === "Online" ? "status-online" : "status-offline"

    row.innerHTML = `
      <td>${user.nombre}</td>
      <td>${user.apellido}</td>
      <td>${user.correo}</td>
      <td>${user.rol}</td>
      <td><span class="status-badge ${statusClass}">${user.status_online}</span></td>
      <td>${user.last_active_display}</td>
      <td>${user.account_status}</td>
    `
    tbody.appendChild(row)
  })
}

function loadClientsTable(forceRefresh = false) {
  if (loadingStates.clients && !forceRefresh) return Promise.resolve()

  if (dataCache.clients && !forceRefresh) {
    renderClientsTable(dataCache.clients)
    return Promise.resolve()
  }

  const table = document.getElementById("clients-table")
  if (!table) return Promise.resolve()

  loadingStates.clients = true
  return fetch("/api/clientes")
    .then((response) => response.json())
    .then((data) => {
      dataCache.clients = data
      dataCache.lastUpdated.clients = Date.now()
      renderClientsTable(data)
    })
    .catch((error) => console.error("Error al cargar clientes:", error))
    .finally(() => {
      loadingStates.clients = false
    })
}

function renderClientsTable(data) {
  const table = document.getElementById("clients-table")
  if (!table) return

  const tbody = table.querySelector("tbody")
  tbody.innerHTML = ""

  data.forEach((client) => {
    const row = document.createElement("tr")
    row.innerHTML = `
      <td>${client.nombre}</td>
      <td>${client.direccion}</td>
      <td>${client.telefono}</td>
      <td>${client.documento}</td>
      <td>${client.vendedor_nombre || "N/A"}</td>
    `
    tbody.appendChild(row)
  })
}

function refreshDataAfterModification(dataType) {
  switch (dataType) {
    case "users":
      loadUsersTable(true)
      break
    case "clients":
      loadClientsTable(true)
      break
    case "drivers":
      loadDriversTable(true)
      loadAllAlerts(true) // Refresh alerts as driver data affects them
      break
    case "trucks":
      loadTrucksTable(true)
      break
    case "sellers":
      loadSellersTable(true)
      break
    case "dispatches":
      loadRegistroGuiaDespachoTable(true)
      break
    case "purchaseOrders":
      loadSupplierPurchaseOrdersTable(true)
      break
    case "maintenance":
      loadMaintenanceTable(true)
      loadAllAlerts(true) // Refresh alerts as maintenance affects them
      break
    case "inventory":
      loadInventoryTable(true)
      break
    case "concreteDesigns":
      loadConcreteDesignsTable(true)
      break
    case "suppliers":
      loadSuppliersTable(true)
      break
    case "alerts":
      loadAllAlerts(true)
      break
  }
}

// Load Drivers Table (Gerencia: View Only, no actions column)
function loadDriversTable(forceRefresh = false) {
  const table = document.getElementById("drivers-table")
  if (!table) return Promise.resolve()

  const tbody = table.querySelector("tbody")

  fetch("/api/choferes")
    .then((response) => response.json())
    .then((data) => {
      tbody.innerHTML = ""
      data.forEach((driver) => {
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${driver.nombre}</td>
          <td>${driver.cedula}</td>
          <td>${driver.licencia}</td>
          <td>${driver.vencimiento_licencia}</td>
          <td>${driver.certificado_medico || "N/A"}</td>
          <td>${driver.vencimiento_certificado || "N/A"}</td>
        `
        tbody.appendChild(row)
      })
    })
    .catch((error) => console.error("Error al cargar choferes:", error))
}

// Load Trucks Table (Gerencia: View Only, no actions column)
function loadTrucksTable(forceRefresh = false) {
  const table = document.getElementById("trucks-table")
  if (!table) return Promise.resolve()

  const tbody = table.querySelector("tbody")

  fetch("/api/camiones")
    .then((response) => response.json())
    .then((data) => {
      tbody.innerHTML = ""
      data.forEach((truck) => {
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${truck.marca}</td>
          <td>${truck.modelo}</td>
          <td>${truck.placa}</td>
          <td>${truck.capacidad}</td>
          <td>${truck.current_odometer}</td>
          <td>${truck.estado}</td>
        `
        tbody.appendChild(row)
      })
    })
    .catch((error) => console.error("Error al cargar camiones:", error))
}

// Load Sellers Table (Gerencia: View Only, no actions column)
function loadSellersTable(forceRefresh = false) {
  const table = document.getElementById("sellers-table")
  if (!table) return Promise.resolve()

  const tbody = table.querySelector("tbody")

  fetch("/api/vendedores")
    .then((response) => response.json())
    .then((data) => {
      tbody.innerHTML = ""
      data.forEach((seller) => {
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${seller.nombre}</td>
          <td>${seller.cedula}</td>
          <td>${seller.direccion}</td>
          <td>${seller.telefono}</td>
        `
        tbody.appendChild(row)
      })
    })
    .catch((error) => console.error("Error al cargar vendedores:", error))
}

// Load Suppliers Table (Gerencia: View Only, no actions column)
function loadSuppliersTable(forceRefresh = false) {
  const table = document.getElementById("suppliers-table")
  if (!table) return Promise.resolve()

  const tbody = table.querySelector("tbody")

  fetch("/api/proveedores")
    .then((response) => response.json())
    .then((data) => {
      tbody.innerHTML = ""
      data.forEach((supplier) => {
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${supplier.nombre}</td>
          <td>${supplier.rif}</td>
          <td>${supplier.direccion}</td>
          <td>${supplier.telefono}</td>
          <td>${supplier.email}</td>
          <td>${supplier.nombre_contacto || "N/A"}</td>
          <td>${supplier.telefono_contacto || "N/A"}</td>
        `
        tbody.appendChild(row)
      })
    })
    .catch((error) => console.error("Error al cargar proveedores:", error))
}

// Load Inventory Table (Gerencia: View Only, no actions column)
function loadInventoryTable(forceRefresh = false) {
  const table = document.getElementById("inventory-table")
  if (!table) return Promise.resolve()

  const tbody = table.querySelector("tbody")

  fetch("/api/inventario")
    .then((response) => response.json())
    .then((data) => {
      tbody.innerHTML = ""
      data.forEach((item) => {
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${item.nombre}</td>
          <td>${item.cantidad}</td>
          <td>${item.unidad}</td>
          <td>${item.densidad || "N/A"}</td>
        `
        tbody.appendChild(row)
      })
    })
    .catch((error) => console.error("Error al cargar inventario:", error))
}

// Load Concrete Designs Table (Gerencia: View Only, no actions column)
function loadConcreteDesignsTable(forceRefresh = false) {
  const table = document.getElementById("concrete-designs-table")
  if (!table) return Promise.resolve()

  const tbody = table.querySelector("tbody")

  fetch("/api/concrete_designs")
    .then((response) => response.json())
    .then((data) => {
      tbody.innerHTML = ""
      data.forEach((design) => {
        const materialsList = design.materiales.map((mat) => `${mat.material_name}: ${mat.quantity_kg} kg`).join(", ")
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${design.nombre}</td>
          <td>${design.resistencia}</td>
          <td>${design.asentamiento}</td>
          <td>${materialsList || "N/A"}</td>
        `
        tbody.appendChild(row)
      })
    })
    .catch((error) => console.error("Error al cargar diseños de concreto:", error))
}

// Load Maintenance Table (Gerencia: View Only, no actions column)
function loadMaintenanceTable(forceRefresh = false) {
  const table = document.getElementById("maintenance-table")
  if (!table) return Promise.resolve()

  const tbody = table.querySelector("tbody")

  fetch("/api/mantenimiento")
    .then((response) => response.json())
    .then((data) => {
      console.log("Maintenance Data:", data)
      tbody.innerHTML = ""
      data.forEach((maint) => {
        const row = document.createElement("tr")
        row.innerHTML = `
          <td>${maint.placa} (${maint.modelo})</td>
          <td>${maint.fecha}</td>
          <td>${maint.tipo_mantenimiento}</td>
          <td>${maint.descripcion}</td>
          <td>${Number.parseFloat(maint.costo).toFixed(2)}</td>
          <td>${maint.kilometraje_actual}</td>
          <td>${maint.proximo_kilometraje_mantenimiento || "N/A"}</td>
          <td>${maint.proxima_fecha_mantenimiento || "N/A"}</td>
        `
        tbody.appendChild(row)
      })
      // setupMaintenanceModalListeners() // Attach listeners after data is loaded
    })
    .catch((error) => console.error("Error al cargar mantenimientos:", error))
}

function loadRegistroGuiaDespachoTable(forceRefresh = false) {
  const table = document.getElementById("despachos-registro-table")
  if (!table) return Promise.resolve()

  const tbody = table.querySelector("tbody")
  const userRole = sessionStorage.getItem("userRole")

  fetch("/api/despachos")
    .then((response) => response.json())
    .then((data) => {
      console.log("Registro de Guías de Despacho Data:", data)
      tbody.innerHTML = ""
      data.forEach((despacho) => {
        const row = document.createElement("tr")
        const disenoDisplay = despacho.diseno_asentamiento
          ? `${despacho.concrete_design_name} (${despacho.diseno_resistencia} kgf/cm², ${despacho.diseno_asentamiento}")`
          : `${despacho.concrete_design_name} (${despacho.diseno_resistencia} kgf/cm²)`

        let actionsHtml = ""
        // For Gerencia role, only show "View" button
        if (userRole === "gerencia") {
          actionsHtml = `
            <button class="btn-sm btn-view view-dispatch-btn" data-id="${
              despacho.id
            }"><i class="fas fa-eye"></i> Ver</button>
          `
        } else {
          // Keep existing logic for other roles if applicable, or remove if only Gerencia uses this dashboard
          actionsHtml = `
            <button class="btn-sm btn-view view-dispatch-btn" data-id="${
              despacho.id
            }"><i class="fas fa-eye"></i> Ver</button>
            ${
              despacho.status === "pending"
                ? `
              <button class="btn-sm btn-success approve-dispatch-btn" data-id="${despacho.id}"><i class="fas fa-check"></i> Aprobar</button>
              <button class="btn-sm btn-danger deny-dispatch-btn" data-id="${despacho.id}"><i class="fas fa-times"></i> Denegar</button>
            `
                : ""
            }
          `
        }

        row.innerHTML = `
          <td>${despacho.fecha}</td>
          <td>${despacho.guia}</td>
          <td>${despacho.m3}</td>
          <td>${disenoDisplay}</td>
          <td>${despacho.cliente_nombre}</td>
          <td>${despacho.chofer_nombre}</td>
          <td>${despacho.camion_placa}</td>
          <td>${despacho.vendedor_nombre || "N/A"}</td>
          <td>${actionsHtml}</td>
        `
        tbody.appendChild(row)
      })
      setupDispatchDetailsModalListeners() // Attach listeners after data is loaded
    })
    .catch((error) => console.error("Error al cargar despachos:", error))
}

// Load Supplier Purchase Orders Table (Gerencia: View and Action)
function loadSupplierPurchaseOrdersTable(forceRefresh = false) {
  const table = document.getElementById("supplier-purchase-orders-table")
  if (!table) return Promise.resolve()

  const tbody = table.querySelector("tbody")
  const userRole = sessionStorage.getItem("userRole")

  fetch("/api/ordenes_compra_proveedor/list")
    .then((response) => response.json())
    .then((data) => {
      console.log("Supplier Purchase Orders Data:", data)
      tbody.innerHTML = ""
      data.forEach((order) => {
        const row = document.createElement("tr")
        let actionsHtml = ""
        let statusSpanish = "";

        if (order.status === "pending") {
          statusSpanish = "Pendiente";
          actionsHtml = `
            <div class="actions-row">
              <button class="action-icon-btn view-btn view-supplier-po-btn" data-id="${order.id}" title="Ver">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-icon-btn approve-btn approve-supplier-po-btn" data-id="${order.id}" title="Aprobar">
                <i class="fas fa-check"></i>
              </button>
              <button class="action-icon-btn deny-btn deny-supplier-po-btn" data-id="${order.id}" title="Denegar">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `
        } else if (order.status === "approved") {
          statusSpanish = "Aprobado";
          actionsHtml = `
            <div class="actions-row">
              <button class="action-icon-btn view-btn view-supplier-po-btn" data-id="${order.id}" title="Ver">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-icon-btn print-btn print-supplier-po-btn" data-id="${order.id}" title="Imprimir">
                <i class="fas fa-print"></i>
              </button>
            </div>
          `
        } else if (order.status === "denied") {
          statusSpanish = "Denegado";
          actionsHtml = `
            <div class="actions-row">
              <button class="action-icon-btn view-btn view-supplier-po-btn" data-id="${order.id}" title="Ver">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          `
        }

        row.innerHTML = `
          <td>${order.po_number}</td>
          <td>${order.fecha}</td>
          <td>${order.proveedor_nombre}</td>
          <td>${Number.parseFloat(order.total).toFixed(2)}</td>
          <td>${statusSpanish}</td>
          <td>${actionsHtml}</td>
        `
        tbody.appendChild(row)
      })
      setupSupplierPurchaseOrderModalListeners() // Attach listeners after data is loaded
      setupSupplierPurchaseOrderActionListeners() // Attach listeners for approve/deny/print buttons in the table
    })
    .catch((error) => console.error("Error al cargar órdenes de compra de proveedor:", error))
}

// Setup listeners for approve/deny/print buttons directly in the table
function setupSupplierPurchaseOrderActionListeners() {
  const table = document.getElementById("supplier-purchase-orders-table")
  if (!table) return

  const userRole = sessionStorage.getItem("userRole")

  table.querySelectorAll(".approve-supplier-po-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const orderId = e.target.getAttribute("data-id")
      try {
        const response = await fetch(`/api/ordenes_compra_proveedor/approve/${orderId}`, { method: "POST" })
        const result = await response.json()
        if (result.success) {
          displayFlashMessage(result.message, "success")
          loadSupplierPurchaseOrdersTable() // Reload table after action
        } else {
          displayFlashMessage(result.message, "error")
        }
      } catch (error) {
        console.error("Error approving PO:", error)
        displayFlashMessage("Error al aprobar la orden de compra.", "error")
      }
    })
  })

  table.querySelectorAll(".deny-supplier-po-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const orderId = e.target.getAttribute("data-id")
      try {
        const response = await fetch(`/api/ordenes_compra_proveedor/deny/${orderId}`, { method: "POST" })
        const result = await response.json()
        if (result.success) {
          displayFlashMessage(result.message, "success")
          loadSupplierPurchaseOrdersTable() // Reload table after action
        } else {
          displayFlashMessage(result.message, "error")
        }
      } catch (error) {
        console.error("Error denying PO:", error)
        displayFlashMessage("Error al denegar la orden de compra.", "error")
      }
    })
  })

  table.querySelectorAll(".print-supplier-po-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const orderId = e.currentTarget.getAttribute("data-id")
      try {
        // Fetch order details to populate modal for printing
        const response = await fetch(`/api/ordenes_compra_proveedor/${orderId}`)
        const order = await response.json()

        if (!order || !order.success === false) {
          displayFlashMessage(order.message || "Error al cargar los detalles de la orden para imprimir.", "error")
          return
        }

        const modal = document.getElementById("supplier-purchase-order-details-modal")
        populateSupplierPODetailsModal(order) // Re-use the existing populate function

        // Temporarily display modal content in a new window/iframe for printing
        const printContent = document.getElementById("modal-supplier-purchase-order-preview-content").innerHTML
        const printWindow = window.open("", "", "height=600,width=800")
        printWindow.document.write("<html><head><title>Imprimir Orden de Compra</title>")
        // Include basic styles for printing
        printWindow.document.write('<link rel="stylesheet" href="/static/css/dashboard.css">') // Include original dashboard styles for basic layout
        printWindow.document.write("<style>")
        printWindow.document.write(`
          body { font-family: 'Poppins', sans-serif; margin: 20px; color: #333; }
          .preview-header img { max-width: 200px; height: auto; }
          .table-container table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .table-container th, .table-container td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .totals-summary { text-align: right; margin-top: 20px; }
          .modal-actions { display: none; } /* Hide buttons in print */
          @media print {
            body { margin: 0; padding: 0; }
            .modal-content { border: none; box-shadow: none; max-width: 100%; width: auto; margin: 0; padding: 0; overflow: visible; }
            .modal { display: block !important; position: static; background: none; padding: 0; }
            .close-supplier-po-details-modal { display: none; }
          }
        `)
        printWindow.document.write("</style></head><body>")
        printWindow.document.write(printContent)
        printWindow.document.write("</body></html>")
        printWindow.document.close()
        printWindow.focus() // Focus the new window

        // Wait for images and styles to load before printing
        printWindow.onload = () => {
          printWindow.print()
          printWindow.close() // Close the print window after printing
        }
      } catch (error) {
        console.error("Error printing PO:", error)
        displayFlashMessage("Error al imprimir la orden de compra.", "error")
      }
    })
  })
}

// Function to setup listeners for maintenance modal
function setupMaintenanceModalListeners() {
  // Placeholder function to be implemented later
}

// --- Modals Setup (Gerencia: View Only) ---
function setupUserModal() {
  const modal = document.getElementById("user-form-modal")
  const closeBtn = modal.querySelector(".close")
  // No modalCloseBtn for this modal, it's for the flash message modal
  closeBtn.onclick = () => (modal.style.display = "none")
  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      modal.style.display = "none"
    }
  })
}

function setupClientModal() {
  const modal = document.getElementById("client-form-modal")
  const closeBtn = modal.querySelector(".close")
  closeBtn.onclick = () => (modal.style.display = "none")
  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      modal.style.display = "none"
    }
  })
}

function setupDriverModal() {
  const modal = document.getElementById("driver-form-modal")
  const closeBtn = modal.querySelector(".close")
  closeBtn.onclick = () => (modal.style.display = "none")
  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      modal.style.display = "none"
    }
  })
}

function setupTruckModal() {
  const modal = document.getElementById("truck-form-modal")
  const closeBtn = modal.querySelector(".close")
  closeBtn.onclick = () => (modal.style.display = "none")
  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      modal.style.display = "none"
    }
  })
}

function setupSellerModal() {
  const modal = document.getElementById("seller-form-modal")
  const closeBtn = modal.querySelector(".close")
  closeBtn.onclick = () => (modal.style.display = "none")
  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      modal.style.display = "none"
    }
  })
}

function setupSupplierModal() {
  const modal = document.getElementById("supplier-form-modal")
  const closeBtn = modal.querySelector(".close")
  closeBtn.onclick = () => (modal.style.display = "none")
  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      modal.style.display = "none"
    }
  })
}

function setupInventoryModal() {
  const modal = document.getElementById("inventory-form-modal")
  const closeBtn = modal.querySelector(".close")
  closeBtn.onclick = () => (modal.style.display = "none")
  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      modal.style.display = "none"
    }
  })
}

function setupConcreteDesignModal() {
  const modal = document.getElementById("concrete-design-form-modal")
  const closeBtn = modal.querySelector(".close")
  closeBtn.onclick = () => (modal.style.display = "none")
  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      modal.style.display = "none"
    }
  })
}

function setupMaintenanceModal() {
  const modal = document.getElementById("maintenance-form-modal")
  const closeBtn = modal.querySelector(".close")
  closeBtn.onclick = () => (modal.style.display = "none")
  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      modal.style.display = "none"
    }
  })
}

// Flash message display
function displayFlashMessage(message, type) {
  const modal = document.getElementById("modal-mensaje")
  const mensajeTexto = document.getElementById("mensaje-texto")
  const modalCloseBtn = document.getElementById("modal-close-btn")

  mensajeTexto.textContent = message
  modal.style.display = "flex" // Show the modal

  // Set background color based on type
  if (type === "success") {
    modal.querySelector(".modal-content").style.backgroundColor = "#d4edda"
    mensajeTexto.style.color = "#155724"
  } else if (type === "error") {
    modal.querySelector(".modal-content").style.backgroundColor = "#f8d7da"
    mensajeTexto.style.color = "#721c24"
  } else if (type === "info") {
    modal.querySelector(".modal-content").style.backgroundColor = "#d1ecf1"
    mensajeTexto.style.color = "#0c5460"
  }

  // Close button for the message modal
  modalCloseBtn.onclick = () => {
    modal.style.display = "none"
  }
  modal.querySelector(".close").onclick = () => {
    modal.style.display = "none"
  }
  window.onclick = (event) => {
    if (event.target == modal) {
      modal.style.display = "none"
    }
  }
}

// Heartbeat function
function startHeartbeat() {
  setInterval(() => {
    fetch("/api/user/heartbeat", {
      method: "POST",
      credentials: "same-origin",
    }).catch((error) => console.error("Heartbeat failed:", error))
  }, 60000) // Every 60 seconds
}

// Setup modal for dispatch details
function setupDispatchDetailsModal() {
  const modal = document.getElementById("dispatch-details-modal")
  const closeBtn = modal.querySelector(".close-dispatch-details-modal") // Use specific close button class
  closeBtn.onclick = () => (modal.style.display = "none")
  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      modal.style.display = "none"
    }
  })
}

// Setup modal for supplier purchase orders
function setupSupplierPurchaseOrderModal() {
  const modal = document.getElementById("supplier-purchase-order-details-modal") // Corrected ID
  const closeBtn = modal.querySelector(".close-supplier-po-details-modal") // Use specific close button class
  closeBtn.onclick = () => (modal.style.display = "none")
  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      modal.style.display = "none"
    }
  })
}

// EN: dashboard_gerencia.js

// **AÑADIR ESTAS FUNCIONES DE AYUDA AL INICIO O FINAL DEL ARCHIVO**
function formatDate(dateString) {
  if (!dateString || dateString.includes('Invalid')) return "Fecha inválida";
  // Asume formato YYYY-MM-DD o similar desde la DB, lo convierte a DD/MM/YYYY
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatCurrency(value) {
  const numericValue = Number(value);
  if (isNaN(numericValue)) {
    return "0.00"; // Devuelve un valor por defecto si no es un número
  }
  return numericValue.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


// REEMPLAZAR LA FUNCIÓN EXISTENTE EN dashboard_gerencia.js con esta
function populateSupplierPODetailsModal(order) {
  // 1. CORRECCIÓN DE FECHA: Usar el valor directamente, sin formatear.
  document.getElementById("modal_supplier_po_number").textContent = order.po_number || "N/A";
  document.getElementById("modal_supplier_po_date").textContent = order.fecha || "N/A"; 
  document.getElementById("modal_supplier_name").textContent = order.proveedor_nombre || "N/A";
  document.getElementById("modal_supplier_rif").textContent = order.proveedor_rif || "N/A";
  document.getElementById("modal_supplier_address").textContent = order.proveedor_direccion || "N/A";
  document.getElementById("modal_supplier_contact").textContent = order.proveedor_nombre_contacto || "N/A";
  document.getElementById("modal_supplier_phone").textContent = order.proveedor_telefono || "N/A";
  
  const totalNumerico = parseFloat(order.total) || 0;
  document.getElementById("modal_supplier_total_to_pay").textContent = totalNumerico.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // 2. CORRECCIÓN "SON:": Llamar a la función convertNumberToWords.
  document.getElementById("modal_supplier_total_words").textContent = convertNumberToWords(totalNumerico);

  const itemsTbody = document.getElementById("modal-supplier-po-items-tbody");
  itemsTbody.innerHTML = "";
  order.items.forEach((item) => {
    const row = document.createElement("tr");
    
    // Nombres de propiedades que ya corregimos en el paso anterior
    const material = item.nombre_material || "N/A";
    const cantidad = parseFloat(item.cantidad) || 0;
    const unidad = item.unidad_medida || "N/A";
    const precioUnitario = parseFloat(item.precio_unitario) || 0;
    const subtotal = parseFloat(item.subtotal_item) || 0;

    row.innerHTML = `
      <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${material}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${cantidad.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${unidad}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${precioUnitario.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    `;
    itemsTbody.appendChild(row);
  });
}

// Setup listeners for dispatch details modal
function setupDispatchDetailsModalListeners() {
  const table = document.getElementById("despachos-registro-table")
  if (!table) return

  table.querySelectorAll(".view-dispatch-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const dispatchId = e.target.getAttribute("data-id")
      fetch(`/api/despachos/${dispatchId}`)
        .then((response) => response.json())
        .then((dispatch) => {
          const modal = document.getElementById("dispatch-details-modal")
          // Populate specific spans instead of overwriting innerHTML
          document.getElementById("modal_dispatch_guia_number").textContent = dispatch.guia || "N/A"
          document.getElementById("modal_dispatch_date").textContent = dispatch.fecha || "N/A"
          document.getElementById("modal_dispatch_client_name").textContent = dispatch.cliente_nombre || "SIN RELLENAR"
          document.getElementById("modal_dispatch_client_address").textContent =
            dispatch.cliente_direccion || "SIN RELLENAR"
          document.getElementById("modal_dispatch_client_phone").textContent =
            dispatch.cliente_telefono || "SIN RELLENAR"
          document.getElementById("modal_dispatch_client_document").textContent =
            dispatch.cliente_documento || "SIN RELLENAR"
          document.getElementById("modal_dispatch_chofer_name").textContent = dispatch.chofer_nombre || "SIN RELLENAR"
          document.getElementById("modal_dispatch_camion_info").textContent =
            `${dispatch.camion_placa || "SIN RELLENAR"} (${dispatch.camion_modelo || "SIN RELLENAR"})`
          document.getElementById("modal_dispatch_m3").textContent = dispatch.m3 || "SIN RELLENAR"
          document.getElementById("modal_dispatch_diseno_name").textContent = dispatch.diseno_nombre || "SIN RELLENAR"
          document.getElementById("modal_dispatch_vendedor_name").textContent = dispatch.vendedor_nombre || "N/A"
          document.getElementById("modal_dispatch_status").textContent = dispatch.status || "Pendiente"
          document.getElementById("modal_dispatch_hora_salida").textContent = dispatch.hora_salida || "N/A"
          document.getElementById("modal_dispatch_hora_llegada").textContent = dispatch.hora_llegada || "N/A"
          document.getElementById("modal_dispatch_received_name").textContent = dispatch.received_by || "SIN RELLENAR"
          // Signature and datetime are not in the current API response, so leave as SIN RELLENAR or hide
          document.getElementById("modal_dispatch_received_signature").textContent = "SIN RELLENAR"
          document.getElementById("modal_dispatch_received_datetime").textContent = "SIN RELLENAR"

          // Hide approve/deny buttons for Gerencia role
          const approveBtn = document.getElementById("modal-dispatch-approve-btn")
          const denyBtn = document.getElementById("modal-dispatch-deny-btn")
          if (approveBtn) approveBtn.style.display = "none"
          if (denyBtn) denyBtn.style.display = "none"

          modal.style.display = "flex"
        })
        .catch((error) => console.error("Error al cargar detalles de despacho:", error))
    })
  })
}

// Setup listeners for supplier purchase order modal
function setupSupplierPurchaseOrderModalListeners() {
  const table = document.getElementById("supplier-purchase-orders-table")
  if (!table) return

  table.querySelectorAll(".view-supplier-po-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const orderId = e.currentTarget.getAttribute("data-id")
      fetch(`/api/ordenes_compra_proveedor/${orderId}`)
        .then((response) => response.json())
        .then((order) => {
          const modal = document.getElementById("supplier-purchase-order-details-modal")
          populateSupplierPODetailsModal(order) // Use the helper function

          const userRole = sessionStorage.getItem("userRole") // Get user role from session
          const approveBtn = document.getElementById("modal-supplier-po-approve-btn")
          const denyBtn = document.getElementById("modal-supplier-po-deny-btn")
          const printBtn = document.getElementById("modal-supplier-po-print-btn")

          // Reset button visibility first
          approveBtn.style.display = "none"
          denyBtn.style.display = "none"
          printBtn.style.display = "none"

          if (order.status === "pending" && (userRole === "gerencia" || userRole === "administrador")) {
            approveBtn.style.display = "inline-block"
            denyBtn.style.display = "inline-block"
            // Add click listeners for approve/deny within the modal
            approveBtn.onclick = async () => {
              try {
                const response = await fetch(`/api/ordenes_compra_proveedor/approve/${order.id}`, { method: "POST" })
                const result = await response.json()
                if (result.success) {
                  displayFlashMessage(result.message, "success")
                  modal.style.display = "none" // Close modal
                  loadSupplierPurchaseOrdersTable() // Reload table
                } else {
                  displayFlashMessage(result.message, "error")
                }
              } catch (error) {
                console.error("Error approving PO:", error)
                displayFlashMessage("Error al aprobar la orden de compra.", "error")
              }
            }
            denyBtn.onclick = async () => {
              try {
                const response = await fetch(`/api/ordenes_compra_proveedor/deny/${order.id}`, { method: "POST" })
                const result = await response.json()
                if (result.success) {
                  displayFlashMessage(result.message, "success")
                  modal.style.display = "none" // Close modal
                  loadSupplierPurchaseOrdersTable() // Reload table
                } else {
                  displayFlashMessage(result.message, "error")
                }
              } catch (error) {
                console.error("Error denying PO:", error)
                displayFlashMessage("Error al denegar la orden de compra.", "error")
              }
            }
          } else if (order.status === "approved" && (userRole === "gerencia" || userRole === "administrador")) {
            printBtn.style.display = "inline-block"
            printBtn.onclick = () => {
              // Print function for the modal content
              const printContent = document.getElementById("modal-supplier-purchase-order-preview-content").innerHTML
              const originalBody = document.body.innerHTML
              document.body.innerHTML = printContent
              window.print()
              document.body.innerHTML = originalBody
              location.reload() // Reload to restore original state
            }
          }

          modal.style.display = "flex"
        })
        .catch((error) => console.error("Error al cargar detalles de orden de compra de proveedor:", error))
    })
  })
}

function convertNumberToWords(num) {
  const units = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const teens = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
  const tens = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const hundreds = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

  function convertGroup(n) {
    let s = "";
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    if (h > 0) { s += hundreds[h] + " "; }
    if (t === 1) { s += teens[u]; } 
    else if (t > 1) {
      s += tens[t];
      if (u > 0) s += " y " + units[u];
    } else if (u > 0) { s += units[u]; }
    return s.trim();
  }

  if (num === 0) return "cero";
  let integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);
  let words = "";
  if (integerPart >= 1000000) {
    const millions = Math.floor(integerPart / 1000000);
    words += (millions === 1 ? "un millón " : convertGroup(millions) + " millones ");
    integerPart %= 1000000;
  }
  if (integerPart >= 1000) {
    const thousands = Math.floor(integerPart / 1000);
    words += (thousands === 1 ? "mil " : convertGroup(thousands) + " mil ");
    integerPart %= 1000;
  }
  if (integerPart > 0) { words += convertGroup(integerPart); }
  words = words.trim();
  words += ` con ${decimalPart.toString().padStart(2, '0')}/100 BOLÍVARES`;
  return words.toUpperCase();

}

