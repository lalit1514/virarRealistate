// Admin Dashboard Script

// DOM Elements
const mobileToggle = document.getElementById('mobileToggle');
const sidebar = document.getElementById('sidebar');
const logoutBtn = document.getElementById('logoutBtn');
const addPropertyBtn = document.getElementById('addPropertyBtn');
const propertyModal = document.getElementById('propertyModal');
const deleteModal = document.getElementById('deleteModal');
const closeModal = document.getElementById('closeModal');
const closeDeleteModal = document.getElementById('closeDeleteModal');
const cancelBtn = document.getElementById('cancelBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const propertyForm = document.getElementById('propertyForm');
const imageUploadArea = document.getElementById('imageUploadArea');
const imageInput = document.getElementById('imageInput');
const imagePreviews = document.getElementById('imagePreviews');
const searchInput = document.getElementById('searchInput');
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');

// State
let properties = [];
let selectedImages = [];
let existingImageUrls = [];
let isEditing = false;
let currentPropertyId = null;

// Check authentication
auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        loadProperties();
    }
});

// Mobile sidebar toggle
mobileToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        showToast('Error logging out', 'error');
    }
});

// Show/Hide Loading
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Toast Notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <div class="toast-content">
            <div class="toast-title">${type === 'success' ? 'Success' : 'Error'}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Load Properties from Firestore
async function loadProperties() {
    showLoading();
    try {
        const snapshot = await db.collection('properties')
            .orderBy('createdAt', 'desc')
            .get();

        properties = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        updateStats();
        renderProperties();
    } catch (error) {
        console.error('Error loading properties:', error);
        showToast('Error loading properties', 'error');
    }
    hideLoading();
}

// Update Stats
function updateStats() {
    document.getElementById('totalProperties').textContent = properties.length;
    document.getElementById('virarCount').textContent = properties.filter(p => p.location === 'Virar').length;
    document.getElementById('saphaleCount').textContent = properties.filter(p => p.location === 'Saphale').length;
}

