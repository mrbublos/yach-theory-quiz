class ImageViewer {
    constructor() {
        this.modal = null;
        this.modalContent = null;
        this.scrollContainer = null;
        this.closeButton = null;
        this.scrollIndicators = {};
        this.initialize();
    }

    initialize() {
        this.createModalElements();
        this.setupEventListeners();
        this.setupScrollControls();
    }

    createModalElements() {
        // Create modal container
        this.modal = document.createElement('div');
        this.modal.className = 'modal';

        // Create modal content with Material Design
        this.modalContent = document.createElement('div');
        this.modalContent.className = 'modal-content mdl-card mdl-shadow--8dp';

        // Create header
        const header = document.createElement('div');
        header.className = 'mdl-card__title';
        
        const title = document.createElement('h2');
        title.className = 'mdl-card__title-text';
        title.textContent = 'Image Viewer';
        
        this.closeButton = document.createElement('button');
        this.closeButton.className = 'mdl-button mdl-js-button mdl-button--icon close';
        this.closeButton.innerHTML = '<i class="material-icons">close</i>';

        header.appendChild(title);
        header.appendChild(this.closeButton);

        // Create media container
        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'mdl-card__media';

        // Create scroll container
        this.scrollContainer = document.createElement('div');
        this.scrollContainer.className = 'image-scroll-container';

        // Create scroll indicators
        const indicators = ['left', 'right', 'up', 'down'];
        indicators.forEach(direction => {
            const indicator = document.createElement('div');
            indicator.className = `scroll-indicator scroll-${direction}`;
            indicator.innerHTML = `<i class="material-icons">keyboard_arrow_${direction}</i>`;
            this.scrollIndicators[direction] = indicator;
            mediaContainer.appendChild(indicator);
        });

        // Create swipe hints
        const swipeHints = ['horizontal', 'vertical'];
        swipeHints.forEach(direction => {
            const hint = document.createElement('div');
            hint.className = `swipe-hint swipe-${direction}`;
            mediaContainer.appendChild(hint);
        });

        // Assemble modal structure
        mediaContainer.appendChild(this.scrollContainer);
        this.modalContent.appendChild(header);
        this.modalContent.appendChild(mediaContainer);
        this.modal.appendChild(this.modalContent);
        document.body.appendChild(this.modal);
    }

    setupEventListeners() {
        // Close modal handlers
        this.closeButton.addEventListener('click', () => this.hideModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hideModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) this.hideModal();
        });

        // Touch event handlers
        let touchStartX = 0;
        let touchStartY = 0;

        this.scrollContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        this.scrollContainer.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].screenX;
            const touchEndY = e.changedTouches[0].screenY;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;
            const scrollAmount = 100;

            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Horizontal swipe
                this.scrollContainer.scrollBy({
                    left: diffX > 50 ? scrollAmount : diffX < -50 ? -scrollAmount : 0,
                    behavior: 'smooth'
                });
            } else {
                // Vertical swipe
                this.scrollContainer.scrollBy({
                    top: diffY > 50 ? scrollAmount : diffY < -50 ? -scrollAmount : 0,
                    behavior: 'smooth'
                });
            }
        }, { passive: true });
    }

    setupScrollControls() {
        const scrollAmount = 100;

        // Scroll indicator click handlers
        Object.entries(this.scrollIndicators).forEach(([direction, indicator]) => {
            indicator.addEventListener('click', () => {
                const scroll = {
                    left: { left: -scrollAmount },
                    right: { left: scrollAmount },
                    up: { top: -scrollAmount },
                    down: { top: scrollAmount }
                }[direction];

                this.scrollContainer.scrollBy({
                    ...scroll,
                    behavior: 'smooth'
                });
            });
        });

        // Update scroll indicators visibility
        this.scrollContainer.addEventListener('scroll', () => {
            const {
                scrollLeft,
                scrollTop,
                scrollWidth,
                scrollHeight,
                clientWidth,
                clientHeight
            } = this.scrollContainer;

            this.scrollIndicators.left.style.opacity = scrollLeft > 0 ? '0.7' : '0.3';
            this.scrollIndicators.right.style.opacity = scrollLeft < (scrollWidth - clientWidth) ? '0.7' : '0.3';
            this.scrollIndicators.up.style.opacity = scrollTop > 0 ? '0.7' : '0.3';
            this.scrollIndicators.down.style.opacity = scrollTop < (scrollHeight - clientHeight) ? '0.7' : '0.3';
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isVisible()) return;

            const keyScrolls = {
                ArrowLeft: { left: -scrollAmount },
                ArrowRight: { left: scrollAmount },
                ArrowUp: { top: -scrollAmount },
                ArrowDown: { top: scrollAmount }
            };

            if (keyScrolls[e.key]) {
                e.preventDefault();
                this.scrollContainer.scrollBy({
                    ...keyScrolls[e.key],
                    behavior: 'smooth'
                });
            }
        });
    }

    showModal(imageUrl) {
        // Clear existing content
        this.scrollContainer.innerHTML = '';

        // Create and add image
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'full-image';
        img.alt = 'Full size image';
        this.scrollContainer.appendChild(img);

        // Show modal
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Reset scroll position
        this.scrollContainer.scrollTop = 0;
        this.scrollContainer.scrollLeft = 0;
    }

    hideModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    isVisible() {
        return this.modal.style.display === 'block';
    }
}

// Export for use in other files
export default ImageViewer;