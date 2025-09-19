let allSupplierMaterials = {};
document.addEventListener("DOMContentLoaded", () => {
  // Cargar datos del usuario
  loadUserInfo()

  // Configurar navegación del sidebar
  setupSidebarNavigation()

  // Configurar cierre de sesión
  setupLogout()

  // Cargar datos iniciales para despachos
  loadInitialData()

  // Setup forms
  setupPurchaseGuideForm() // Now for supplier purchase orders
  setupAddUserForm()
  setupUserModal() // Setup user modal
  setupPurchaseOrderDetailsModal() // Setup the client purchase order details modal
  startHeartbeat() // Start heartbeat for online status

  // NEW: Load pending material requests table if the alerts page is active
  if (document.getElementById("alerts-material-requests").classList.contains("active")) {
    loadPendingMaterialRequestsTable()
  }
  // Removed initial load for purchase-orders-list as it's no longer the default

  // Initial load for dispatch preview
})

// --- INICIO DE FUNCIONES DE AYUDA (COPIADAS DE dashboard_registro.js) ---

// Helper function to parse various date string formats into a Date object
function parseDateString(dateString) {
  if (!dateString) return null

  // Attempt 1: Try parsing directly. This handles ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
  let date = new Date(dateString)
  if (!isNaN(date.getTime())) {
    return date
  }

  // Attempt 2: Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    date = new Date(dateString + "T00:00:00")
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  // Attempt 3: Try DD/MM/YYYY (Formato que envía el backend)
  const parts = dateString.split("/")
  if (parts.length === 3) {
    const day = Number.parseInt(parts[0], 10)
    const month = Number.parseInt(parts[1], 10) - 1 // El mes es 0-indexado
    const year = Number.parseInt(parts[2], 10)
    date = new Date(year, month, day)
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  // If all attempts fail, return null
  return null
}

// Helper function to format date for display (versión robusta)
function formatDate(dateString) {
  const date = parseDateString(dateString)
  if (!date) return "Invalid Date" // Devuelve "Invalid Date" si no se puede parsear
  return date.toLocaleDateString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit" })
}

// --- FIN DE FUNCIONES DE AYUDA ---

// Cargar información del usuario
function loadUserInfo() {
  const userName = document.getElementById("user-name")
  const userPhoto = document.getElementById("user-photo") // Get the image element

  // Usar los datos del usuario pasados desde el backend
  if (window.userInfo && window.userInfo.nombreCompleto) {
    if (userName.textContent === "Cargando...") {
      userName.textContent = window.userInfo.nombreCompleto
    }

    sessionStorage.setItem("userName", window.userInfo.nombreCompleto)
    sessionStorage.setItem("userId", window.userInfo.id)
    sessionStorage.setItem("userRole", window.userInfo.rol)

    // Set user photo and log the path
    if (userPhoto) {
      userPhoto.src = window.userInfo.foto
      console.log("User photo path:", window.userInfo.foto) // Log the path
    }
  } else {
    userName.textContent = sessionStorage.getItem("userName") || "Usuario Administrador"
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
      if (pageId === "manage-users") {
        loadUsersTable()
      } else if (pageId === "purchase-orders-list") {
        loadPurchaseOrdersTable() // This is for client purchase orders
      } else if (pageId === "material-requests-admin") {
        // NEW
        loadAdminMaterialRequestsTable()
      } else if (pageId === "alerts-material-requests") {
        loadPendingMaterialRequestsTable()
      }
    })
  })
}