// Render Properties Table
function renderProperties(filteredProperties = properties) {
    const container = document.getElementById('propertiesContainer');

    if (filteredProperties.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-building"></i>
                <h3>No Properties Found</h3>
                <p>Add your first property to get started</p>
                <button class="btn-primary" onclick="openAddModal()">
                    <i class="fas fa-plus"></i>
                    <span>Add Property</span>
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <table class="properties-table">
            <thead>
                <tr>
                    <th>Property</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredProperties.map(property => `
                    <tr>
                        <td>
                            <div class="property-info">
                                <img src="${property.images && property.images.length > 0 ? property.images[0] : '../images/placeholder.jpg'}" 
                                     alt="${property.title}" 
                                     class="property-thumb"
                                     onerror="this.src='../images/placeholder.jpg'">
                                <div>
                                    <div class="property-title">${property.title}</div>
                                    <div class="property-location">${property.bhk || ''} ${property.area ? `• ${property.area} Carpet` : ''}</div>
                                    ${property.bhkOptions && property.bhkOptions.length > 0 ? `<div class="property-location" style="font-size: 11px; color: #f97316;">${property.bhkOptions.map(o => `${o.type}: ₹${o.price}`).join(' | ')}</div>` : ''}
                                </div>
                            </div>
                        </td>
                        <td><span class="badge ${property.location.toLowerCase()}">${property.location}</span></td>
                        <td><span class="badge ${property.propertyType.toLowerCase()}">${property.propertyType}</span></td>
                        <td><span class="price">₹${property.price}</span></td>
                        <td>
                            <div class="action-btns">
                                <button class="btn-icon edit" onclick="editProperty('${property.id}')" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon delete" onclick="confirmDelete('${property.id}')" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Search Properties
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = properties.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query) ||
        p.propertyType.toLowerCase().includes(query)
    );
    renderProperties(filtered);
});

// BHK Checkbox Toggle - Enable/Disable price fields
document.querySelectorAll('.bhk-checkbox input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
        const priceInput = this.closest('.bhk-option').querySelector('.bhk-price');
        priceInput.disabled = !this.checked;
        if (!this.checked) {
            priceInput.value = '';
        }
    });
});

// Open Add Modal
function openAddModal() {
    isEditing = false;
    currentPropertyId = null;
    document.getElementById('modalTitle').textContent = 'Add New Property';
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i><span>Save Property</span>';
    propertyForm.reset();
    selectedImages = [];
    existingImageUrls = [];
    imagePreviews.innerHTML = '';

    // Reset BHK checkboxes and price fields
    document.querySelectorAll('.bhk-checkbox input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    document.querySelectorAll('.bhk-price').forEach(input => {
        input.value = '';
        input.disabled = true;
    });

    propertyModal.classList.add('active');
}

addPropertyBtn.addEventListener('click', openAddModal);

// Edit Property
window.editProperty = async function (id) {
    isEditing = true;
    currentPropertyId = id;
    const property = properties.find(p => p.id === id);

    if (!property) return;

    document.getElementById('modalTitle').textContent = 'Edit Property';
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i><span>Update Property</span>';

    // Fill form
    document.getElementById('propertyId').value = id;
    document.getElementById('title').value = property.title || '';
    document.getElementById('price').value = property.price || '';
    document.getElementById('location').value = property.location || '';
    document.getElementById('propertyType').value = property.propertyType || '';
    document.getElementById('area').value = property.area || '';
    document.getElementById('description').value = property.description || '';

    // Handle BHK options
    document.querySelectorAll('.bhk-checkbox input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    document.querySelectorAll('.bhk-price').forEach(input => {
        input.value = '';
        input.disabled = true;
    });

    // Load saved BHK options
    if (property.bhkOptions && Array.isArray(property.bhkOptions)) {
        property.bhkOptions.forEach(opt => {
            if (opt.type === '1 BHK') {
                document.getElementById('bhk1').checked = true;
                document.getElementById('price1bhk').value = opt.price || '';
                document.getElementById('price1bhk').disabled = false;
            } else if (opt.type === '2 BHK') {
                document.getElementById('bhk2').checked = true;
                document.getElementById('price2bhk').value = opt.price || '';
                document.getElementById('price2bhk').disabled = false;
            } else if (opt.type === '3 BHK') {
                document.getElementById('bhk3').checked = true;
                document.getElementById('price3bhk').value = opt.price || '';
                document.getElementById('price3bhk').disabled = false;
            }
        });
    }

    // Handle existing images
    selectedImages = [];
    existingImageUrls = property.images || [];
    renderImagePreviews();

    propertyModal.classList.add('active')
};

// Render Image Previews
function renderImagePreviews() {
    imagePreviews.innerHTML = '';

    // Existing images from Firebase
    existingImageUrls.forEach((url, index) => {
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        div.innerHTML = `
            <img src="${url}" alt="Property image">
            <button type="button" class="remove-image" onclick="removeExistingImage(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        imagePreviews.appendChild(div);
    });

    // New images to upload
    selectedImages.forEach((file, index) => {
        const div = document.createElement('div');
        div.className = 'image-preview-item';
        const reader = new FileReader();
        reader.onload = (e) => {
            div.innerHTML = `
                <img src="${e.target.result}" alt="New image">
                <button type="button" class="remove-image" onclick="removeNewImage(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
        };
        reader.readAsDataURL(file);
        imagePreviews.appendChild(div);
    });
}

// Remove existing image
window.removeExistingImage = function (index) {
    existingImageUrls.splice(index, 1);
    renderImagePreviews();
};

// Remove new image
window.removeNewImage = function (index) {
    selectedImages.splice(index, 1);
    renderImagePreviews();
};

// Image Upload Area
imageUploadArea.addEventListener('click', () => imageInput.click());

imageUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageUploadArea.style.borderColor = '#f97316';
});

imageUploadArea.addEventListener('dragleave', () => {
    imageUploadArea.style.borderColor = '';
});

imageUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    imageUploadArea.style.borderColor = '';
    handleImageFiles(e.dataTransfer.files);
});

imageInput.addEventListener('change', (e) => {
    handleImageFiles(e.target.files);
});

function handleImageFiles(files) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (let file of files) {
        if (!validTypes.includes(file.type)) {
            showToast('Invalid file type. Use JPG, PNG, or WEBP', 'error');
            continue;
        }
        if (file.size > maxSize) {
            showToast('File too large. Max 5MB allowed', 'error');
            continue;
        }
        selectedImages.push(file);
    }
    renderImagePreviews();
}

// Upload Image to Firebase Storage
async function uploadImage(file) {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = storage.ref(`properties/${fileName}`);

    await storageRef.put(file);
    return await storageRef.getDownloadURL();
}

// Form Submit
propertyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();

    try {
        // Upload new images
        const newImageUrls = [];
        for (let file of selectedImages) {
            const url = await uploadImage(file);
            newImageUrls.push(url);
        }

        // Combine existing and new images
        const allImages = [...existingImageUrls, ...newImageUrls];

        // Collect BHK options
        const bhkOptions = [];
        if (document.getElementById('bhk1').checked) {
            bhkOptions.push({ type: '1 BHK', price: document.getElementById('price1bhk').value });
        }
        if (document.getElementById('bhk2').checked) {
            bhkOptions.push({ type: '2 BHK', price: document.getElementById('price2bhk').value });
        }
        if (document.getElementById('bhk3').checked) {
            bhkOptions.push({ type: '3 BHK', price: document.getElementById('price3bhk').value });
        }

        // Create display string for BHK
        const bhkDisplay = bhkOptions.map(o => o.type).join(', ');

        const propertyData = {
            title: document.getElementById('title').value,
            price: document.getElementById('price').value,
            location: document.getElementById('location').value,
            propertyType: document.getElementById('propertyType').value,
            bhk: bhkDisplay,
            bhkOptions: bhkOptions,
            area: document.getElementById('area').value,
            description: document.getElementById('description').value,
            images: allImages,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (isEditing && currentPropertyId) {
            // Update existing property
            await db.collection('properties').doc(currentPropertyId).update(propertyData);
            showToast('Property updated successfully');
        } else {
            // Add new property
            propertyData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('properties').add(propertyData);
            showToast('Property added successfully');
        }

        closeModalHandler();
        loadProperties();
    } catch (error) {
        console.error('Error saving property:', error);
        showToast('Error saving property', 'error');
    }
    hideLoading();
});

// Close Modal
function closeModalHandler() {
    propertyModal.classList.remove('active');
    propertyForm.reset();
    selectedImages = [];
    existingImageUrls = [];
    imagePreviews.innerHTML = '';
}

closeModal.addEventListener('click', closeModalHandler);
cancelBtn.addEventListener('click', closeModalHandler);

// Close modal on overlay click
propertyModal.addEventListener('click', (e) => {
    if (e.target === propertyModal) {
        closeModalHandler();
    }
});

// Delete Property
window.confirmDelete = function (id) {
    document.getElementById('deletePropertyId').value = id;
    deleteModal.classList.add('active');
};

closeDeleteModal.addEventListener('click', () => {
    deleteModal.classList.remove('active');
});

cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.classList.remove('active');
});

deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        deleteModal.classList.remove('active');
    }
});

confirmDeleteBtn.addEventListener('click', async () => {
    const id = document.getElementById('deletePropertyId').value;
    showLoading();

    try {
        // Get property to delete its images
        const property = properties.find(p => p.id === id);

        // Delete images from storage
        if (property && property.images) {
            for (let url of property.images) {
                try {
                    const imageRef = storage.refFromURL(url);
                    await imageRef.delete();
                } catch (err) {
                    console.log('Could not delete image:', err);
                }
            }
        }

        // Delete property document
        await db.collection('properties').doc(id).delete();

        deleteModal.classList.remove('active');
        showToast('Property deleted successfully');
        loadProperties();
    } catch (error) {
        console.error('Error deleting property:', error);
        showToast('Error deleting property', 'error');
    }
    hideLoading();
});

// Make openAddModal available globally
window.openAddModal = openAddModal;
