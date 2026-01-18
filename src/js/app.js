import '../css/style.css';

const STORAGE_KEY = 'trello-dnd-board';

let columns = [
  { id: 'todo',       title: 'To Do',       cards: [] },
  { id: 'in-progress', title: 'In Progress', cards: [] },
  { id: 'done',       title: 'Done',        cards: [] },
];

let draggedCard = null;
let placeholder = null;

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      columns = JSON.parse(saved);
    } catch (e) {
      console.warn('Некорректные данные в localStorage', e);
    }
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
}

function render() {
  const board = document.querySelector('.board');
  board.innerHTML = '';

  columns.forEach(column => {
    const colEl = document.createElement('div');
    colEl.className = 'column';
    colEl.dataset.id = column.id;

    colEl.innerHTML = `
      <h2 class="column-title">${column.title}</h2>
      <div class="cards"></div>
      <button class="add-card">+ Add another card</button>
      <div class="add-form" style="display:none;">
        <textarea placeholder="Введите текст карточки..." class="textarea"></textarea>
        <div class="form-buttons">
          <button class="btn-add">Добавить карточку</button>
          <button class="btn-cancel">Отмена</button>
        </div>
      </div>
    `;

    const cardsContainer = colEl.querySelector('.cards');

    column.cards.forEach((text, index) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.draggable = true;
      card.dataset.col = column.id;
      card.dataset.index = index;
      card.innerHTML = `
        <div class="card-text">${text}</div>
        <span class="delete-btn">×</span>
      `;

      card.querySelector('.delete-btn').addEventListener('click', e => {
        e.stopPropagation();
        column.cards.splice(index, 1);
        saveState();
        render();
      });

      card.addEventListener('dragstart', e => {
        draggedCard = card;
        setTimeout(() => card.classList.add('dragged'), 0);
        document.body.classList.add('grabbing');
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragged');
        document.body.classList.remove('grabbing');
        removePlaceholder();
        draggedCard = null;
      });

      cardsContainer.appendChild(card);
    });

    const addBtn = colEl.querySelector('.add-card');
    const form = colEl.querySelector('.add-form');
    const textarea = colEl.querySelector('.textarea');
    const btnAdd = colEl.querySelector('.btn-add');
    const btnCancel = colEl.querySelector('.btn-cancel');

    addBtn.addEventListener('click', () => {
      form.style.display = 'block';
      addBtn.style.display = 'none';
      textarea.focus();
    });

    btnCancel.addEventListener('click', () => {
      form.style.display = 'none';
      addBtn.style.display = 'block';
      textarea.value = '';
    });

    btnAdd.addEventListener('click', () => {
      const text = textarea.value.trim();
      if (text) {
        column.cards.push(text);
        saveState();
        render();
      }
      btnCancel.click();
    });

    colEl.addEventListener('dragover', e => {
      e.preventDefault();
      if (!draggedCard) return;
      onDragOver(e, cardsContainer);
    });

    colEl.addEventListener('drop', e => {
      e.preventDefault();
      if (!draggedCard) return;
      onDrop(e, column.id, cardsContainer);
    });

    colEl.addEventListener('dragleave', removePlaceholder);

    board.appendChild(colEl);
  });
}

function onDragOver(e, container) {
  removePlaceholder();

  const afterElement = getDragAfterElement(container, e.clientY);

  placeholder = document.createElement('div');
  placeholder.className = 'placeholder';
  placeholder.style.height = draggedCard.offsetHeight + 'px';

  if (afterElement == null) {
    container.appendChild(placeholder);
  } else {
    container.insertBefore(placeholder, afterElement);
  }
}

function onDrop(e, targetColId, container) {
  removePlaceholder();

  const sourceColId = draggedCard.dataset.col;
  const sourceIndex = parseInt(draggedCard.dataset.index);

  const sourceCol = columns.find(c => c.id === sourceColId);
  const [cardText] = sourceCol.cards.splice(sourceIndex, 1);

  const targetCol = columns.find(c => c.id === targetColId);

  const afterElement = getDragAfterElement(container, e.clientY);
  const targetIndex = afterElement
    ? Array.from(container.children).indexOf(afterElement)
    : targetCol.cards.length;

  targetCol.cards.splice(targetIndex, 0, cardText);

  saveState();
  render();
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.card:not(.dragged)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function removePlaceholder() {
  if (placeholder) {
    placeholder.remove();
    placeholder = null;
  }
}

loadState();
render();
