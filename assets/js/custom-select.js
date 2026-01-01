/* Custom Select Dropdown Component */
class CustomSelect {
    constructor(selectElement) {
        this.selectElement = selectElement;
        this.options = Array.from(selectElement.options);
        this.wrapper = null;
        this.isOpen = false;

        this.init();
    }

    init() {
        // Fully hide original select (not just display:none for accessibility)
        this.selectElement.style.cssText = 'position: absolute; opacity: 0; pointer-events: none; height: 0; overflow: hidden;';

        // Create custom select structure
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'custom-select-wrapper';

        const customSelect = document.createElement('div');
        customSelect.className = 'custom-select';

        // Trigger button
        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';

        const selectedOption = this.options.find(opt => opt.selected && opt.value);
        const placeholderOption = this.options.find(opt => opt.disabled && opt.selected);

        if (selectedOption && selectedOption.value) {
            trigger.innerHTML = `<span>${selectedOption.textContent}</span>`;
        } else if (placeholderOption) {
            trigger.innerHTML = `<span class="placeholder">${placeholderOption.textContent}</span>`;
        } else {
            trigger.innerHTML = `<span class="placeholder">Select an option</span>`;
        }

        // Options container
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'custom-options';

        this.options.forEach((option, index) => {
            if (option.disabled && index === 0) return; // Skip placeholder

            const customOption = document.createElement('div');
            customOption.className = 'custom-option';
            if (option.selected && option.value) {
                customOption.classList.add('selected');
            }
            customOption.dataset.value = option.value;
            customOption.textContent = option.textContent;

            customOption.addEventListener('click', () => {
                this.selectOption(customOption, option);
            });

            optionsContainer.appendChild(customOption);
        });

        customSelect.appendChild(trigger);
        customSelect.appendChild(optionsContainer);
        this.wrapper.appendChild(customSelect);

        // Insert after select element
        this.selectElement.parentNode.insertBefore(this.wrapper, this.selectElement.nextSibling);

        // Store references
        this.trigger = trigger;
        this.optionsContainer = optionsContainer;
        this.customSelect = customSelect;

        // Event listeners
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        document.addEventListener('click', (e) => {
            if (!this.wrapper.contains(e.target)) {
                this.close();
            }
        });
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        this.customSelect.classList.add('open');
    }

    close() {
        this.isOpen = false;
        this.customSelect.classList.remove('open');
    }

    selectOption(customOption, nativeOption) {
        // Update native select
        this.selectElement.value = nativeOption.value;
        this.selectElement.dispatchEvent(new Event('change', { bubbles: true }));

        // Update trigger text
        this.trigger.innerHTML = `<span>${nativeOption.textContent}</span>`;

        // Update selected state
        this.optionsContainer.querySelectorAll('.custom-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        customOption.classList.add('selected');

        this.close();
    }
}

// Initialize all selects
function initCustomSelects() {
    document.querySelectorAll('.form-group select').forEach(select => {
        new CustomSelect(select);
    });
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomSelects);
} else {
    initCustomSelects();
}
