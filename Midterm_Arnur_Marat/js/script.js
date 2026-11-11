$(function () {
    const booking = document.querySelector('#booking');
    if (booking) {
        const fields = Array.from(booking.querySelectorAll('input, select'));
        const password = document.querySelector('#password');
        const confirmPassword = document.querySelector('#confirm-password');
        const date = document.querySelector('#date');
        const today = new Date();
        date.min = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
        fields.forEach(function (field) {
            const feedback = document.createElement('span');
            feedback.id = field.id + '-feedback';
            feedback.className = 'feedback';
            feedback.setAttribute('aria-live', 'polite');
            field.insertAdjacentElement('afterend', feedback);
            field.setAttribute('aria-describedby', (field.getAttribute('aria-describedby') || '') + ' ' + feedback.id);
        });
        function strength() {
            const value = password.value;
            const groups = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(function (test) { return test.test(value); }).length;
            return !value ? 0 : value.length < 8 || groups < 2 ? 1 : value.length >= 12 && groups === 4 ? 3 : 2;
        }
        function validate(field) {
            let error = '';
            if (field.required && !field.value.trim()) error = 'This field is required.';
            else if (field.id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) error = 'Enter a valid email address.';
            else if (field.id === 'password' && strength() < 2) error = 'Use 8+ characters and at least two character types.';
            else if (field.id === 'confirm-password' && field.value !== password.value) error = 'Passwords do not match.';
            else if (!field.checkValidity()) error = field.validationMessage;
            else if (field.id === 'date' && field.value < date.min) error = 'Choose today or a future date.';
            const feedback = document.getElementById(field.id + '-feedback');
            feedback.textContent = error || (field.value ? '✓ Looks good' : '');
            feedback.className = 'feedback ' + (error ? 'error' : 'success');
            field.setAttribute('aria-invalid', String(Boolean(error)));
            return !error;
        }
        $(fields).on('input change', function () {
            $('#form-result').text('');
            validate(this);
            if (this === password) {
                const score = strength();
                $('#strength').val(score);
                $('#strength-label').text(['Enter a password', 'Weak', 'Medium', 'Strong'][score]);
                if (confirmPassword.value) validate(confirmPassword);
            }
        });
        $(booking).on('submit', function (event) {
            event.preventDefault();
            const valid = fields.map(validate).every(Boolean);
            $('#form-result').text(valid ? 'Details validated.' : 'Please correct the highlighted fields.').attr('class', valid ? 'success' : 'error');
            if (!valid) booking.querySelector('[aria-invalid="true"]').focus();
        });
    }

    if ($('#service-rows').length) {
        let services = [
            {id:1, name:'Signature haircut', category:'hair', duration:45, price:6000},
            {id:2, name:'Skin fade', category:'hair', duration:50, price:6500},
            {id:3, name:'Beard shape', category:'beard', duration:30, price:3000},
            {id:4, name:'Cut + beard', category:'combo', duration:75, price:8000},
            {id:5, name:'Classic shave', category:'beard', duration:30, price:3500},
            {id:6, name:'Junior cut (under 12)', category:'hair', duration:35, price:4000}
        ];
        try {
            const saved = JSON.parse(localStorage.getItem('line-services'));
            if (Array.isArray(saved) && saved.every(function (s) {
                return s && Number.isFinite(s.id) && typeof s.name === 'string' && ['hair','beard','combo'].includes(s.category) && Number.isFinite(s.duration) && s.duration >= 5 && s.duration <= 240 && Number.isFinite(s.price) && s.price >= 0 && s.price <= 1000000;
            }) && new Set(saved.map(s => s.id)).size === saved.length) services = saved;
        } catch (error) { /* Defaults remain available when storage is blocked. */ }
        let category = 'all';
        let editing = null;
        function render() {
            const query = $('#service-search').val().trim().toLowerCase();
            const visible = services.filter(function (s) {
                return (category === 'all' || s.category === category) && (s.name + ' ' + s.category).toLowerCase().includes(query);
            });
            const body = $('#service-rows').empty();
            visible.forEach(function (s) {
                const row = $('<tr>');
                $('<th scope="row">').text(s.name).appendTo(row);
                $('<td>').text(s.duration + ' min').appendTo(row);
                $('<td>').text(s.price.toLocaleString('en-US') + ' ₸').appendTo(row);
                const actions = $('<td>');
                $('<button type="button" class="btn">').text('Edit').attr({'data-edit':s.id, 'aria-label':'Edit ' + s.name}).appendTo(actions);
                $('<button type="button" class="btn">').text('Delete').attr({'data-delete':s.id, 'aria-label':'Delete ' + s.name}).appendTo(actions);
                row.append(actions).appendTo(body);
            });
            if (!visible.length) body.append($('<tr>').append($('<td colspan="4">').text('No matching services.')));
            $('#service-count').text(visible.length + ' of ' + services.length + ' services');
        }
        function save() {
            let message = 'Menu updated.';
            try { localStorage.setItem('line-services', JSON.stringify(services)); }
            catch (error) { message += ' Storage unavailable; changes last for this page only.'; }
            $('#editor-result').text(message);
            render();
        }
        function resetEditor() {
            editing = null;
            document.querySelector('#service-editor').reset();
            $('#save-service').text('Add service');
            $('#cancel-edit').prop('hidden', true);
        }
        $('#service-search').on('input', render);
        $('[data-category]').on('click', function () {
            category = $(this).attr('data-category');
            $('[data-category]').attr('aria-pressed', 'false');
            $(this).attr('aria-pressed', 'true');
            render();
        });
        $('#service-editor').on('submit', function (event) {
            event.preventDefault();
            const name = $('#item-name').val().trim();
            if (!name) { $('#editor-result').text('Enter a service name.'); return; }
            const item = {id: editing === null ? Math.max(0, ...services.map(s => s.id)) + 1 : editing, name:name, category:$('#item-category').val(), duration:Number($('#item-duration').val()), price:Number($('#item-price').val())};
            if (editing === null) services.push(item);
            else services = services.map(s => s.id === editing ? item : s);
            resetEditor();
            save();
        });
        $('#cancel-edit').on('click', resetEditor);
        $('#service-rows').on('click', '[data-edit]', function () {
            const item = services.find(s => s.id === Number($(this).attr('data-edit')));
            editing = item.id;
            $('#item-name').val(item.name);
            $('#item-category').val(item.category);
            $('#item-duration').val(item.duration);
            $('#item-price').val(item.price);
            $('#save-service').text('Save changes');
            $('#cancel-edit').prop('hidden', false);
            document.querySelector('#item-name').focus();
        }).on('click', '[data-delete]', function () {
            const id = Number($(this).attr('data-delete'));
            if (window.confirm('Delete this service?')) {
                services = services.filter(s => s.id !== id);
                if (editing === id) resetEditor();
                save();
            }
        });
        render();
    }

    const dialog = document.querySelector('#lightbox');
    if (dialog) {
        const photos = Array.from(document.querySelectorAll('.gallery-open img'));
        let current = 0;
        let trigger;
        function show(index) {
            current = (index + photos.length) % photos.length;
            $('#large-photo').stop(true, true).fadeOut(120, function () {
                $(this).attr({src:photos[current].src, alt:photos[current].alt}).fadeIn(180);
                $('#photo-caption').text((current + 1) + ' / ' + photos.length + ' — ' + photos[current].alt);
            });
        }
        $('.gallery-open').on('click', function () {
            trigger = this;
            dialog.showModal();
            show(photos.indexOf(this.querySelector('img')));
        });
        $('#previous-photo').on('click', function () { show(current - 1); });
        $('#next-photo').on('click', function () { show(current + 1); });
        $('#close-lightbox').on('click', function () { dialog.close(); });
        $(dialog).on('keydown', function (event) {
            if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
            if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
        }).on('close', function () { if (trigger) trigger.focus(); });
    }
});
