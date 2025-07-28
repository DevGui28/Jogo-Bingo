const form = document.getElementById('bingoForm');
const cardNameInput = document.getElementById('cardName');
const cardColorSelector = document.getElementById('cardColor');
const inputsContainer = document.getElementById('inputs');
// const bingoCardsContainer = document.getElementById('bingoCards'); // Removido
const gameRuleSelector = document.getElementById('gameRule');
const resetGameBtn = document.getElementById('resetGameBtn');
let gameHasWinner = false;

// NOVOS CONTAINERS PARA OS GRUPOS DE CARTELAS
const jornalGroup = document.getElementById('jornalGroup');
const jornalCardsContainer = document.getElementById('jornalCards');
const extrasGroup = document.getElementById('extrasGroup');
const extrasCardsContainer = document.getElementById('extrasCards');


// Elementos do Modal de Vitória
const winnerModal = document.getElementById('winnerModal');
const winnerMessage = document.getElementById('winnerMessage');
const playAgainBtn = document.getElementById('playAgainBtn');

// Botão de Limpar
const clearAllBtn = document.getElementById('clearAllBtn');

// --- Funções de Criação e Validação ---
function createInputs() {
  inputsContainer.innerHTML = '';
  for (let i = 0; i < 25; i++) {
    const wrapper = document.createElement('div');
    const input = document.createElement('input');
    input.type = 'number';
    input.min = 1;
    input.max = 75;
    if (i === 12) {
      input.value = 'FREE';
      input.disabled = true;
    } else {
      input.required = true;
      input.addEventListener('input', checkErrors);
    }
    const error = document.createElement('span');
    error.className = 'error-message';
    wrapper.appendChild(input);
    wrapper.appendChild(error);
    inputsContainer.appendChild(wrapper);
  }
}

function checkErrors() {
  const wrappers = Array.from(inputsContainer.children);
  const values = wrappers.map((wrapper, i) =>
    i === 12 ? "FREE" : wrapper.querySelector('input').value.trim()
  );
  wrappers.forEach((wrapper, i) => {
    const input = wrapper.querySelector('input');
    const error = wrapper.querySelector('.error-message');
    input.classList.remove('invalid');
    error.textContent = '';
    if (i === 12 || values[i] === "") return;
    const num = Number(values[i]);
    if (isNaN(num) || num < 1 || num > 75) {
      error.textContent = 'Inválido (1-75)';
      input.classList.add('invalid');
    } else if (values.filter(v => v === values[i]).length > 1) {
      error.textContent = 'Repetido';
      input.classList.add('invalid');
    }
  });
}

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const cardName = cardNameInput.value.trim();
  const cardColor = cardColorSelector.value;

  if (cardName === '') {
    alert("Por favor, dê um nome para a cartela.");
    cardNameInput.focus();
    return;
  }
  checkErrors();
  const inputs = Array.from(inputsContainer.querySelectorAll('input'));
  if (inputs.some(input => input.classList.contains('invalid'))) {
    alert("Corrija os erros nos números antes de gerar a cartela.");
    return;
  }
  if (inputs.some((input, i) => i !== 12 && input.value.trim() === '')) {
    alert("Preencha todos os campos de número!");
    return;
  }
  const values = inputs.map((input, index) =>
    index === 12 ? "★" : input.value.trim()
  );
  
  addCard(values, cardName, cardColor);

  createInputs();
  cardNameInput.value = '';
});

// --- Funções do Jogo ---

/**
 * FUNÇÃO ATUALIZADA
 * - Adiciona a cartela no grupo correto (Jornal ou Extras).
 * - Mostra/esconde o título do grupo conforme necessário.
 * - Esconde o título do grupo se a última cartela for excluída.
 */
function addCard(numbers, name, color) {
  const container = document.createElement('div');
  container.classList.add('card-container');
  container.classList.add(`card-${color}`);

  const cardTitle = document.createElement('h3');
  cardTitle.classList.add('card-title');
  cardTitle.textContent = name;
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-card-btn';
  deleteBtn.innerHTML = '&times;';
  deleteBtn.title = 'Excluir esta cartela';
  deleteBtn.addEventListener('click', () => {
    if (confirm(`Tem certeza que deseja excluir a cartela "${name}"?`)) {
      const parentGroup = container.closest('.card-group');
      const parentGrid = container.parentElement;

      container.remove();

      // Se a grade do grupo ficar vazia, esconde o grupo inteiro
      if (parentGrid.children.length === 0) {
        parentGroup.classList.add('hidden');
      }
    }
  });

  container.appendChild(deleteBtn);
  container.appendChild(cardTitle);

  const header = document.createElement('div');
  header.classList.add('card');
  'BINGO'.split('').forEach(letter => {
    const headerCell = document.createElement('div');
    headerCell.classList.add('header-cell');
    headerCell.textContent = letter;
    header.appendChild(headerCell);
  });
  
  const card = document.createElement('div');
  card.classList.add('card');
  numbers.forEach((number, index) => {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.textContent = number;
    cell.dataset.number = number;
    if (index === 12) {
      cell.classList.add('marked');
    } else {
      cell.addEventListener('click', () => {
        if (gameHasWinner) return;
        toggleMarkNumberByColor(number, color);
        checkAllCardsForWin();
      });
    }
    card.appendChild(cell);
  });
  
  container.appendChild(header);
  container.appendChild(card);

  // Lógica para decidir em qual grupo adicionar a cartela
  if (color === 'jornal') {
    jornalCardsContainer.appendChild(container);
    jornalGroup.classList.remove('hidden'); // Mostra o grupo se estiver escondido
  } else {
    extrasCardsContainer.appendChild(container);
    extrasGroup.classList.remove('hidden'); // Mostra o grupo se estiver escondido
  }
}

