import FriendsFilterTemplate from './FriendsFilter.hbs';
import './FriendsFilter.css';

/**
 * Компонент фильтра друзей
 * @param {Object} context - Контекст для фильтра
 * @param {Function} context.onFilterChange - Колбэк при изменении фильтров
 * @param {Object} context.initialFilters - Начальные значения фильтров
 * @returns {HTMLElement} - DOM элемент фильтра
 */
export function renderFriendsFilter(context = {}) {
    const { onFilterChange, initialFilters = {} } = context;
    
    const filterElement = document.createElement('div');
    filterElement.innerHTML = FriendsFilterTemplate();
    
    const filterBlock = filterElement.firstElementChild;
    
    initFilterEvents(filterBlock, onFilterChange, initialFilters);
    
    return filterBlock;
}


function initFilterEvents(filterBlock, onFilterChange, initialFilters) {
    const ageInputs = filterBlock.querySelectorAll('.age-input');
    const genderRadios = filterBlock.querySelectorAll('input[name="gender"]');
    
    restoreFilterValues(filterBlock, initialFilters);
    
    ageInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            e.stopPropagation();
            const ageInputs = filterBlock.querySelectorAll('.age-input');
            const minAgeInput = ageInputs[0]; // Первое поле - "От"
            const maxAgeInput = ageInputs[1]; // Второе поле - "До"
            
            const minAge = minAgeInput?.value || '';
            const maxAge = maxAgeInput?.value || '';
            
            if (minAge && maxAge && parseInt(minAge) > parseInt(maxAge)) {
                alert('Минимальный возраст не может быть больше максимального');
                input.value = '';
                return;
            }
            
            if (onFilterChange) {
                onFilterChange({
                    minAge,
                    maxAge,
                    gender: getCurrentGender(filterBlock)
                });
            }
        });
    });
    
    genderRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            e.stopPropagation();
            if (onFilterChange) {
                onFilterChange({
                    minAge: getCurrentMinAge(filterBlock),
                    maxAge: getCurrentMaxAge(filterBlock),
                    gender: radio.value
                });
            }
        });
    });
}

function restoreFilterValues(filterBlock, filters) {
    const ageInputs = filterBlock.querySelectorAll('.age-input');
    const minAgeInput = ageInputs[0];
    const maxAgeInput = ageInputs[1];
    const genderRadio = filterBlock.querySelector(`input[name="gender"][value="${filters.gender || 'any'}"]`);
    
    if (minAgeInput && filters.minAge !== undefined) minAgeInput.value = filters.minAge;
    if (maxAgeInput && filters.maxAge !== undefined) maxAgeInput.value = filters.maxAge;
    if (genderRadio) genderRadio.checked = true;
}


function getCurrentMinAge(filterBlock) {
    const ageInputs = filterBlock.querySelectorAll('.age-input');
    return ageInputs[0]?.value || '';
}


function getCurrentMaxAge(filterBlock) {
    const ageInputs = filterBlock.querySelectorAll('.age-input');
    return ageInputs[1]?.value || '';
}

function getCurrentGender(filterBlock) {
    const selectedRadio = filterBlock.querySelector('input[name="gender"]:checked');
    return selectedRadio?.value || 'any';
}

export function resetFriendsFilter(filterBlock) {
    const ageInputs = filterBlock.querySelectorAll('.age-input');
    const anyGenderRadio = filterBlock.querySelector('input[name="gender"][value="any"]');
    
    ageInputs.forEach(input => input.value = '');
    if (anyGenderRadio) anyGenderRadio.checked = true;
}