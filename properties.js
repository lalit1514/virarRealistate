// Properties Display Script
// Fetches and displays properties from Firebase on the public website

// Wait for Firebase to be initialized
document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is initialized
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        loadPublicProperties();
    } else {
        console.log('Firebase not initialized, properties section will use static content');
    }
});

// Load properties from Firestore
async function loadPublicProperties() {
    const propertiesGrid = document.getElementById('propertiesGrid');
    const filterBtns = document.querySelectorAll('.property-filter-btn');

    if (!propertiesGrid) return;

    try {
        const snapshot = await db.collection('properties')
            .orderBy('createdAt', 'desc')
            .limit(6)
            .get();

        const properties = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (properties.length === 0) {
            propertiesGrid.innerHTML = `
                <div class="no-properties" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                    <i class="fas fa-building" style="font-size: 48px; color: #e2e8f0; margin-bottom: 16px;"></i>
                    <h3 style="color: #64748b;">No properties available</h3>
                    <p style="color: #94a3b8;">Check back soon for new listings</p>
                </div>
            `;
            return;
        }

        // Store properties for filtering
        window.allProperties = properties;
        renderPropertyCards(properties);

        // Set up filter buttons
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.dataset.filter;
                let filtered = window.allProperties;

                if (filter !== 'all') {
                    filtered = window.allProperties.filter(p =>
                        p.location.toLowerCase() === filter.toLowerCase() ||
                        p.propertyType.toLowerCase() === filter.toLowerCase()
                    );
                }

                renderPropertyCards(filtered);
            });
        });

    } catch (error) {
        console.error('Error loading properties:', error);
    }
}

