const API_URL = 'http://localhost:7071/api/todoCrud';

const todoForm = document.getElementById('todoForm');
const newTextInput = document.getElementById('newText');
const newDeadlineInput = document.getElementById('newDeadline');
const todoList = document.getElementById('todoList');
const errorBox = document.getElementById('errorBox');
const statusBox = document.getElementById('status');

let todos = [];

function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
}

function clearError() {
    errorBox.textContent = '';
    errorBox.style.display = 'none';
}

function setStatus(message) {
    statusBox.textContent = message;
}

function toDatetimeLocalValue(value) {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
}

function formatDeadline(value) {
    if (!value) return 'Keine Deadline';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Ungültiges Datum';

    return date.toLocaleString('de-DE');
}

async function fetchTodos() {
    clearError();
    setStatus('Lade Todos ...');

    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`GET fehlgeschlagen: ${response.status}`);
        }

        todos = await response.json();
        renderTodos();

        setStatus(todos.length ? '' : 'Noch keine Todos vorhanden.');
    } catch (error) {
        showError(error.message);
        setStatus('Todos konnten nicht geladen werden.');
    }
}

async function createTodo(text, deadline) {
    clearError();

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                text,
                deadline: deadline || null,
            }),
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || `POST fehlgeschlagen: ${response.status}`);
        }

        await fetchTodos();
    } catch (error) {
        showError(error.message);
    }
}

async function updateTodo(id, text, deadline) {
    clearError();

    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                id,
                text,
                deadline: deadline || null,
            }),
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || `PUT fehlgeschlagen: ${response.status}`);
        }

        await fetchTodos();
    } catch (error) {
        showError(error.message);
    }
}

function renderTodos() {
    todoList.innerHTML = '';

    todos.forEach((todo) => {
        const card = document.createElement('div');
        card.className = 'card';

        const title = document.createElement('div');
        title.className = 'todo-title';
        title.textContent = todo.text;

        const deadline = document.createElement('div');
        deadline.innerHTML = `<strong>Deadline:</strong> ${formatDeadline(todo.deadline)}`;

        const actions = document.createElement('div');
        actions.className = 'actions';

        const editButton = document.createElement('button');
        editButton.textContent = 'Bearbeiten';

        const editor = document.createElement('div');
        editor.style.display = 'none';
        editor.style.marginTop = '12px';

        const editRow1 = document.createElement('div');
        editRow1.className = 'row';

        const editTextInput = document.createElement('input');
        editTextInput.type = 'text';
        editTextInput.value = todo.text;

        const editDeadlineInput = document.createElement('input');
        editDeadlineInput.type = 'datetime-local';
        editDeadlineInput.value = toDatetimeLocalValue(todo.deadline);

        editRow1.appendChild(editTextInput);
        editRow1.appendChild(editDeadlineInput);

        const editRow2 = document.createElement('div');
        editRow2.className = 'actions';

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Speichern';

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Abbrechen';
        cancelButton.className = 'secondary';

        saveButton.addEventListener('click', async () => {
            const newText = editTextInput.value.trim();
            const newDeadline = editDeadlineInput.value;

            if (!newText) {
                showError('Der Todo-Text darf nicht leer sein.');
                return;
            }

            await updateTodo(todo.id, newText, newDeadline);
        });

        cancelButton.addEventListener('click', () => {
            editor.style.display = 'none';
        });

        editButton.addEventListener('click', () => {
            editor.style.display = editor.style.display === 'none' ? 'block' : 'none';
        });

        editRow2.appendChild(saveButton);
        editRow2.appendChild(cancelButton);

        editor.appendChild(editRow1);
        editor.appendChild(editRow2);

        actions.appendChild(editButton);

        card.appendChild(title);
        card.appendChild(deadline);
        card.appendChild(actions);
        card.appendChild(editor);

        todoList.appendChild(card);
    });
}

todoForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const text = newTextInput.value.trim();
    const deadline = newDeadlineInput.value;

    if (!text) {
        showError('Bitte einen Todo-Text eingeben.');
        return;
    }

    await createTodo(text, deadline);

    newTextInput.value = '';
    newDeadlineInput.value = '';
});

fetchTodos();