function toggleMarkNumberByColor(number, sourceColor) {
  const targetSelector = `.card-${sourceColor}`;
  const targetContainers = document.querySelectorAll(targetSelector);
  targetContainers.forEach(container => {
    const cellToToggle = container.querySelector(`.cell[data-number="${number}"]`);
    if (cellToToggle) {
      cellToToggle.classList.toggle('marked');
    }
  });
}

function checkAllCardsForWin() {
  if (gameHasWinner) return;
  const allCards = document.querySelectorAll('.card-container');
  const rule = gameRuleSelector.value;
  const currentTurnWinners = [];
  allCards.forEach(cardContainer => {
    const cells = Array.from(cardContainer.querySelectorAll('.cell'));
    if (checkWin(cells, rule)) {
      const winnerName = cardContainer.querySelector('.card-title').textContent;
      if (!currentTurnWinners.includes(winnerName)) {
        currentTurnWinners.push(winnerName);
      }
      cardContainer.classList.add('winner');
    } else {
      cardContainer.classList.remove('winner');
    }
  });
  if (currentTurnWinners.length > 0) {
    gameHasWinner = true;
    const ruleText = gameRuleSelector.options[gameRuleSelector.selectedIndex].text;
    let messageText;
    if (currentTurnWinners.length === 1) {
      messageText = `A cartela "${currentTurnWinners[0]}" venceu com a regra: ${ruleText}!`;
    } else {
      const winnerNamesString = currentTurnWinners.join('", "');
      messageText = `As cartelas "${winnerNamesString}" venceram com a regra: ${ruleText}!`;
    }
    winnerMessage.textContent = messageText;
    winnerModal.classList.remove('hidden');
    gameRuleSelector.disabled = true;
  }
}

// --- Funções de Verificação de Vitória ---
function checkFourCorners(isMarked) { return isMarked(0) && isMarked(4) && isMarked(20) && isMarked(24); }
function checkHorizontal(isMarked) { for (let i = 0; i < 5; i++) { if (isMarked(i*5) && isMarked(i*5+1) && isMarked(i*5+2) && isMarked(i*5+3) && isMarked(i*5+4)) return true; } return false; }
function checkVertical(isMarked) { for (let i = 0; i < 5; i++) { if (isMarked(i) && isMarked(i+5) && isMarked(i+10) && isMarked(i+15) && isMarked(i+20)) return true; } return false; }
function checkDiagonal(isMarked) { const d1 = isMarked(0) && isMarked(6) && isMarked(12) && isMarked(18) && isMarked(24); const d2 = isMarked(4) && isMarked(8) && isMarked(12) && isMarked(16) && isMarked(20); return d1 || d2; }
function checkWin(cells, rule) {
  const isMarked = (index) => cells[index].classList.contains('marked');
  switch (rule) {
    case 'four_corners': return checkFourCorners(isMarked);
    case 'horizontal_line': return checkHorizontal(isMarked);
    case 'vertical_line': return checkVertical(isMarked);
    case 'diagonal': return checkDiagonal(isMarked);
    case 'full_card': return cells.every(cell => cell.classList.contains('marked'));
    case 'padrão_especial': return checkFourCorners(isMarked) || checkHorizontal(isMarked) || checkVertical(isMarked) || checkDiagonal(isMarked);
    default: return false;
  }
}

// --- Funções e Event Listeners de Controle ---
function resetGame() {
  document.querySelectorAll('.cell').forEach((cell) => { if (cell.textContent !== '★') { cell.classList.remove('marked'); } });
  document.querySelectorAll('.card-container.winner').forEach(card => { card.classList.remove('winner'); });
  gameHasWinner = false;
  resetGameBtn.classList.add('hidden');
  gameRuleSelector.disabled = false;
}

resetGameBtn.addEventListener('click', resetGame);

playAgainBtn.addEventListener('click', () => {
  winnerModal.classList.add('hidden');
  resetGame();
});

clearAllBtn.addEventListener('click', () => {
  if (gameHasWinner) return;
  document.querySelectorAll('.cell.marked').forEach(cell => {
    if (cell.textContent !== '★') {
      cell.classList.remove('marked');
    }
  });
});

// --- INICIALIZAÇÃO DO APP ---
document.addEventListener('DOMContentLoaded', () => {
  const yearSpan = document.getElementById('currentYear');
  if (yearSpan) { yearSpan.textContent = new Date().getFullYear(); }
  createInputs();
});
