// Garante que todo o script rode apenas quando o DOM (a estrutura da página) estiver completamente carregado.
document.addEventListener('DOMContentLoaded', () => {

  // --- SELEÇÃO DOS ELEMENTOS DO DOM ---
  // Mapeia todos os elementos HTML que o script precisa manipular para variáveis.
  const form = document.getElementById('bingoForm');
  const cardNameInput = document.getElementById('cardName');
  const cardColorSelector = document.getElementById('cardColor');
  const inputsContainer = document.getElementById('inputs');
  const gameRuleSelector = document.getElementById('gameRule');
  const resetGameBtn = document.getElementById('resetGameBtn');
  
  const jornalGroup = document.getElementById('jornalGroup');
  const jornalCardsContainer = document.getElementById('jornalCards');
  const extrasGroup = document.getElementById('extrasGroup');
  const extrasCardsContainer = document.getElementById('extrasCards');

  const winnerModal = document.getElementById('winnerModal');
  const winnerMessage = document.getElementById('winnerMessage');
  
  // Seleciona os novos botões do modal
  const newRoundBtn = document.getElementById('newRoundBtn');
  const continueGameBtn = document.getElementById('continueGameBtn');

  const clearAllBtn = document.getElementById('clearAllBtn');

  // Variável para controlar o estado do jogo (se já existe um vencedor)
  let gameHasWinner = false;

  // --- FUNÇÕES AUXILIARES E MODAIS ---

  /**
   * Cria e exibe um modal customizado para alertas e confirmações.
   * @param {string} message - A mensagem a ser exibida no modal.
   * @param {boolean} isConfirmation - Se true, exibe os botões "Confirmar" e "Cancelar". Se false, exibe apenas "OK".
   * @returns {Promise<boolean>} - Retorna uma promessa que resolve para `true` se confirmado, e `false` se cancelado.
   */
  function showCustomModal(message, isConfirmation = false) {
    return new Promise(resolve => {
      // Cria os elementos do modal dinamicamente
      const modalOverlay = document.createElement('div');
      modalOverlay.className = 'modal-overlay';

      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';

      const modalText = document.createElement('p');
      modalText.className = 'modal-text';
      modalText.textContent = message;

      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.gap = '10px';
      buttonContainer.style.justifyContent = 'center';


      // Botão de fechar/cancelar
      const closeButton = document.createElement('button');
      closeButton.className = 'modal-button';
      closeButton.textContent = isConfirmation ? 'Cancelar' : 'OK';
      closeButton.style.backgroundColor = '#6c757d'; // Cinza
      
      closeButton.onclick = () => {
        modalOverlay.remove();
        resolve(false);
      };

      modalContent.appendChild(modalText);
      
      // Se for um modal de confirmação, adiciona o botão de confirmar
      if (isConfirmation) {
        const confirmButton = document.createElement('button');
        confirmButton.className = 'modal-button';
        confirmButton.textContent = 'Confirmar';
        buttonContainer.appendChild(confirmButton);
        confirmButton.onclick = () => {
          modalOverlay.remove();
          resolve(true);
        };
      }

      buttonContainer.appendChild(closeButton);
      modalContent.appendChild(buttonContainer);
      modalOverlay.appendChild(modalContent);
      document.body.appendChild(modalOverlay);
    });
  }

  // --- FUNÇÕES PRINCIPAIS DO JOGO ---

  /**
   * Cria os 25 campos de input para o usuário preencher os números da cartela.
   */
  function createInputs() {
    inputsContainer.innerHTML = ''; // Limpa os inputs antigos
    for (let i = 0; i < 25; i++) {
      const wrapper = document.createElement('div');
      const input = document.createElement('input');
      input.type = 'number';
      input.min = 1;
      input.max = 75;

      // O campo central (índice 12) é o espaço "FREE"
      if (i === 12) {
        input.value = 'FREE';
        input.disabled = true; // Desabilita para não ser alterado
      } else {
        input.required = true;
        input.addEventListener('input', checkErrors); // Valida o número ao digitar
      }

      const error = document.createElement('span');
      error.className = 'error-message';
      
      wrapper.appendChild(input);
      wrapper.appendChild(error);
      inputsContainer.appendChild(wrapper);
    }
  }

  /**
   * Valida todos os campos de input, verificando números fora do intervalo (1-75) e duplicados.
   */
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

      if (i === 12 || values[i] === "") return; // Ignora o campo FREE e campos vazios

      const num = Number(values[i]);
      if (isNaN(num) || num < 1 || num > 75) {
        error.textContent = 'Inválido';
        input.classList.add('invalid');
      } else if (values.filter(v => v === values[i]).length > 1) {
        error.textContent = 'Repetido';
        input.classList.add('invalid');
      }
    });
  }

  /**
   * Adiciona uma nova cartela de bingo à interface.
   * @param {string[]} numbers - Array com os 25 números da cartela.
   * @param {string} name - O nome/série da cartela.
   * @param {string} color - A cor da cartela ('jornal', 'verde', etc.).
   */
  function addCard(numbers, name, color) {
    const container = document.createElement('div');
    container.classList.add('card-container', `card-${color}`);

    const cardTitle = document.createElement('h3');
    cardTitle.classList.add('card-title');
    cardTitle.textContent = name;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-card-btn';
    deleteBtn.innerHTML = '&times;'; // Símbolo 'x'
    deleteBtn.title = 'Excluir esta cartela';
    
    deleteBtn.addEventListener('click', async () => {
      const confirmed = await showCustomModal(`Tem certeza que deseja excluir a cartela "${name}"?`, true);
      if (confirmed) {
        const parentGroup = container.closest('.card-group');
        const parentGrid = container.parentElement;
        container.remove();
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
        // --- ALTERAÇÃO APLICADA ---
        // O evento de clique agora determina o estado (marcar/desmarcar)
        // e chama a função que afeta apenas o grupo correto.
        cell.addEventListener('click', (event) => {
          if (gameHasWinner) return; 
          
          const clickedCell = event.currentTarget;
          // O novo estado será o oposto do estado atual da célula clicada
          const shouldBeMarked = !clickedCell.classList.contains('marked');
          
          setMarkedStateByGroup(number, color, shouldBeMarked);
          checkAllCardsForWin();
        });
      }
      card.appendChild(cell);
    });

    container.appendChild(header);
    container.appendChild(card);

    if (color === 'jornal') {
      jornalCardsContainer.appendChild(container);
      jornalGroup.classList.remove('hidden');
    } else {
      extrasCardsContainer.appendChild(container);
      extrasGroup.classList.remove('hidden');
    }
  }
  
  /**
   * Marca ou desmarca um número em um grupo específico de cartelas (Jornal ou Coloridas).
   * @param {string} number - O número a ser marcado/desmarcado.
   * @param {string} sourceColor - A cor da cartela que originou o clique.
   * @param {boolean} shouldMark - True para marcar, false para desmarcar.
   */
  function setMarkedStateByGroup(number, sourceColor, shouldMark) {
    let targetCells;

    // Determina o grupo de cartelas a ser afetado
    if (sourceColor === 'jornal') {
      // Se o clique foi em uma cartela 'jornal', afeta apenas outras cartelas 'jornal'
      targetCells = document.querySelectorAll(`.card-jornal .cell[data-number="${number}"]`);
    } else {
      // Se o clique foi em uma cartela colorida, afeta todas as coloridas
      targetCells = document.querySelectorAll(`.card-verde .cell[data-number="${number}"], .card-rosa .cell[data-number="${number}"], .card-amarelo .cell[data-number="${number}"]`);
    }

    // Aplica o estado (marcado/desmarcado) a todas as células do grupo
    targetCells.forEach(cell => {
      if (shouldMark) {
        cell.classList.add('marked');
      } else {
        cell.classList.remove('marked');
      }
    });
  }

  function checkAllCardsForWin() {
    if (gameHasWinner) return;

    const allCards = document.querySelectorAll('.card-container');
    const rule = gameRuleSelector.value;
    const currentTurnWinners = [];
    let newWinnerFound = false;

    allCards.forEach(cardContainer => {
      const cells = Array.from(cardContainer.querySelectorAll('.cell'));
      if (checkWin(cells, rule)) {
        const winnerName = cardContainer.querySelector('.card-title').textContent;
        
        // Encontra a classe da cor, ignorando a classe 'card-container'.
        const colorClass = Array.from(cardContainer.classList).find(c => c.startsWith('card-') && c !== 'card-container');
        const color = colorClass ? colorClass.replace('card-', '') : '';
        // Formata a primeira letra da cor para maiúscula.
        const colorText = color.charAt(0).toUpperCase() + color.slice(1);
        
        // Cria o identificador do vencedor no formato "Cor - Nome".
        const winnerIdentifier = `${colorText} - ${winnerName}`;

        if (!cardContainer.classList.contains('winner')) {
            newWinnerFound = true;
            cardContainer.classList.add('winner'); 
        }
        if (!currentTurnWinners.includes(winnerIdentifier)) {
          currentTurnWinners.push(winnerIdentifier);
        }
      } else {
         // Se um número for desmarcado, o status de vencedor é removido
         if (!gameHasWinner) {
            cardContainer.classList.remove('winner');
         }
      }
    });

    if (newWinnerFound) {
      gameHasWinner = true;
      const ruleText = gameRuleSelector.options[gameRuleSelector.selectedIndex].text;
      let messageText;

      if (currentTurnWinners.length === 1) {
        // Usa o novo identificador formatado na mensagem.
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

  // --- FUNÇÕES DE VERIFICAÇÃO DE VITÓRIA ---
  
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

  function resetGame() {
    document.querySelectorAll('.cell').forEach((cell) => {
      if (cell.dataset.number !== '★') {
        cell.classList.remove('marked');
      }
    });
    document.querySelectorAll('.card-container.winner').forEach(card => card.classList.remove('winner'));
    
    gameHasWinner = false;
    winnerModal.classList.add('hidden'); 
    gameRuleSelector.disabled = false; 
  }

  // --- EVENT LISTENERS (OUVINTES DE EVENTOS) ---

  form.addEventListener('submit', async function (e) {
    e.preventDefault(); 
    const cardName = cardNameInput.value.trim();
    const cardColor = cardColorSelector.value;

    if (cardName === '') {
      await showCustomModal("Por favor, dê um nome para a cartela.");
      cardNameInput.focus();
      return;
    }
    if (cardColor === '') {
        await showCustomModal("Por favor, selecione uma cor para a cartela.");
        cardColorSelector.focus();
        return;
    }

    checkErrors(); 
    const inputs = Array.from(inputsContainer.querySelectorAll('input'));
    if (inputs.some(input => input.classList.contains('invalid'))) {
      await showCustomModal("Corrija os erros nos números antes de gerar a cartela.");
      return;
    }
    if (inputs.some((input, i) => i !== 12 && input.value.trim() === '')) {
      await showCustomModal("Preencha todos os campos de número!");
      return;
    }

    const values = inputs.map((input, index) =>
      index === 12 ? "★" : input.value.trim()
    );

    addCard(values, cardName, cardColor);
    
    createInputs();
    cardNameInput.value = '';
    cardColorSelector.value = '';
  });

  // Botão "Nova Rodada": Limpa o jogo para uma nova rodada.
  newRoundBtn.addEventListener('click', resetGame);

  // Botão "Continuar Jogo": Fecha o modal e permite que mais números sejam marcados.
  continueGameBtn.addEventListener('click', () => {
    winnerModal.classList.add('hidden'); // Apenas esconde o modal
    gameHasWinner = false; // Permite que o jogo continue e novos números sejam marcados
    
    // Remove o destaque dourado das cartelas que eram vencedoras, conforme solicitado.
    document.querySelectorAll('.card-container.winner').forEach(card => {
      card.classList.remove('winner');
    });
    // A regra do jogo continua travada para manter a consistência da rodada.
  });

  clearAllBtn.addEventListener('click', () => {
    if (gameHasWinner) return;
    resetGame(); 
  });

  gameRuleSelector.addEventListener('change', checkAllCardsForWin);


  // --- INICIALIZAÇÃO DO APP ---
  const yearSpan = document.getElementById('currentYear');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
  createInputs();
});