// Render property cards
function renderPropertyCards(properties) {
    const propertiesGrid = document.getElementById('propertiesGrid');
    if (!propertiesGrid) return;

    if (properties.length === 0) {
        propertiesGrid.innerHTML = `
            <div class="no-properties" style="grid-column: 1/-1; text-align: center; padding: 40px 20px;">
                <p style="color: #64748b;">No properties found for this filter</p>
            </div>
        `;
        return;
    }

    propertiesGrid.innerHTML = properties.map(property => `
        <div class="property-card" data-aos="fade-up">
            <div class="property-image">
                <img src="${property.images && property.images.length > 0 ? property.images[0] : 'images/placeholder.jpg'}" 
                     alt="${property.title}"
                     onerror="this.src='images/placeholder.jpg'">
                <div class="property-badges">
                    <span class="property-badge location">${property.location || 'Location'}</span>
                    ${property.bhk ? `<span class="property-badge type">${property.bhk}</span>` : ''}
                </div>
                ${property.images && property.images.length > 1 ? `
                    <div class="property-gallery-count">
                        <i class="fas fa-images"></i>
                        ${property.images.length}
                    </div>
                ` : ''}
            </div>
            <div class="property-content">
                <h3 class="property-title">${property.title}</h3>
                ${property.bhkOptions && property.bhkOptions.length > 0 ? `
                    <div class="bhk-price-list" style="margin-bottom: 12px;">
                        ${property.bhkOptions.map(opt => `
                            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                <div>
                                    <span style="color: var(--primary-light); font-weight: 600;">${opt.type}</span>
                                    <span style="font-size: 0.85em; color: var(--text-secondary);"> • ${opt.area || 'N/A'} Carpet</span>
                                </div>
                                <span style="font-weight: 700; color: var(--primary);">₹${opt.price}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p style="color: var(--text-secondary);">Contact for pricing</p>'}
                <div class="property-details">
                    ${property.bhk ? `<span><i class="fas fa-bed"></i> ${property.bhk}</span>` : ''}
                    <span><i class="fas fa-map-marker-alt"></i> ${property.location || 'N/A'}</span>
                </div>
                <button class="btn-view-property" onclick="viewPropertyDetails('${property.id}')">
                    <span>View Details</span>
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Refresh AOS
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

// View property details (opens modal with full details)
window.viewPropertyDetails = function (id) {
    const property = window.allProperties.find(p => p.id === id);
    if (!property) return;

    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'property-detail-modal';
    modal.innerHTML = `
        <div class="property-detail-overlay" onclick="closePropertyModal()"></div>
        <div class="property-detail-content">
            <button class="property-detail-close" onclick="closePropertyModal()">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="property-detail-gallery">
                ${property.images && property.images.length > 0 ? `
                    <div class="gallery-main">
                        <img src="${property.images[0]}" alt="${property.title}" id="mainPropertyImage">
                    </div>
                    ${property.images.length > 1 ? `
                        <div class="gallery-thumbnails">
                            ${property.images.map((img, i) => `
                                <img src="${img}" alt="Image ${i + 1}" 
                                     onclick="changeMainImage('${img}')"
                                     class="${i === 0 ? 'active' : ''}">
                            `).join('')}
                        </div>
                    ` : ''}
                ` : `
                    <div class="gallery-main">
                        <img src="images/placeholder.jpg" alt="No image available">
                    </div>
                `}
            </div>
            
            <div class="property-detail-info">
                <div class="property-detail-badges">
                    <span class="property-badge location">${property.location || 'Location'}</span>
                    ${property.bhk ? `<span class="property-badge type">${property.bhk}</span>` : ''}
                </div>
                
                <h2 class="property-detail-title">${property.title}</h2>
                
                <div class="property-detail-specs">
                    ${property.bhk ? `
                        <div class="spec-item">
                            <i class="fas fa-bed"></i>
                            <span>${property.bhk}</span>
                        </div>
                    ` : ''}
                    <div class="spec-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${property.location || 'N/A'}</span>
                    </div>
                </div>
                
                ${property.bhkOptions && property.bhkOptions.length > 0 ? `
                    <div class="property-bhk-prices" style="margin-bottom: 20px;">
                        <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #1e293b;">Available Options</h4>
                        <div style="display: grid; gap: 8px;">
                            ${property.bhkOptions.map(opt => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px; background: #f8fafc; border-radius: 8px;">
                                    <div>
                                        <span style="font-weight: 600; color: #1e293b;">${opt.type}</span>
                                        <span style="font-size: 13px; color: #64748b; margin-left: 8px;">${opt.area || 'N/A'} Carpet</span>
                                    </div>
                                    <span style="font-weight: 700; color: #f97316; font-size: 18px;">₹${opt.price}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${property.description ? `
                    <div class="property-detail-description">
                        <h4>Description</h4>
                        <p>${property.description}</p>
                    </div>
                ` : ''}
                
                <div class="property-detail-actions">
                    <a href="#contact" class="btn btn-primary" onclick="closePropertyModal()">
                        <i class="fas fa-phone"></i>
                        <span>Contact Us</span>
                    </a>
                    <a href="https://wa.me/919999999999?text=Hi, I'm interested in: ${encodeURIComponent(property.title)}" 
                       class="btn btn-whatsapp" target="_blank">
                        <i class="fab fa-whatsapp"></i>
                        <span>WhatsApp</span>
                    </a>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Add styles if not exists
    if (!document.getElementById('property-modal-styles')) {
        addPropertyModalStyles();
    }

    setTimeout(() => modal.classList.add('active'), 10);
};

// Change main image in modal gallery
window.changeMainImage = function (src) {
    document.getElementById('mainPropertyImage').src = src;
    document.querySelectorAll('.gallery-thumbnails img').forEach(img => {
        img.classList.toggle('active', img.src === src);
    });
};

// Close property modal
window.closePropertyModal = function () {
    const modal = document.querySelector('.property-detail-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
};

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePropertyModal();
    }
});

// Add property modal styles
function addPropertyModalStyles() {
    const style = document.createElement('style');
    style.id = 'property-modal-styles';
    style.textContent = `
        .property-detail-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .property-detail-modal.active {
            opacity: 1;
            visibility: visible;
        }
        
        .property-detail-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
        }
        
        .property-detail-content {
            position: relative;
            background: white;
            border-radius: 16px;
            max-width: 900px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }
        
        .property-detail-modal.active .property-detail-content {
            transform: scale(1);
        }
        
        .property-detail-close {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: white;
            color: #1e293b;
            cursor: pointer;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
        }
        
        .property-detail-close:hover {
            background: #ef4444;
            color: white;
        }
        
        .property-detail-gallery {
            background: #f1f5f9;
        }
        
        .gallery-main {
            aspect-ratio: 4/3;
            overflow: hidden;
        }
        
        .gallery-main img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .gallery-thumbnails {
            display: flex;
            gap: 8px;
            padding: 12px;
            overflow-x: auto;
        }
        
        .gallery-thumbnails img {
            width: 60px;
            height: 45px;
            object-fit: cover;
            border-radius: 6px;
            cursor: pointer;
            opacity: 0.6;
            transition: all 0.3s ease;
        }
        
        .gallery-thumbnails img:hover,
        .gallery-thumbnails img.active {
            opacity: 1;
            box-shadow: 0 0 0 2px #f97316;
        }
        
        .property-detail-info {
            padding: 32px;
        }
        
        .property-detail-badges {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
        }
        
        .property-detail-title {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 8px;
        }
        
        .property-detail-price {
            font-size: 28px;
            font-weight: 700;
            color: #f97316;
            margin-bottom: 20px;
        }
        
        .property-detail-specs {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            padding: 16px 0;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
            margin-bottom: 20px;
        }
        
        .spec-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #64748b;
        }
        
        .spec-item i {
            color: #f97316;
        }
        
        .property-detail-description h4 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #1e293b;
        }
        
        .property-detail-description p {
            color: #64748b;
            line-height: 1.6;
        }
        
        .property-detail-actions {
            display: flex;
            gap: 12px;
            margin-top: 24px;
        }
        
        .property-detail-actions .btn {
            flex: 1;
            padding: 14px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        
        .btn-whatsapp {
            background: #25d366;
            color: white;
        }
        
        .btn-whatsapp:hover {
            background: #128c7e;
        }
        
        @media (max-width: 768px) {
            .property-detail-content {
                grid-template-columns: 1fr;
            }
            
            .property-detail-info {
                padding: 24px;
            }
            
            .property-detail-actions {
                flex-direction: column;
            }
        }
    `;
    document.head.appendChild(style);
}