// Mostrar página específica
function showPage(pageId) {
  const pages = document.querySelectorAll(".page")

  pages.forEach((page) => {
    page.classList.remove("active")
  })

  const activePage = document.getElementById(pageId)
  if (activePage) {
    activePage.classList.add("active")
    // NEW: If navigating to despachos page, set today's date
    if (pageId === "material-requests-admin") {
      // NEW
      loadAdminMaterialRequestsTable()
    }
    if (pageId === "alerts-material-requests") {
      loadPendingMaterialRequestsTable()
    }
  }

  // Special handling for purchase-guide page visibility (now for supplier POs)
  if (pageId === "purchase-guide") {
    document.getElementById("purchase-guide-form").style.display = "block"
    document.getElementById("purchase-guide-preview").style.display = "block"
    document.getElementById("download-purchase-pdf").style.display = "none"
    document.getElementById("print-purchase-order").style.display = "none" // NEW: Hide print button
    // Reset form and items when navigating to "Generar Guía de Compra"
    const form = document.getElementById("purchase-guide-form")
    const itemsContainer = document.getElementById("po_items_container")
    if (form) form.reset()
    if (itemsContainer) {
      itemsContainer.innerHTML = ""
      addItemRow() // Add one empty row back
    }
    calculateTotals() // Recalculate and clear totals
    updatePreview() // Clear preview content
    loadSuppliersForPurchaseGuide() // NEW: Load suppliers for the form
  }
  if (pageId === "costo-diseno") {
    loadCostoDiseno()
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

// Cargar datos iniciales
function loadInitialData() {
  // loadDespachosTable() // This table is now part of 'registro-guias-despacho'
}

// Setup Purchase Guide Form (now for Supplier Purchase Orders)
function setupPurchaseGuideForm() {
  const form = document.getElementById("purchase-guide-form")
  const previewBox = document.getElementById("purchase-guide-preview")
  const downloadPdfBtn = document.getElementById("download-purchase-pdf")
  const printBtn = document.getElementById("print-purchase-order") // NEW
  const itemsContainer = document.getElementById("po_items_container")
  const addItemBtn = document.getElementById("add-item-btn")
  const supplierSelect = document.getElementById("po_supplier_id")
  const orderDateHiddenInput = document.getElementById("po_order_date_hidden")

  if (!form) return

  // Set today's date for the hidden order date input
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  const formattedDate = `${year}-${month}-${day}`
  orderDateHiddenInput.value = formattedDate

  // Ensure preview and download/print buttons are hidden initially
  previewBox.style.display = "none"
  downloadPdfBtn.style.display = "none"
  printBtn.style.display = "none"

  // Function to add a new item row
  function addItemRow(item = {}) {
    const itemRow = document.createElement("div")
    itemRow.classList.add("po-item-row")
    itemRow.innerHTML = `
        <select class="po-item-material-select" style="width: 40%;" required>
            <option value="">Seleccione material</option>
        </select>
        <input type="number" class="po-item-quantity" placeholder="Cantidad" value="${item.quantity || ""}" min="0.01" step="0.01" style="width: 15%;" required>
        <span class="po-item-unit-price-display" style="width: 20%; text-align: right;">P. Unitario: ${formatCurrency(item.unitPrice || 0)}</span>
        <span class="po-item-unit-display" style="width: 10%; text-align: left;">${item.unit || "Unidad"}</span>
        <span class="po-item-total" style="width: 10%; text-align: right;">${formatCurrency(item.itemTotal || 0)}</span>
        <button type="button" class="remove-item-btn" style="background: none; border: none; color: red; cursor: pointer; font-size: 1.2em;">&times;</button>
    `
    itemsContainer.appendChild(itemRow)

    const materialSelect = itemRow.querySelector(".po-item-material-select")
    const selectedSupplierId = supplierSelect.value
    if (selectedSupplierId && allSupplierMaterials[selectedSupplierId]) {
      allSupplierMaterials[selectedSupplierId].forEach((material) => {
        const option = document.createElement("option")
        option.value = material.id
        option.textContent = material.nombre_material
        materialSelect.appendChild(option)
      })
    }

    // Set selected material if provided
    if (item.materialId) {
      materialSelect.value = item.materialId
    }

    // Add event listeners for new row
    materialSelect.addEventListener("change", (e) => {
      const selectedMaterialId = e.target.value
      const selectedSupplierId = supplierSelect.value
      const selectedMaterial = allSupplierMaterials[selectedSupplierId]?.find((m) => m.id == selectedMaterialId)
      if (selectedMaterial) {
        itemRow.querySelector(".po-item-unit-price-display").textContent =
          `P. Unitario: ${formatCurrency(selectedMaterial.precio)}`
        itemRow.querySelector(".po-item-unit-display").textContent = selectedMaterial.unidad_medida
      } else {
        itemRow.querySelector(".po-item-unit-price-display").textContent = "P. Unitario: 0.00"
        itemRow.querySelector(".po-item-unit-display").textContent = "Unidad"
      }
      calculateTotals()
    })
    itemRow.querySelector(".po-item-quantity").addEventListener("input", calculateTotals)
    itemRow.querySelector(".remove-item-btn").addEventListener("click", () => {
      itemRow.remove()
      calculateTotals()
    })

    // Trigger change to set initial price/unit if material is pre-selected
    if (item.materialId) {
      materialSelect.dispatchEvent(new Event("change"))
    }
  }

  // Add initial item row if none exists
  if (itemsContainer.children.length === 0) {
    addItemRow()
  }

  addItemBtn.addEventListener("click", () => addItemRow())

  // Calculate totals (now only total)
  function calculateTotals() {
    let totalToPay = 0

    const itemRows = itemsContainer.querySelectorAll(".po-item-row")
    itemRows.forEach((row) => {
      const materialSelect = row.querySelector(".po-item-material-select")
      const selectedMaterialId = materialSelect.value
      const selectedSupplierId = supplierSelect.value
      const selectedMaterial = allSupplierMaterials[selectedSupplierId]?.find((m) => m.id == selectedMaterialId)

      const quantity = parseNumericInput(row.querySelector(".po-item-quantity").value)
      const unitPrice = selectedMaterial ? selectedMaterial.precio : 0

      const itemTotal = quantity * unitPrice
      row.querySelector(".po-item-total").textContent = formatCurrency(itemTotal)
      totalToPay += itemTotal
    })

    document.getElementById("po_total_to_pay").textContent = formatCurrency(totalToPay)
    document.getElementById("preview_total_to_pay").textContent = formatCurrency(totalToPay)
    document.getElementById("preview_total_words").textContent = convertNumberToWords(totalToPay)

    updatePreview()
  }

  // Add event listeners for inputs
  supplierSelect.addEventListener("change", () => {
    // Clear existing items and re-add one empty row
    itemsContainer.innerHTML = ""
    addItemRow()
    calculateTotals() // Recalculate and update preview
    updateSupplierDetailsInPreview() // Update supplier details
  })
  // Removed orderDateInput.addEventListener("input", updatePreview) as it's now hidden
  itemsContainer.addEventListener("input", calculateTotals) // Listen for input on items container

  // Initial calculation and preview update
  calculateTotals()
  updatePreview()

  form.addEventListener("submit", (e) => {
    e.preventDefault()

    const supplierId = supplierSelect.value
    const orderDate = orderDateHiddenInput.value // Get date from hidden input
    const items = []

    const itemRows = itemsContainer.querySelectorAll(".po-item-row")
    itemRows.forEach((row) => {
      const materialSelect = row.querySelector(".po-item-material-select")
      const quantityInput = row.querySelector(".po-item-quantity")

      const selectedMaterialId = materialSelect.value
      const quantity = parseNumericInput(quantityInput.value)

      const selectedSupplier = allSuppliers.find((s) => s.id == supplierId)
      const selectedMaterial = selectedSupplier?.materiales.find((m) => m.id == selectedMaterialId)

      if (selectedMaterialId && quantity > 0 && selectedMaterial) {
        items.push({
          material_id: selectedMaterialId,
          cantidad: quantity,
          precio_unitario: selectedMaterial.precio,
          subtotal_item: quantity * selectedMaterial.precio,
        })
      }
    })

    if (!supplierId || !orderDate || items.length === 0) {
      displayFlashMessage("Por favor, complete todos los campos y añada al menos un material.", "error")
      return
    }

    const total = items.reduce((sum, item) => sum + item.subtotal_item, 0)

    const purchaseOrderData = {
      proveedor_id: supplierId,
      fecha: orderDate,
      items: items,
      total: total,
      status: "pending", // Default status for new orders
    }

    fetch("/api/ordenes_compra_proveedor", {
      // Changed from "/api/ordenes_compra_proveedor/add"
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(purchaseOrderData),
    })
      .then(async (response) => {
        const responseText = await response.text()
        let data
        try {
          data = JSON.parse(responseText)
        } catch (e) {
          data = { success: response.ok, message: responseText || `Error HTTP: ${response.status}` }
        }
        if (response.ok) return data
        else throw new Error(data.message || `Error HTTP: ${response.status}`)
      })
      .then((data) => {
        displayFlashMessage(data.message, "success")
        form.reset()
        itemsContainer.innerHTML = ""
        addItemRow() // Add one empty row back
        calculateTotals() // Reset totals and preview
        loadPurchaseOrdersTable() // Reload the table to show the new order
      })
      .catch((error) => {
        console.error("Error al guardar la orden de compra:", error)
        displayFlashMessage(`Error al guardar la orden de compra: ${error.message}`, "error")
      })
  })

  function updateSupplierDetailsInPreview() {
    const selectedSupplierId = supplierSelect.value
    const selectedSupplier = allSuppliers.find((s) => s.id == selectedSupplierId)

    if (selectedSupplier) {
      document.getElementById("preview_supplier_name").textContent = selectedSupplier.nombre
      document.getElementById("preview_supplier_rif").textContent = selectedSupplier.rif
      document.getElementById("preview_supplier_address").textContent = selectedSupplier.direccion
      document.getElementById("preview_supplier_contact").textContent = selectedSupplier.nombre_contacto || "N/A"
      document.getElementById("preview_supplier_phone").textContent =
        selectedSupplier.telefono_contacto || selectedSupplier.telefono || "N/A"
    } else {
      document.getElementById("preview_supplier_name").textContent = ""
      document.getElementById("preview_supplier_rif").textContent = ""
      document.getElementById("preview_supplier_address").textContent = ""
      document.getElementById("preview_supplier_contact").textContent = ""
      document.getElementById("preview_supplier_phone").textContent = ""
    }
  }

  function updatePreview() {
    const orderDate = document.getElementById("po_order_date_hidden").value
    document.getElementById("preview_po_date").textContent = formatDate(orderDate)

    updateSupplierDetailsInPreview()

    const itemsTbody = document.getElementById("preview-items-tbody")
    itemsTbody.innerHTML = ""
    const itemsContainer = document.getElementById("po_items_container")
    const itemRows = itemsContainer.querySelectorAll(".po-item-row")
    itemRows.forEach((row) => {
      const materialSelect = row.querySelector(".po-item-material-select")
      const selectedMaterialId = materialSelect.value
      const selectedSupplierId = supplierSelect.value
      const selectedMaterial = allSupplierMaterials[selectedSupplierId]?.find((m) => m.id == selectedMaterialId)

      const materialName = selectedMaterial ? selectedMaterial.nombre_material : ""
      const quantity = parseNumericInput(row.querySelector(".po-item-quantity").value)
      const unitPrice = selectedMaterial ? selectedMaterial.precio : 0
      const unit = selectedMaterial ? selectedMaterial.unidad_medida : ""
      const itemTotal = quantity * unitPrice

      if (materialName && quantity > 0 && unitPrice > 0) {
        const tr = document.createElement("tr")
        tr.innerHTML = `
            <td style="border: 1px solid #ddd; padding: 8px;">${materialName}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${quantity.toLocaleString("es-ES")}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${unit}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(unitPrice)}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(itemTotal)}</td>
        `
      itemsTbody.appendChild(tr)
    }
  })
}

// Function to generate PDF for client purchase orders
function createPurchaseOrderPdf(order, items) {
  // Implement PDF generation logic here
  console.log("Generating PDF for client purchase order:", order, items)
}

// Function to print client purchase order content
function printPurchaseOrderContent(order, items) {
  // Implement print logic here
  console.log("Printing client purchase order:", order, items)
}

// Function to generate PDF for supplier purchase orders
function createSupplierPurchaseOrderPdf(order, items) {
  // Implement PDF generation logic here
  console.log("Generating PDF for supplier purchase order:", order, items)
}

// Function to print supplier purchase order content
function printSupplierPurchaseOrderContent(orderData, itemsData) {
  const poNumber = orderData.po_number
  const date = formatDate(orderData.fecha)
  const supplierName = orderData.proveedor_nombre
  const supplierRif = orderData.proveedor_rif
  const supplierAddress = orderData.proveedor_direccion
  const supplierContact = orderData.proveedor_contacto || "N/A"
  const supplierPhone = orderData.proveedor_telefono || "N/A"

  const totalToPay = formatCurrency(orderData.total)
  const totalWords = convertNumberToWords(orderData.total)

  let itemsHtml = ""
  itemsData.forEach((item) => {
    itemsHtml += `
  <tr>
    <td style="border: 1px solid #ddd; padding: 8px;">${item.nombre_material}</td>
    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.cantidad.toLocaleString("es-ES")}</td>
    <td style="border: 1px solid #ddd; padding: 8px;">${item.unidad_medida}</td>
    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.precio_unitario)}</td>
    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(item.subtotal_item)}</td>
  </tr>
`
  })

  const printableContent = `
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orden de Compra Proveedor ${poNumber}</title>
    <style>
        body { font-family: 'Poppins', sans-serif; margin: 20px; color: #333; }
        .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .company-info img { max-width: 300px; height: auto; margin-bottom: 5px; }
        .company-info p, .address-info p { margin: 0; font-size: 0.8em; }
        h4 { text-align: center; margin-bottom: 10px; }
        .supplier-details p { margin: 0; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.9em; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; color: #000; font-weight: bold; }
        .totals-summary p { margin: 0; font-size: 0.9em; text-align: right; }
        .totals-summary .final-total { font-weight: bold; }
        @media print {
            body { margin: 0; }
            .container { border: none; box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="company-info">
                <img src="/static/uploads/Logo Prealca Sin Fondo.png" alt="Prealca Logo">
                <p>RIF.: J-30913171-0</p>
            </div>
            <div class="address-info">
                <p>Av. 2 parcela E-37, Zona Ind. Sta Cruz</p>
                <p>Estado Aragua</p>
                <p>Telf: 04128936930 / Roberto Quintero</p>
            </div>
        </div>
        <h4>ORDEN DE COMPRA A PROVEEDOR: ${poNumber}</h4>
        <p style="text-align: right; margin-bottom: 20px;">Fecha: ${date}</p>
        
        <div class="supplier-details">
            <p><strong>Proveedor:</strong> ${supplierName}</p>
            <p><strong>RIF:</strong> ${supplierRif}</p>
            <p><strong>Dirección:</strong> ${supplierAddress}</p>
            <p><strong>CONTACTO:</strong> ${supplierContact}</p>
            <p><strong>TELF:</strong> ${supplierPhone}</p>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Material</th>
                    <th style="text-align: right;">Cantidad</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Unidad</th>
                    <th style="text-align: right;">Precio Unitario</th>
                    <th style="text-align: right;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <div class="totals-summary">
            <p class="final-total">TOTAL: ${totalToPay}</p>
        </div>
        <p style="text-align: left; margin-top: 20px; font-size: 0.9em;">Son: ${totalWords}</p>
    </div>
</body>
</html>
`

  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(printableContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.onload = () => {
      printWindow.print()
      // Optional: close window after print dialog is dismissed
      // printWindow.onafterprint = function() { printWindow.close(); };
    }
  } else {
    displayFlashMessage("No se pudo abrir la ventana de impresión. Por favor, permita pop-ups.", "error")
  }
}

// Al inicio del archivo, asegúrate que la variable esté inicializada como un array vacío.
let allSuppliers = [];

// Reemplaza la función loadSuppliersForPurchaseGuide con esta versión mejorada
function loadSuppliersForPurchaseGuide() {
  fetch("/api/proveedores")
    .then((response) => {
        if (!response.ok) { // Revisa si la respuesta no fue exitosa (ej. error 500)
            throw new Error(`Error HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then((data) => {
      // Revisa si la data recibida es realmente un array antes de usarla
      if (!Array.isArray(data)) {
          console.error("Error: La respuesta de /api/proveedores no es un array.", data);
          displayFlashMessage("Error al procesar la lista de proveedores.", "error");
          allSuppliers = []; // Importante: resetea a un array vacío si hay error
          return;
      }
      
      allSuppliers = data;
      const supplierSelect = document.getElementById("po_supplier_id");
      if (supplierSelect) {
        supplierSelect.innerHTML = '<option value="">Seleccione proveedor</option>';
        data.forEach((supplier) => {
          const option = document.createElement("option");
          option.value = supplier.id;
          option.textContent = supplier.nombre;
          supplierSelect.appendChild(option);
          // La lógica de allSupplierMaterials se mantiene
          allSupplierMaterials[supplier.id] = supplier.materiales;
        });
      }
    })
    .catch((error) => {
      console.error("Error al cargar proveedores:", error);
      displayFlashMessage("No se pudieron cargar los proveedores. " + error.message, "error");
      allSuppliers = []; // Importante: Asegura que siga siendo un array en caso de fallo total del fetch
    });
}

// REEMPLAZA LA FUNCIÓN loadPendingMaterialRequestsTable EXISTENTE CON ESTA VERSIÓN

function loadPendingMaterialRequestsTable() {
  const alertsContainer = document.getElementById("admin-alerts-content")
  if (!alertsContainer) return

  // Mostrar esqueleto de carga
  alertsContainer.innerHTML = `
        <div class="alerts-skeleton">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        </div>
    `

  fetch("/api/material_requests/list")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
    .then((data) => {
      alertsContainer.innerHTML = "" // Limpiar esqueleto

      const pendingRequests = data.filter((request) => request.status === "pending")

      if (pendingRequests.length === 0) {
        alertsContainer.innerHTML = `
                    <div class="alerts-empty">
                        <i class="fas fa-check-circle"></i>
                        <p>No hay solicitudes de material pendientes.</p>
                    </div>
                `
        return
      }

      const alertsGrid = document.createElement("div")
      alertsGrid.className = "alerts-grid"

      pendingRequests.forEach((request) => {
        const alertCard = document.createElement("div")
        alertCard.className = "alert-card warning" // Todas las pendientes son 'warning'

        // Construir botones de acción
        const actionsHtml = `
                    <div class="actions-row" style="margin-top: 10px;">
                        <button class="btn-sm btn-success approve-material-request" data-id="${request.id}"><i class="fas fa-check"></i> Aprobar</button>
                        <button class="btn-sm btn-danger deny-material-request" data-id="${request.id}"><i class="fas fa-times"></i> Denegar</button>
                    </div>
                `

        alertCard.innerHTML = `
                    <div class="alert-card-header">
                        <div class="alert-card-icon"><i class="fas fa-box-open"></i></div>
                        <h3 class="alert-card-title">Solicitud Pendiente</h3>
                    </div>
                    <div class="alert-card-content">
                        <strong>${request.requester_full_name}</strong> ha solicitado <strong>${request.quantity_requested} ${request.unit}</strong> de <strong>${request.material_name}</strong>.
                        <br>
                        <em>Razón: ${request.reason || "No especificada"}</em>
                    </div>
                    <div class="alert-card-meta">
                        <span>${formatDate(request.request_date)}</span>
                    </div>
                    ${actionsHtml}
                `
        alertsGrid.appendChild(alertCard)
      })

      alertsContainer.appendChild(alertsGrid)

      // Re-vincular los eventos a los nuevos botones
      setupAdminMaterialRequestActions()
    })
    .catch((error) => {
      console.error("Error al cargar solicitudes de material pendientes:", error)
      alertsContainer.innerHTML = `<p class="error-message">Error al cargar las solicitudes pendientes.</p>`
    })
}

function loadCostoDiseno() {
  const table = document.getElementById("costo-diseno-table")
  if (!table) return

  const tbody = table.querySelector("tbody")

  fetch("/api/costo_diseno")
    .then((response) => response.json())
    .then((data) => {
      tbody.innerHTML = ""
      let totalGeneral = 0

      if (data.success === false) {
        tbody.innerHTML = `<tr><td colspan="6" class="error-message">Error: ${data.message}</td></tr>`
        return
      }

      if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="info-message">No hay diseños registrados.</td></tr>`
        return
      }

      data.forEach((diseno) => {
        const valorTotal = diseno.m3_disponible * diseno.precio_unitario
        totalGeneral += valorTotal

        const row = document.createElement("tr")
        row.innerHTML = `
                    <td>${diseno.id}</td>
                    <td>${diseno.nombre}</td>
                    <td>${diseno.m3_disponible.toFixed(2)}</td>
                    <td>${formatCurrency(diseno.precio_unitario)}</td>
                    <td>${formatCurrency(valorTotal)}</td>
                    <td>
                        <button class="action-btn edit-precio-btn" data-id="${diseno.id}" data-nombre="${diseno.nombre}" data-precio="${diseno.precio_unitario}" title="Editar Precio">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                `
        tbody.appendChild(row)
      })

      // Actualizar total general
      document.getElementById("precio-total-general").textContent = formatCurrency(totalGeneral)

      // Agregar event listeners para botones de editar
      document.querySelectorAll(".edit-precio-btn").forEach((button) => {
        button.addEventListener("click", (e) => {
          const disenoId = e.currentTarget.dataset.id
          const disenoNombre = e.currentTarget.dataset.nombre
          const precioActual = e.currentTarget.dataset.precio
          openEditPrecioModal(disenoId, disenoNombre, precioActual)
        })
      })
    })
    .catch((error) => {
      console.error("Error al cargar costo por diseño:", error)
      tbody.innerHTML = `<tr><td colspan="6" class="error-message">Error al cargar datos</td></tr>`
    })
}

function openEditPrecioModal(disenoId, disenoNombre, precioActual) {
  const modal = document.getElementById("edit-precio-modal")
  const disenoIdInput = document.getElementById("edit_diseno_id")
  const disenoNombreInput = document.getElementById("edit_diseno_nombre")
  const precioUnitarioInput = document.getElementById("edit_precio_unitario")

  disenoIdInput.value = disenoId
  disenoNombreInput.value = disenoNombre
  precioUnitarioInput.value = precioActual

  modal.style.display = "block"
}

function setupEditPrecioModal() {
  const modal = document.getElementById("edit-precio-modal")
  const closeBtn = document.getElementById("close-edit-precio-modal")
  const form = document.getElementById("edit-precio-form")

  if (!modal || !closeBtn || !form) return

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none"
  })

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none"
    }
  })

  form.addEventListener("submit", (e) => {
    e.preventDefault()

    const disenoId = document.getElementById("edit_diseno_id").value
    const precioUnitario = Number.parseFloat(document.getElementById("edit_precio_unitario").value)

    if (!disenoId || isNaN(precioUnitario) || precioUnitario < 0) {
      displayFlashMessage("Por favor ingrese un precio válido.", "error")
      return
    }

    fetch(`/api/costo_diseno/${disenoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        precio_unitario: precioUnitario,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          displayFlashMessage(data.message, "success")
          modal.style.display = "none"
          loadCostoDiseno() // Recargar la tabla
        } else {
          displayFlashMessage(data.message, "error")
        }
      })
      .catch((error) => {
        console.error("Error al actualizar precio:", error)
        displayFlashMessage("Error al actualizar el precio.", "error")
      })
  })
}

function traducirEstado(estado) {
  const traducciones = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    denied: 'Denegado'
  };
  // Devuelve la traducción si existe, o el texto original si no.
  return traducciones[estado.toLowerCase()] || estado;
}
// Modify the existing DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", () => {
  loadUserInfo()
  loadInitialData()
  setupPurchaseGuideForm()
  loadSuppliersForPurchaseGuide()
  loadPurchaseOrdersTable()
  loadUsersTable()
  loadPendingMaterialRequestsTable()
  setupEditPrecioModal()

  // Add event listener for page navigation
  document.querySelectorAll(".sidebar a[data-page]").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const targetPage = this.getAttribute("data-page")
      showPage(targetPage)

      if (targetPage === "costo-diseno") {
        loadCostoDiseno()
      }
    })
  })
})
